#!/usr/bin/env node
/**
 * validate.mjs — E · 单页作品集风 校验脚本
 * 用法: node validate.mjs <portfolio.html>
 * 退出码: 0 = 通过（可交付），1 = 有错误
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { PAGE_TYPES, BLOCK_TYPES } from './build.mjs';

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const file = process.argv[2];
if (!file) { console.error('用法: node validate.mjs <portfolio.html>'); process.exit(2); }
if (!existsSync(file)) { console.error(`找不到文件: ${file}`); process.exit(2); }

const html = readFileSync(file, 'utf8');
const dir = dirname(resolve(file));

/* 1. 物理规格 */
if (!/@page\s*{\s*size:\s*\d+(\.\d+)?mm\s+\d+(\.\d+)?mm/.test(html)) {
  err('缺少 @page size 声明——浏览器会按默认纸张打印');
}
const m = html.match(/@page\s*{\s*size:\s*(\d+(?:\.\d+)?)mm\s+(\d+(?:\.\d+)?)mm/);
if (m) {
  const w = Number(m[1]), h = Number(m[2]);
  const known = (w === 216 && h === 303) || (w === 222 && h === 297);
  if (!known) warn(`@page ${w}×${h}mm 不是已知口径（a4 216×303 / cn16 222×297）——确认这是有意的`);
} else if (m === null && /@page/.test(html)) {
  err('@page 声明的尺寸无法解析');
}
if (!/--bleed:\s*3mm/.test(html)) err('--bleed 不是 3mm——出血规格被改动');

/* 2. 主题 token */
const need = ['bg', 'surface', 'fg', 'muted', 'border', 'accent', 'accent-2', 'warn', 'marker',
  'cov-ink', 'cov-year', 'cov-mist', 'cov-line', 'table-head', 'zebra',
  'ink', 'steel', 'tint', 'accent-soft'];
const rootBlock = (html.match(/:root\{([\s\S]*?)\}/) || [])[1] || '';
for (const tk of need) {
  if (!new RegExp(`--${tk}\\s*:`).test(rootBlock)) err(`主题 token 缺失: --${tk}`);
}

/* 3. 语言 */
const lang = (html.match(/<main[^>]*\sdata-lang="([^"]+)"/) || [])[1];
if (!lang) err('stage 缺少 data-lang');
else if (!['zh', 'en', 'bi'].includes(lang)) err(`非法 data-lang: ${lang}（只许 zh/en/bi）`);

/* 3.5 逐页解析：位置属性、页脚、裁切标记都以「单页」为单位核对。
   跨对开是两张单页（左半 / 右半），不是一张宽页，所以这里仍然一页一条记录。 */
const tags = [...html.matchAll(/<section class="([^"]+)"([^>]*)>/g)];
const segs = tags.map((t, i) => {
  const at = t[2];
  return {
    cls: t[1],
    page: Number((at.match(/data-page="(\d+)"/) || [])[1]),
    side: (at.match(/data-side="([a-z]+)"/) || [])[1],
    half: (at.match(/data-half="([lr])"/) || [])[1],
    spread: (at.match(/data-spread="([^"]+)"/) || [])[1],
    media: /data-media="image"/.test(at),
    body: html.slice(t.index + t[0].length, i + 1 < tags.length ? tags[i + 1].index : html.length)
  };
});
const pageCount = segs.length;
if (!pageCount) err('没有生成任何页面（.sheet）');

if (!segs.some((s) => s.side)) {
  err('页面缺少 data-side（recto/verso）——横幅渐变无法按订口镜像');
} else {
  for (const s of segs) {
    if (!s.side) { err(`第 ${s.page} 页缺 data-side`); continue; }
    const want = s.page % 2 === 1 ? 'recto' : 'verso';
    if (s.side !== want) err(`第 ${s.page} 页 data-side=${s.side}，应为 ${want}（单数=右页 recto）`);
  }
}

/* 4. 页码：data-page 必须从 1 连续；跨对开的两半必须相邻且成对 */
for (let i = 0; i < segs.length; i++) {
  if (segs[i].page !== i + 1) { err(`页码不连续：第 ${i + 1} 个 sheet 声明 data-page=${segs[i].page}`); break; }
}
segs.forEach((s, i) => {
  if (s.half === 'l') {
    // 左半必须是左页（偶数页）：奇数页是右页，它和下一页不是同一张纸的正面
    if (s.page % 2 !== 0) err(`跨对开从第 ${s.page} 页起——它是右页，与第 ${s.page + 1} 页不构成面对面的一对`);
    const nx = segs[i + 1];
    if (!nx || nx.half !== 'r' || nx.spread !== s.spread) {
      err(`第 ${s.page} 页是跨对开左半，下一页必须是同组（${s.spread || '未命名'}）的右半`);
    } else if (nx.page !== s.page + 1) {
      err(`跨对开 ${s.spread} 的右半页码 ${nx.page}，应为 ${s.page + 1}`);
    }
  }
  if (s.half === 'r' && (!segs[i - 1] || segs[i - 1].half !== 'l')) {
    err(`第 ${s.page} 页是跨对开右半，但前一页不是它的左半`);
  }
});

/* 5. 页脚：封面 / 封底 / 跨对开的图半边不编页，其余每页都要有 Page N / M */
let contentPages = 0;
for (const s of segs) {
  const noFoot = /sheet-cover|sheet-back/.test(s.cls) || s.media;
  const hit = s.body.match(/Page (\d+) \/ (\d+)/);
  if (noFoot) {
    if (hit) err(`第 ${s.page} 页不该有页脚（封面 / 封底 / 跨页图半边）`);
    continue;
  }
  contentPages++;
  if (!hit) { err(`第 ${s.page} 页缺页脚页码`); continue; }
  if (Number(hit[1]) !== s.page) err(`第 ${s.page} 页页脚写成 Page ${hit[1]}——页码与 data-page 不一致`);
  if (Number(hit[2]) !== pageCount) err(`页脚总页数写了 ${hit[2]}，实际 ${pageCount}`);
}

/* 6. 裁切标记：常页 8 个（四角各两条）；跨对开每半页 4 个（只标外侧，折缝不裁） */
for (const s of segs) {
  const c = (s.body.match(/class="crop /g) || []).length;
  const want = s.half ? 4 : 8;
  if (c !== want) err(`第 ${s.page} 页裁切标记 ${c} 个，应为 ${want} 个`);
  if (s.half === 'l' && /class="crop (tr|br)-/.test(s.body)) err(`第 ${s.page} 页左半在折缝侧画了裁切线`);
  if (s.half === 'r' && /class="crop (tl|bl)-/.test(s.body)) err(`第 ${s.page} 页右半在折缝侧画了裁切线`);
}
const crops = (html.match(/class="crop /g) || []).length;

/* 7. 页面类型 */
const types = [...html.matchAll(/data-doc="([^"]+)"/g)].map((x) => x[1]);
if (types.length && !types[0]) warn('data-doc 为空');

/* 8. 表格列一致性 */
const tables = html.match(/<table class="tbl[\s\S]*?<\/table>/g) || [];
tables.forEach((tb, i) => {
  const headCols = (tb.match(/<th[ >]/g) || []).length;
  // 分组行用 colspan 横跨全表，不参与列数核对
  const rows = tb.split('</tr>').slice(0, -1)
    .filter((r) => /<td[ >]/.test(r) && !/colspan=/.test(r));
  for (const r of rows) {
    const tds = (r.match(/<td[ >]/g) || []).length;
    if (headCols && tds !== headCols) {
      err(`表格 #${i + 1} 列数不一致：表头 ${headCols} 列 / 数据行 ${tds} 列`);
      break;
    }
  }
});

/* 8.5 数据身份：标了就要标全。
   只标一张、其余不标，比全不标更危险——读者会以为标过的那张才是典型值，
   其余的都是保证值。技术数据表里这一条是纠纷的源头。
   basis="none"（工序/清单/对策表）显式豁免。 */
const needBasis = tables.filter((t) => !/data-basis="none"/.test(t));
const taggedTables = needBasis.filter((t) => /class="tag tag-/.test(t)).length;
if (taggedTables > 0 && taggedTables < needBasis.length) {
  warn(`有 ${taggedTables}/${needBasis.length} 张表标了数据身份（标准要求/典型值），其余未标——`
    + '同一份文件里两种性质混排，客户会当成同一种');
}

/* 9. 图片存在性 + 占位图未替换 */
const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
  .map((x) => x[1]).filter((s) => !/^(?:https?:|data:)/.test(s));
const uniq = [...new Set(imgs)];
for (const src of uniq) if (!existsSync(join(dir, src))) err(`图片缺失: ${src}`);
const holders = uniq.filter((s) => /(?:^|\/)(?:ph-|placeholder-)/.test(s));
if (holders.length) {
  warn(`仍有 ${holders.length} 张占位图未替换（${holders.slice(0, 3).join(', ')}${holders.length > 3 ? '…' : ''}）——不可交付印厂`);
}

/* 10. 锚点唯一 + 目录未解析 */
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((x) => x[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) err(`重复锚点 id: ${[...new Set(dup)].join(', ')}`);
const emptyRefs = (html.match(/<span class="pg"><\/span>/g) || []).length;
if (emptyRefs) warn(`目录有 ${emptyRefs} 条没解析出页码（ref 指向了不存在的 id）`);

/* 11. 字体本地化 */
const embedded = (html.match(/data:font\//g) || []).length;
if (embedded > 0) {
  console.log(`  字体: 已内嵌 ${embedded} 份（data:font/，单文件产物）`);
} else if (!/@font-face/.test(html)) {
  warn('没有 @font-face——字体不会本地化嵌入');
} else if (!existsSync(join(dir, 'fonts'))) {
  err('HTML 引用了 ./fonts/ 但产物旁没有 fonts 目录——打印会掉字体');
}

/* 12. 竖向分配与页头 */
const VALIGN = ['v-center', 'v-bottom', 'v-distribute', 'v-between'];
let heads = 0, grades = 0;
for (const s of segs) {
  if (/sheet-cover|sheet-back/.test(s.cls) || s.media) continue;   // 封面封底与图半边没有正文流
  if (/class="grade-banner"/.test(s.body)) grades++;
  else if (/class="page-head"/.test(s.body)) heads++;

  const m2 = s.body.match(/class="page-body([^"]*)"/);
  if (m2) {
    for (const cls of m2[1].trim().split(/\s+/).filter(Boolean)) {
      if (cls.startsWith('v-') && !VALIGN.includes(cls)) err(`第 ${s.page} 页竖向分配类名非法: ${cls}`);
    }
  }
}
if (heads + grades !== contentPages) {
  warn(`页头数量 ${heads} + 牌号页 ${grades} = ${heads + grades}，不等于内容页 ${contentPages}——有页面缺 page-head 或漏了 banner`);
}

/* 13. 密度提示：既没托底图、也没分配策略、块又少的页最容易空 */
for (const s of segs) {
  if (/sheet-cover|sheet-back/.test(s.cls) || s.media) continue;
  const hasFill = /class="fill-photo/.test(s.body);
  const hasGrid = /class="photos /.test(s.body);
  const distributed = /page-body[^"]*v-(distribute|between|center)/.test(s.body);
  const blocks = (s.body.match(/class="blk(?:\s|")/g) || []).length;
  if (!hasFill && !hasGrid && !distributed && blocks < 2) {
    warn(`第 ${s.page} 页既没有托底图、也没有竖向分配、块又少——印出来容易空`);
  }
}

/* 14. 体积 */
const size = statSync(file).size;
if (size < 30000) warn(`产物仅 ${(size / 1024).toFixed(0)}KB，可能内容不足`);

/* ---- 输出 ---- */
console.log(`校验作品集: ${file}`);
console.log(`  页数: ${pageCount} | 语言: ${lang || '?'} | 纸张: ${m ? `${m[1]}×${m[2]}mm` : '?'}`);
console.log(`  表格: ${tables.length} | 图片引用: ${uniq.length} | 裁切标记: ${crops}`);

if (errors.length) {
  console.log(`  ✗ 错误 ${errors.length} 项:`);
  errors.forEach((e) => console.log(`    • ${e}`));
} else {
  console.log('  ✓ 错误 0 项');
}
if (warns.length) {
  console.log(`  ! 警告 ${warns.length} 项 (建议检查):`);
  warns.forEach((w) => console.log(`    • ${w}`));
}

if (errors.length === 0) {
  console.log('\n✓ 通过 — 可交付');
  process.exit(0);
} else {
  console.log('\n✗ 未通过 — 有错误必须修');
  process.exit(1);
}
