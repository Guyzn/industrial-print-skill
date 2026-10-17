#!/usr/bin/env node
/**
 * _shared/inline-fonts.mjs — 字体内嵌器
 * 把「一个 .html + fonts/ + images/」的目录产物压成真正的一个文件。
 *
 * 做什么：
 *   1. 从 HTML 文本、<style> 内容、被引用 SVG 的 <text> 里收集实际用到的字符
 *   2. 叠加安全缓冲字符（ASCII、Latin-1、拉丁扩展、希腊、西里尔、通用标点、
 *      上下标、货币、™©®、箭头、数学运算符、带圈数字、几何图形、杂项符号、
 *      CJK 标点、假名、全角），防止后期改稿出现豆腐块。
 *      刻意不收冷门符号区——多数字体本来也没有，白占体积
 *   3. 子集化每个字体（探测链自动降级），按 MIME 转 base64，替换 url("./fonts/x")
 *   4. 图片转 base64，替换 src="images/x"
 *   5. --replace 时覆盖原文件并清掉 fonts/ 与 images/ 目录
 *
 * 子集化探测链（按能力自动降级）：
 *   1. pyftsubset（fontTools，最全，支持 woff2 需 brotli）
 *   2. python -m fontTools.subset
 *   3. hb-subset（HarfBuzz，只吃 ttf/otf；woff2 加载失败自动退化为全量内嵌）
 *   4. 全量内嵌（仍是单文件，只是大）
 *
 * 含文字 SVG 的特殊处理：
 *   <img> 引入的 SVG 拿不到页面的 @font-face，里面的中文会落到系统字体，
 *   表现为 PDF 里混进 PingFang SC / Arial，换台机器就变形。本工具会检测
 *   SVG 里的 <text>，在 SVG 内部注入一份 MiSans-Semibold 子集字体与
 *   text{font-family:"WBEmbeddedSVG"} 规则（CSS 规则优先级高于 font-family
 *   表现属性，不必逐个改 <text>）。
 *
 * 用法：
 *   node _shared/inline-fonts.mjs ./手册.html --replace   # 覆盖原文件并清掉 fonts/ images/
 *   node _shared/inline-fonts.mjs ./手册.html             # 另存为 手册.single.html
 *   node _shared/inline-fonts.mjs ./手册.html --no-subset # 不子集化，全量内嵌
 *   node _shared/inline-fonts.mjs ./手册.html --no-images # 只内嵌字体
 *
 * 可选环境变量：
 *   PYFTSUBSET_CMD — 指定 pyftsubset 可执行文件路径
 *   SUBSET_PYTHON  — 指定带 fontTools 的 python 解释器路径
 *
 * 无第三方 Node 依赖；子集化依赖本机 python fontTools（缺了自动退化为全量内嵌）。
 */

import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const FONT_EXT = { '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const IMG_MIME = {
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
};
const SVG_FONT_FACE = 'WBEmbeddedSVG';

/* ---------- 安全缓冲字符集 ---------- */
const SAFE_RANGES = [
  [0x20, 0x7e],    // ASCII
  [0xa0, 0xff],    // Latin-1 Supplement
  [0x100, 0x17f],  // Latin Extended-A
  [0x180, 0x24f],  // Latin Extended-B
  [0x370, 0x3ff],  // Greek and Coptic
  [0x400, 0x4ff],  // Cyrillic
  [0x2000, 0x206f],// General Punctuation（– — ' ' " " …）
  [0x2070, 0x209f],// Superscripts and Subscripts
  [0x20a0, 0x20bf],// Currency Symbols
  [0x2100, 0x214f],// Letterlike Symbols（™ © ® ℃ №）
  [0x2190, 0x21ff],// Arrows
  [0x2200, 0x22ff],// Mathematical Operators
  [0x2460, 0x24ff],// Enclosed Alphanumerics（① ⑵ ⒊）
  [0x25a0, 0x25ff],// Geometric Shapes（■ ▲ ●）
  [0x2600, 0x26ff],// Miscellaneous Symbols（☎ ✓ ★）
  [0x3000, 0x303f],// CJK Symbols and Punctuation（、。〃）
  [0x3040, 0x30ff],// Hiragana / Katakana
  [0xff00, 0xffef],// Halfwidth and Fullwidth Forms（，！＃）
];
const SAFE_EXTRA = '←↑→↓≈±×÷°‰€£¥¢™©®℃№…—–‘’“”•·§¶†‡';

