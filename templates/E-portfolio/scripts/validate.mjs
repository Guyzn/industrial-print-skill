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

/* 4. 页数与页码 */
const sheets = html.split(/<section class="sheet/).slice(1);
const pageCount = sheets.length;
if (pageCount === 0) err('没有生成任何页面（.sheet）');
const declared = [...html.matchAll(/data-page="(\d+)"/g)].map((x) => Number(x[1]));
for (let i = 0; i < declared.length; i++) {
  if (declared[i] !== i + 1) { err(`页码不连续：第 ${i + 1} 个 sheet 声明 data-page=${declared[i]}`); break; }
}
if (declared.length !== pageCount) err(`data-page 数（${declared.length}）与 sheet 数（${pageCount}）不一致`);

/* 每页 footer：除封面外都应有 Page N / M */
const footNums = [...html.matchAll(/Page (\d+) \/ (\d+)/g)].map((x) => [Number(x[1]), Number(x[2])]);
if (footNums.length !== pageCount - 1) {
  err(`页脚数量 ${footNums.length} 与内容页数 ${pageCount - 1} 不符（封面不编页）`);
} else {
  const total = footNums[0]?.[1];
  if (total !== pageCount) err(`页脚总页数写了 ${total}，实际 ${pageCount}`);
  footNums.forEach(([n], i) => { if (n !== i + 2) err(`页脚页码错位：第 ${i + 2} 页写成 ${n}`); });
}

/* 5. 裁切标记：每页 8 个（四角各两条） */
const crops = (html.match(/class="crop /g) || []).length;
if (crops !== pageCount * 8) {
  err(`裁切标记 ${crops} 个，应为 ${pageCount * 8} 个（每页 8 个）——有页面漏注入`);
}

/* 6. 页面类型 */
const types = [...html.matchAll(/data-doc="([^"]+)"/g)].map((x) => x[1]);
if (types.length && !types[0]) warn('data-doc 为空');

/* 7. 表格列一致性 */
const tables = html.match(/<table class="tbl[\s\S]*?<\/table>/g) || [];
tables.forEach((tb, i) => {
  const headCols = (tb.match(/<th[ >]/g) || []).length;
  const rows = tb.split('</tr>').slice(0, -1).filter((r) => /<td[ >]/.test(r));
  for (const r of rows) {
    const tds = (r.match(/<td[ >]/g) || []).length;
    if (headCols && tds !== headCols) {
      err(`表格 #${i + 1} 列数不一致：表头 ${headCols} 列 / 数据行 ${tds} 列`);
      break;
    }
  }
});

/* 8. 图片存在性 + 占位图未替换 */
const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
  .map((x) => x[1]).filter((s) => !/^(?:https?:|data:)/.test(s));
const uniq = [...new Set(imgs)];
for (const src of uniq) if (!existsSync(join(dir, src))) err(`图片缺失: ${src}`);
const holders = uniq.filter((s) => /(?:^|\/)(?:ph-|placeholder-)/.test(s));
if (holders.length) {
  warn(`仍有 ${holders.length} 张占位图未替换（${holders.slice(0, 3).join(', ')}${holders.length > 3 ? '…' : ''}）——不可交付印厂`);
}

/* 9. 锚点唯一 + 目录未解析 */
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((x) => x[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) err(`重复锚点 id: ${[...new Set(dup)].join(', ')}`);
const emptyRefs = (html.match(/<span class="pg"><\/span>/g) || []).length;
if (emptyRefs) warn(`目录有 ${emptyRefs} 条没解析出页码（ref 指向了不存在的 id）`);

/* 10. 字体本地化 */
const embedded = (html.match(/data:font\//g) || []).length;
if (embedded > 0) {
  console.log(`  字体: 已内嵌 ${embedded} 份（data:font/，单文件产物）`);
} else if (!/@font-face/.test(html)) {
  warn('没有 @font-face——字体不会本地化嵌入');
} else if (!existsSync(join(dir, 'fonts'))) {
  err('HTML 引用了 ./fonts/ 但产物旁没有 fonts 目录——打印会掉字体');
}

/* 11. 竖向分配与页头 */
const pageSegs = html.split(/<section class="sheet/).slice(1);
const VALIGN = ['v-center', 'v-bottom', 'v-distribute', 'v-between'];
let heads = 0, grades = 0;
pageSegs.forEach((seg, i) => {
  if (i === 0) return;   // 封面
  if (/class="grade-banner"/.test(seg)) grades++;
  else if (/class="page-head"/.test(seg)) heads++;

  const m2 = seg.match(/class="page-body([^"]*)"/);
  if (m2) {
    for (const cls of m2[1].trim().split(/\s+/).filter(Boolean)) {
      if (cls.startsWith('v-') && !VALIGN.includes(cls)) err(`第 ${i + 1} 页竖向分配类名非法: ${cls}`);
    }
  }
});
const contentPages = pageCount - 1;
if (heads + grades !== contentPages) {
  warn(`页头数量 ${heads} + 牌号页 ${grades} = ${heads + grades}，不等于内容页 ${contentPages}——有页面缺 page-head 或漏了 banner`);
}

/* 12. 密度提示：既没托底图、也没分配策略、块又少的页最容易空 */
pageSegs.forEach((seg, i) => {
  if (i === 0) return;
  const hasFill = /class="fill-photo/.test(seg);
  const hasGrid = /class="photos /.test(seg);
  const distributed = /page-body[^"]*v-(distribute|between|center)/.test(seg);
  const blocks = (seg.match(/class="blk(?:\s|")/g) || []).length;
  if (!hasFill && !hasGrid && !distributed && blocks < 2) {
    warn(`第 ${i + 1} 页既没有托底图、也没有竖向分配、块又少——印出来容易空`);
  }
});

/* 13. 体积 */
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
