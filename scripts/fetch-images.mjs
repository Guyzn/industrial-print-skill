#!/usr/bin/env node
/**
 * fetch-images.mjs — 从官网抓取图片，按印刷用途筛选并登记来源
 *
 * 为什么需要它：企业介绍/产品目录里的照片，最省事的来源是自家官网。
 * 但官网图片有两个坑——① 多为 72–150 ppi 的网页压缩图，印出来发虚；
 * ② 来源与授权说不清，出了问题没法追溯。这个脚本把两件事一起解决：
 * 抓下来、量出真实像素、算出「300 ppi 下最大能印多宽」，并写一份来源清单。
 *
 * 用法
 *   node scripts/fetch-images.mjs https://example.com --out ./images
 *   node scripts/fetch-images.mjs https://example.com/products --out ./images \
 *        --limit 30 --min-width 1200 --print-width 176
 *   node scripts/fetch-images.mjs --from-html saved.html --base https://example.com --out ./images
 *   node scripts/fetch-images.mjs https://example.com --dry-run      # 只列不合规，不下载
 *
 * 参数
 *   --out <dir>          输出目录（默认 ./images）
 *   --limit <n>          最多下载 n 张（默认 40）
 *   --min-width <px>     最小像素宽（默认 1200）
 *   --print-width <mm>   目标印刷宽度（默认 176 = A4 减去左右版心），用于算 ppi
 *   --allow <hosts>      额外允许的域名，逗号分隔（如 cdn.example.com）
 *   --include-logo       保留文件名含 logo/icon 的图（默认剔除）
 *   --dry-run            只解析与筛选，不写盘
 *   --from-html <file>   不联网抓页面，直接解析本地 HTML
 *   --base <url>         配合 --from-html 解析相对路径
 *
 * 纪律（脚本强制 + 文档约定）
 *   1. 只抓同域（含 --allow 白名单），不外扩到第三方图库
 *   2. 先读 robots.txt，命中 Disallow 即退出
 *   3. 记录每张图的来源页与原始 URL，写 manifest.json + sources.md
 *   4. 低于 --min-width 的直接跳过并计数，不做“先下下来再说”
 *   5. 不绕过登录、不破解防盗链、不抓水印图库
 *
 * 零依赖，Node >= 18（需要全局 fetch）
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

/* ---------------- 参数 ---------------- */
function parseArgs(argv) {
  const a = { out: './images', limit: 40, minWidth: 1200, printWidth: 176, allow: [], includeLogo: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const next = () => argv[++i];
    switch (k) {
      case '--out': a.out = next(); break;
      case '--limit': a.limit = Number(next()); break;
      case '--min-width': a.minWidth = Number(next()); break;
      case '--print-width': a.printWidth = Number(next()); break;
      case '--allow': a.allow = String(next()).split(',').map((s) => s.trim()).filter(Boolean); break;
      case '--include-logo': a.includeLogo = true; break;
      case '--dry-run': a.dryRun = true; break;
      case '--from-html': a.fromHtml = next(); break;
      case '--base': a.base = next(); break;
      case '--help': case '-h': a.help = true; break;
      default:
        if (!k.startsWith('--')) a.url = k;
    }
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || (!args.url && !args.fromHtml)) {
  console.log(`用法: node scripts/fetch-images.mjs <url> --out <dir> [选项]
  --limit 40          最多下载张数
  --min-width 1200    最小像素宽
  --print-width 176   目标印刷宽度 mm（算 300ppi 是否够用）
  --allow cdn.a.com   额外允许域名
  --include-logo      保留 logo/icon
  --dry-run           只列不下载
  --from-html <file>  解析本地 HTML（配合 --base）`);
  process.exit(args.help ? 0 : 2);
}

const UA = 'industrial-print-skill/1.0 (print image sourcing; +https://github.com/Guyzn/industrial-print-skill)';

/* ---------------- 工具 ---------------- */
const abs = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const sameSite = (a, b) => a === b || a.endsWith('.' + b) || b.endsWith('.' + a);

function decodeEntities(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"');
}

/* ---------------- 尺寸识别（无依赖） ---------------- */
function imageSize(buf) {
  // PNG
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), ext: 'png' };
  }
  // GIF
  if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8), ext: 'gif' };
  }
  // JPEG：扫 SOF0–SOF15（跳过 DHT/DAC 等）
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5), ext: 'jpg' };
      }
      i += 2 + len;
    }
    return { w: 0, h: 0, ext: 'jpg' };
  }
  // WebP
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8X') {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { w, h, ext: 'webp' };
    }
    if (fmt === 'VP8 ') {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, ext: 'webp' };
    }
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1, ext: 'webp' };
    }
  }
  // SVG：读 width/height 或 viewBox
  const head = buf.toString('utf8', 0, Math.min(buf.length, 800));
  if (/<svg[\s>]/i.test(head)) {
    const w = /width=["']?(\d+(?:\.\d+)?)/i.exec(head);
    const h = /height=["']?(\d+(?:\.\d+)?)/i.exec(head);
    const vb = /viewBox=["']([\d.\s-]+)["']/i.exec(head);
    if (w && h) return { w: Math.round(+w[1]), h: Math.round(+h[1]), ext: 'svg' };
    if (vb) {
      const p = vb[1].trim().split(/\s+/).map(Number);
      return { w: Math.round(p[2]), h: Math.round(p[3]), ext: 'svg' };
    }
    return { w: 0, h: 0, ext: 'svg' };
  }
  return null;
}

/* ---------------- robots.txt ---------------- */
async function robotsAllows(pageUrl) {
  const u = new URL(pageUrl);
  try {
    const res = await fetch(`${u.origin}/robots.txt`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: true, note: 'robots.txt 不可读，按允许处理' };
    const txt = await res.text();
    const lines = txt.split(/\r?\n/);
    let applies = false;
    const disallow = [];
    for (const raw of lines) {
      const line = raw.replace(/#.*/, '').trim();
      if (!line) continue;
      const [k, ...rest] = line.split(':');
      const key = k.trim().toLowerCase();
      const val = rest.join(':').trim();
      if (key === 'user-agent') applies = (val === '*' || /industrial-print/i.test(val));
      else if (key === 'disallow' && applies && val) disallow.push(val);
    }
    const path = u.pathname || '/';
    const hit = disallow.find((d) => path.startsWith(d));
    return hit ? { ok: false, note: `robots.txt 禁止抓取 ${hit}` } : { ok: true, note: 'robots.txt 未禁止' };
  } catch (e) {
    return { ok: true, note: `robots.txt 读取失败（${e.message.slice(0, 40)}），按允许处理` };
  }
}

/* ---------------- 候选提取 ---------------- */
function extractCandidates(html, pageUrl) {
  const base = (() => {
    const b = /<base[^>]+href=["']([^"']+)["']/i.exec(html);
    return b ? abs(b[1], pageUrl) : pageUrl;
  })();
  const out = [];
  const push = (u, via) => { const a = abs(decodeEntities(u), base); if (a) out.push({ url: a, via }); };

  // <img src / data-src / data-original / data-lazy>
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    for (const attr of ['src', 'data-src', 'data-original', 'data-lazy', 'data-image']) {
      const v = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i').exec(tag);
      if (v) push(v[1], `img[${attr}]`);
    }
    const ss = /srcset\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (ss) {
      // 取 srcset 里声明的最大宽度项
      const items = ss[1].split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
        const [u, d] = s.split(/\s+/);
        return { u, w: d && /(\d+)w/.test(d) ? +/(\d+)w/.exec(d)[1] : 0 };
      }).sort((a, b) => b.w - a.w);
      if (items[0]) push(items[0].u, 'img[srcset]');
    }
  }
  // <source srcset>
  for (const m of html.matchAll(/<source\b[^>]+srcset=["']([^"']+)["']/gi)) {
    const first = m[1].split(',')[0].trim().split(/\s+/)[0];
    if (first) push(first, 'source[srcset]');
  }
  // og:image
  for (const m of html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)) push(m[1], 'og:image');
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi)) push(m[1], 'og:image');
  // 内联 background-image
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi)) push(m[1], 'inline-bg');

  // 去重，保持顺序
  const seen = new Set();
  return out.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)));
}