function safeChars() {
  const s = new Set();
  for (const [a, b] of SAFE_RANGES) for (let c = a; c <= b; c++) s.add(c);
  for (const ch of SAFE_EXTRA) s.add(ch.codePointAt(0));
  return s;
}

/* ---------- 字符收集 ---------- */
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', deg: '°', copy: '©', reg: '®', trade: '™',
  times: '×', divide: '÷', plusmn: '±', asymp: '≈', larr: '←',
  rarr: '→', uarr: '↑', darr: '↓', bull: '•', middot: '·',
};

function unescapeEntities(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[body] ?? m;
  });
}

/** 从 HTML 收集字符：去注释 → 抽 style 内容 → 去 script/style → 去标签 → 解实体 */
function collectFromHtml(html) {
  const set = new Set();
  const noComment = html.replace(/<!--[\s\S]*?-->/g, ' ');
  for (const m of noComment.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const ch of unescapeEntities(m[1])) set.add(ch);
  }
  const noStyle = noComment.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  const noScript = noStyle.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  const text = unescapeEntities(noScript.replace(/<[^>]+>/g, ' '));
  for (const ch of text) set.add(ch);
  return set;
}

/** 从 SVG 源码收集 <text>/content 里的字符 */
function collectFromSvg(svg) {
  const set = new Set();
  for (const m of svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)) {
    for (const ch of unescapeEntities(m[1].replace(/<[^>]+>/g, ' '))) set.add(ch);
  }
  for (const m of svg.matchAll(/(?:content|aria-label)="([^"]*)"/g)) {
    for (const ch of unescapeEntities(m[1])) set.add(ch);
  }
  return set;
}

/* ---------- 引用扫描 ---------- */
function scanRefs(html, baseDir) {
  const fonts = new Map();   // ref -> absPath
  const images = new Map();
  const add = (map, ref) => {
    const clean = ref.split('?')[0];
    const ext = extname(clean).toLowerCase();
    if (!FONT_EXT[ext] && !IMG_MIME[ext]) return;
    if (/^(?:data:|https?:|\/\/)/i.test(clean)) return;
    const abs = resolve(baseDir, clean);
    if (!map.has(clean) && existsSync(abs)) map.set(clean, abs);
  };
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) { add(fonts, m[1]); add(images, m[1]); }
  for (const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) { add(fonts, m[1]); add(images, m[1]); }
  // 分类：字体扩展名归 fonts，其余归 images
  for (const ref of [...fonts.keys()]) {
    const ext = extname(ref.split('?')[0]).toLowerCase();
    if (!FONT_EXT[ext]) fonts.delete(ref);
  }
  for (const ref of [...images.keys()]) {
    const ext = extname(ref.split('?')[0]).toLowerCase();
    if (FONT_EXT[ext]) images.delete(ref);
  }
  return { fonts, images };
}

/* ---------- 子集化探测链 ---------- */
function tryExec(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

function subsetTool() {
  const py = process.env.SUBSET_PYTHON || 'python';
  const custom = process.env.PYFTSUBSET_CMD;
  if (custom) return { kind: 'cmd', bin: custom };
  const win = process.platform === 'win32';
  const names = win ? ['pyftsubset.exe', 'pyftsubset'] : ['pyftsubset'];
  for (const n of names) if (tryExec(n, ['--help'])) return { kind: 'cmd', bin: n };
  const mods = win ? [['-m', 'fontTools.subset'], ['-m', 'fontTools.subset']] : [['-m', 'fontTools.subset']];
  for (const m of mods) if (tryExec(py, [...m, '--help'])) return { kind: 'cmd', bin: py, prefix: m };
  for (const hb of win ? ['hb-subset.exe', 'hb-subset'] : ['hb-subset']) {
    if (tryExec(hb, ['--help'])) return { kind: 'hb', bin: hb };
  }
  return { kind: 'full' };
}

function subsetFont(absPath, charsFile, outPath) {
  const ext = extname(absPath).toLowerCase();
  const tool = subsetTool();
  if (tool.kind === 'full') return { ok: false, via: 'full' };
  if (tool.kind === 'hb' && ext !== '.ttf' && ext !== '.otf') {
    return { ok: false, via: 'full' }; // HarfBuzz 不吃 woff2 → 全量内嵌
  }
  const args = tool.kind === 'hb'
    ? [absPath, `--text-file=${charsFile}`, `-o`, outPath]
    : [...(tool.prefix || []), absPath, `--text-file=${charsFile}`, '--output-file=' + outPath];
  const ok = tryExec(tool.bin, args);
  return { ok: ok && existsSync(outPath), via: tool.kind };
}

/* ---------- base64 ---------- */
function b64(buf) { return buf.toString('base64'); }

function dataUri(mime, buf) { return `data:${mime};base64,${b64(buf)}`; }

/* ---------- SVG 中文兜底 ---------- */
function embedSvgFont(svg, fontAbs, chars) {
  const tmp = join(tmpdir(), 'wbinline-svg');
  const charsFile = tmp + '.txt';
  const subsetOut = tmp + '.subset' + extname(fontAbs);
  try {
    writeFileSync(charsFile, [...chars].join(''), 'utf8');
    const r = subsetFont(fontAbs, charsFile, subsetOut);
    const buf = r.ok ? readFileSync(subsetOut) : readFileSync(fontAbs);
    const uri = dataUri(FONT_EXT[extname(fontAbs).toLowerCase()], buf);
    const inject = `<defs><style>@font-face{font-family:"${SVG_FONT_FACE}";src:url("${uri}") format("truetype");font-weight:600}text{font-family:"${SVG_FONT_FACE}"}</style></defs>`;
    const out = svg.replace(/<\/svg>\s*$/i, `${inject}</svg>`);
    return { svg: out, subset: r.ok };
  } finally {
    for (const f of [charsFile, subsetOut]) if (existsSync(f)) rmSync(f, { force: true });
  }
}

/* ---------- 主流程 ---------- */
export function inlineAssets(htmlPath, opts = {}) {
  const { replace = false, subset = true, images = true } = opts;
  const warnings = [];
  const abs = resolve(htmlPath);
  const baseDir = dirname(abs);
  let html = readFileSync(abs, 'utf8');

  // 1. 字符收集
  const chars = new Set([...collectFromHtml(html), ...safeChars()]);
  const { fonts, images: imgRefs } = scanRefs(html, baseDir);

  // 2. SVG 预处理：含 <text> 的注入 MiSans-Semibold 子集（在 base64 化之前）
  const sharedFonts = resolve(baseDir, 'fonts');
  const semibold = join(sharedFonts, 'MiSans-Semibold.ttf');
  const semiboldAbs = existsSync(semibold) ? semibold
    : resolve(baseDir, '..', '_shared', 'fonts', 'MiSans-Semibold.ttf');
  const svgChars = new Set(chars);
  const svgPatched = new Map();
  for (const [ref, absPath] of imgRefs) {
    if (extname(ref).toLowerCase() !== '.svg') continue;
    const src = readFileSync(absPath, 'utf8');
    if (!/<text[\s>]/i.test(src) && !/content\s*=/.test(src)) continue;
    for (const ch of collectFromSvg(src)) svgChars.add(ch);
    if (subset && existsSync(semiboldAbs)) {
      const r = embedSvgFont(src, semiboldAbs, svgChars);
      svgPatched.set(absPath, r.svg);
    }
  }

  // 3. 字体子集化 + 内嵌
  let fontTotal = 0, fontSubset = 0, fontCount = 0;
  const tmp = join(tmpdir(), 'wbinline-main');
  for (const [ref, absPath] of fonts) {
    const ext = extname(ref).toLowerCase();
    const mime = FONT_EXT[ext];
    let buf = readFileSync(absPath);
    const raw = buf.length;
    fontTotal += raw;
    fontCount++;
    if (subset) {
      try {
        const charsFile = tmp + '.txt';
        const out = tmp + '.subset' + ext;
        writeFileSync(charsFile, [...chars].join(''), 'utf8');
        const r = subsetFont(absPath, charsFile, out);
        if (r.ok) buf = readFileSync(out);
        else warnings.push(`字体 ${ref} 子集化失败（via=${r.via}），已全量内嵌`);
        for (const f of [charsFile, out]) if (existsSync(f)) rmSync(f, { force: true });
      } catch (e) {
        warnings.push(`字体 ${ref} 子集化异常：${e.message}，已全量内嵌`);
      }
    }
    fontSubset += buf.length;
    const uri = dataUri(mime, buf);
    const esc = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`url\\(\\s*["']?${esc}["']?\\s*\\)`, 'g'), () => `url("${uri}")`);
    const log = `${(raw / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB`;
    console.log(`  · ${ref} ${log}`);
  }

  // 4. 图片内嵌（SVG 用可能已注入字体的版本）
  if (images) {
    for (const [ref, absPath] of imgRefs) {
      const ext = extname(ref).toLowerCase();
      const mime = IMG_MIME[ext];
      if (!mime) continue;
      const buf = svgPatched.has(absPath)
        ? Buffer.from(svgPatched.get(absPath), 'utf8')
        : readFileSync(absPath);
      const uri = dataUri(mime, buf);
      const esc = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(`(?:src|href)\\s*=\\s*["']${esc}["']`, 'g'), () => `src="${uri}"`);
      html = html.replace(new RegExp(`url\\(\\s*["']?${esc}["']?\\s*\\)`, 'g'), () => `url("${uri}")`);
      console.log(`  · ${ref} ${(buf.length / 1024).toFixed(0)}KB${svgPatched.has(absPath) ? '（已注入 SVG 字体）' : ''}`);
    }
  }

  // 5. 输出
  const outPath = replace ? abs : abs.replace(/\.html?$/i, (m) => `.single${m}`);
  writeFileSync(outPath, html, 'utf8');

  // 6. --replace 清理目录
  if (replace) {
    for (const d of ['fonts', 'images']) {
      const p = join(baseDir, d);
      if (existsSync(p)) {
        rmSync(p, { recursive: true, force: true });
        console.log(`  已清理 ${d}/`);
      }
    }
  }

  const mb = (html.length / 1048576).toFixed(2);
  console.log(`  字体 ${fontCount} 个：${(fontTotal / 1048576).toFixed(1)}MB → ${(fontSubset / 1048576).toFixed(1)}MB`);
  console.log(`  单文件产物：${outPath}（${mb}MB）`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  return { outPath, size: html.length, warnings };
}

/* ---------- CLI ---------- */
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const htmlArg = args.find((a) => !a.startsWith('--'));
  if (!htmlArg) {
    console.error('用法: node _shared/inline-fonts.mjs <html> [--replace] [--no-subset] [--no-images]');
    process.exit(1);
  }
  inlineAssets(htmlArg, {
    replace: args.includes('--replace'),
    subset: !args.includes('--no-subset'),
    images: !args.includes('--no-images'),
  });
}