/* ---------------- 主流程 ---------------- */
const fmt = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`);

async function fetchBinary(url, maxBytes = 25 * 1024 * 1024) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'image/*,*/*;q=0.8' },
    signal: AbortSignal.timeout(20000),
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  const len = Number(res.headers.get('content-length') || 0);
  if (len > maxBytes) throw new Error(`超大 ${fmt(len)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error(`超大 ${fmt(buf.length)}`);
  return { buf, type, finalUrl: res.url || url };
}

async function main() {
  const pageUrl = args.url || args.base || 'https://example.com';
  let html;
  if (args.fromHtml) {
    if (!existsSync(args.fromHtml)) { console.error(`找不到文件: ${args.fromHtml}`); process.exit(2); }
    html = readFileSync(args.fromHtml, 'utf8');
    console.log(`解析本地 HTML: ${args.fromHtml}`);
  } else {
    const rb = await robotsAllows(pageUrl);
    console.log(`robots: ${rb.note}`);
    if (!rb.ok) { console.error(`已停止：${rb.note}`); process.exit(3); }
    const res = await fetch(pageUrl, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) { console.error(`页面抓取失败: HTTP ${res.status}`); process.exit(1); }
    html = await res.text();
  }

  const pageHost = hostOf(pageUrl);
  const all = extractCandidates(html, pageUrl);
  console.log(`候选图片: ${all.length} 个（页面 ${pageHost}）`);

  const keep = [];
  let offsite = 0, logo = 0, dup = 0;
  const seen = new Set();
  for (const c of all) {
    const h = hostOf(c.url);
    if (!(sameSite(h, pageHost) || args.allow.some((a) => sameSite(h, hostOf(a))))) { offsite++; continue; }
    if (!args.includeLogo && /(?:^|[\/_-])(logo|icon|favicon|sprite|avatar)(?:[\/_.-]|$)/i.test(c.url)) { logo++; continue; }
    if (seen.has(c.url)) { dup++; continue; }
    seen.add(c.url);
    keep.push(c);
  }
  console.log(`同域保留: ${keep.length}（剔除站外 ${offsite} / logo 类 ${logo} / 重复 ${dup}）`);

  if (args.dryRun) {
    keep.slice(0, args.limit).forEach((c, i) => console.log(`  ${String(i + 1).padStart(2)} ${c.url}`));
    console.log(`\n--dry-run：未下载。去掉该参数即可写入 ${args.out}`);
    return;
  }

  const outDir = resolve(args.out);
  mkdirSync(outDir, { recursive: true });

  const manifest = [];
  let n = 0, skipped = 0, failed = 0;
  for (const c of keep) {
    if (n >= args.limit) break;
    try {
      const { buf, type } = await fetchBinary(c.url);
      const size = imageSize(buf);
      if (!size) { failed++; console.log(`  ✗ 非图片 ${c.url.slice(-60)}`); continue; }
      const w = size.w || 0;
      if (w && w < args.minWidth) {
        skipped++;
        console.log(`  – 跳过 ${w}px 宽（< ${args.minWidth}）  ${c.url.slice(-64)}`);
        continue;
      }
      const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8);
      const ext = size.ext || ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' }[type.split(';')[0]] || 'jpg');
      const name = `img-${hash}.${ext}`;
      writeFileSync(join(outDir, name), buf);
      const ppiAtPrint = w ? Math.round(w / (args.printWidth / 25.4)) : null;
      const maxPrintMm = w ? Math.round((w / 300) * 25.4) : null;
      manifest.push({
        file: name,
        source: c.url,
        via: c.via,
        bytes: buf.length,
        width: w,
        height: size.h,
        ppi_at_print_width: ppiAtPrint,
        max_print_width_at_300ppi_mm: maxPrintMm,
        ok_for_print: ppiAtPrint != null && ppiAtPrint >= 300,
        licence: 'UNVERIFIED — 使用前须确认版权'
      });
      n++;
      const flag = ppiAtPrint == null ? '?' : ppiAtPrint >= 300 ? '✓' : '⚠';
      console.log(`  ${flag} ${name}  ${w}×${size.h}  @${args.printWidth}mm → ${ppiAtPrint ?? '?'}ppi  ${fmt(buf.length)}`);
      await new Promise((r) => setTimeout(r, 120));   // 轻限速，别把人家站点打疼
    } catch (e) {
      failed++;
      console.log(`  ✗ ${e.message}  ${c.url.slice(-64)}`);
    }
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    page: pageUrl,
    fetched_at: new Date().toISOString(),
    print_width_mm: args.printWidth,
    min_width_px: args.minWidth,
    stats: { downloaded: n, skipped_small: skipped, failed },
    images: manifest
  }, null, 2));

  const md = [
    `# 图片来源清单`,
    ``,
    `抓取页面：${pageUrl}`,
    `抓取时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    `目标印刷宽度：${args.printWidth}mm（300 ppi 判定）`,
    ``,
    `> 每一行都必须人工确认授权。官网图片不等于可自由使用——`,
    `> 摄影师、图库、客户提供的照片各有归属，商用前请确认。`,
    ``,
    `| 文件 | 像素 | 300ppi 可印宽 | 判定 | 来源 | 授权 |`,
    `|---|---|---|---|---|---|`,
    ...manifest.map((m) =>
      `| \`${m.file}\` | ${m.width}×${m.height} | ${m.max_print_width_at_300ppi_mm}mm | ` +
      `${m.ok_for_print ? '够' : '不够'} | ${m.source} | 待确认 |`),
    ``,
    `## 未采用`,
    ``,
    `- 像素宽低于 ${args.minWidth}px：${skipped} 张`,
    `- 非图片或抓取失败：${failed} 张`,
    `- 站外域名：${offsite} 张（未下载）`,
    `- logo / icon 类：${logo} 张（未下载，除非加 --include-logo）`
  ].join('\n');
  writeFileSync(join(outDir, 'sources.md'), md);

  console.log(`\n完成：${n} 张 → ${outDir}`);
  console.log(`  清单：${join(outDir, 'manifest.json')}`);
  console.log(`  来源：${join(outDir, 'sources.md')}`);
  if (manifest.some((m) => !m.ok_for_print)) {
    console.log(`  ⚠ ${manifest.filter((m) => !m.ok_for_print).length} 张在 ${args.printWidth}mm 下不足 300ppi——印刷会发虚`);
  }
}

main().catch((e) => { console.error(`失败: ${e.message}`); process.exit(1); });
