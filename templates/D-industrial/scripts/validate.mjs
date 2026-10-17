#!/usr/bin/env node
/**
 * validate.mjs — D · 工业技术风 校验脚本
 * 用法: node validate.mjs <handbook.html>
 * 退出码: 0 = 通过（可交付），1 = 有错误
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUTS, BLOCK_TYPES } from './build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const errors = [];
const warns = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warns.push(msg); }

const file = process.argv[2];
if (!file) { console.error('用法: node validate.mjs <handbook.html>'); process.exit(2); }
if (!existsSync(file)) { console.error(`找不到文件: ${file}`); process.exit(2); }

const html = readFileSync(file, 'utf8');
const dir = dirname(resolve(file));

/* 1. 基本规格 */
if (!/@page\s*{\s*size:\s*\d+mm\s+\d+mm/.test(html)) err('缺少 @page size 声明——浏览器会按默认纸张打印');
const pageSize = (html.match(/@page\s*{\s*size:\s*(\d+(\.\d+)?)mm\s+(\d+(\.\d+)?)mm/) || []);
if (pageSize[1]) {
  const pw = Number(pageSize[1]), ph = Number(pageSize[3]);
  const known = (pw === 426 && ph === 303) || (pw === 438 && ph === 297);
  if (!known) warn(`@page size ${pw}×${ph}mm 不是已知口径（a4 含出血 426×303 / cn16 438×297）——确认这是有意的`);
}
if (!/--bleed:\s*3mm/.test(html)) err('--bleed 不是 3mm——出血规格被改动');
if (!/--baseline:\s*8px/.test(html)) warn('缺少 8px 基线网格变量');

/* 2. 主题 token 完整性 */
const needTokens = ['bg', 'surface', 'fg', 'muted', 'border', 'accent', 'accent-2', 'warn',
  'marker', 'cov-ink', 'cov-year', 'cov-mist', 'cov-line', 'table-head', 'zebra'];
const rootBlock = (html.match(/:root\{([\s\S]*?)\}/) || [])[1] || '';
for (const tk of needTokens) {
  if (!new RegExp(`--${tk}\\s*:`).test(rootBlock)) err(`主题 token 缺失: --${tk}`);
}

/* 3. 语言模式（只认 <main> 上的 data-lang，CSS 选择器里的不算）*/
const lang = (html.match(/<main[^>]*\sdata-lang="([^"]+)"/) || [])[1];
if (!lang) err('stage 缺少 data-lang');
else if (!['zh', 'en', 'bi'].includes(lang)) err(`非法 data-lang: ${lang}（只许 zh/en/bi）`);

/* 4. 对开与页数 */
const spreadCount = (html.match(/<section class="spread"/g) || []).length;
const pageCount = (html.match(/<div class="page /g) || []).length;
if (spreadCount === 0) err('没有生成任何对开');

// 逐对开检查：跨对开页（.pane.full）靠 foot-l/foot-r 占两页；普通对开必须有两个 .page
const spreadSegs = html.split(/<section class="spread"/).slice(1);
let fullSpreads = 0;
spreadSegs.forEach((seg, i) => {
  // 跨对开形态（fullSpread 的 pane.full / imageSpread 的 bleed-img）都有 foot-l/foot-r；
  // 普通 page() 的 page-foot 不带 foot-l 类
  const isFull = /class="page-foot foot-l"/.test(seg);
  const pages = (seg.match(/<div class="page /g) || []).length;
  const foots = (seg.match(/class="page-foot/g) || []).length;
  if (isFull) {
    fullSpreads++;
    if (foots < 2) err(`对开 #${i + 1} 为跨对开布局但只有 ${foots} 个页脚（应为 2）`);
  } else if (pages !== 2) {
    err(`对开 #${i + 1} 只有 ${pages} 个 .page（应为 2）`);
  }
});
const logicalPages = spreadCount * 2;
if (logicalPages % 2 !== 0) err('总页数为奇数——对开拼版必须偶页');

/* 5. 骨架编号 */
const used = [...html.matchAll(/data-layout="([^"]+)"/g)].map((m) => m[1]);
if (used.length === 0) err('没有 spread 声明 data-layout');
for (const u of used) if (!LAYOUTS.includes(u)) err(`未知骨架编号: ${u}`);

/* 6. 页码连续性 */
const pageNums = [...html.matchAll(/class="num">P\.(\d+)</g)].map((m) => Number(m[1]));
const expect = [];
for (let p = 3; p <= logicalPages; p++) expect.push(p);   // 封面不编页
const missing = expect.filter((p) => !pageNums.includes(p));
if (missing.length) warn(`页码缺失: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}（封面/幕封可忽略）`);

/* 7. 表格列一致性 */
const tables = html.match(/<table class="tb[\s\S]*?<\/table>/g) || [];
for (let i = 0; i < tables.length; i++) {
  const tb = tables[i];
  const headCols = (tb.match(/<th[ >]/g) || []).length;
  const bodyRows = tb.split('</tr>').slice(0, -1).filter((r) => /<td[ >]/.test(r));
  for (const r of bodyRows) {
    const tds = (r.match(/<td[ >]/g) || []).length;
    if (headCols && tds !== headCols) {
      err(`表格 #${i + 1} 列数不一致：表头 ${headCols} 列 / 数据行 ${tds} 列`);
      break;
    }
  }
}

/* 8. 双语完整性 */
if (lang === 'bi') {
  const zhCount = (html.match(/class="zh[ "]|class="zh"/g) || []).length;
  const enCount = (html.match(/class="bi-en/g) || []).length;
  if (zhCount > 0 && enCount === 0) err('lang=bi 但全文没有任何英文——双语模式失效');
  else if (enCount > 0 && enCount < zhCount * 0.5) warn(`英文覆盖偏低（${enCount}/${zhCount}），双语目录会显得半吊子`);
}

/* 9. 图片存在性 */
const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/^(?:https?:|data:)/.test(s));
const imgSet = new Set(imgs);
for (const src of imgSet) {
  if (!existsSync(join(dir, src))) err(`图片缺失: ${src}`);
}

/* 10. 锚点唯一 */
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) err(`重复锚点 id: ${[...new Set(dup)].join(', ')}`);

/* 11. 字体本地化（data:font/ = --single 内嵌产物；否则必须带 fonts/ 目录）*/
const embeddedFonts = (html.match(/data:font\//g) || []).length;
if (embeddedFonts > 0) {
  console.log(`  字体: 已内嵌 ${embeddedFonts} 份（data:font/，单文件产物）`);
} else if (!/@font-face/.test(html)) {
  warn('没有 @font-face——字体不会本地化嵌入');
} else if (!existsSync(join(dir, 'fonts'))) {
  err('HTML 引用了 ./fonts/ 但产物旁没有 fonts 目录——打印会掉字体');
}

/* 12. 体积 sanity */
const size = statSync(file).size;
if (size < 20000) warn(`产物仅 ${(size / 1024).toFixed(0)}KB，可能内容不足`);
if (pageCount === 0 && spreadCount > 0) warn('没有任何 .page 容器（全跨对开布局）——确认这是有意的');
const cropCount = (html.match(/class="crop /g) || []).length;
if (cropCount === 0) warn('没有裁切标记（.crop）——送印时印厂无处对刀');
else if (cropCount !== spreadCount * 10) warn(`裁切标记 ${cropCount} 个，对开 ${spreadCount} 个（应各 10 个：8 角 + 2 折线）——有对开漏注入`);

/* ---- 输出 ---- */
console.log(`校验手册: ${file}`);
console.log(`  对开: ${spreadCount}（跨对开 ${fullSpreads}）| 页数: ${logicalPages} | 语言: ${lang || '?'} | 内容骨架: ${used.length}`);
const layoutCounts = {};
for (const u of used) layoutCounts[u] = (layoutCounts[u] || 0) + 1;
console.log(`  骨架分布: ${Object.entries(layoutCounts).map(([k, v]) => `${k}×${v}`).join(' ')}`);
console.log(`  表格: ${tables.length} | 图片引用: ${imgSet.size} | 裁切标记: ${cropCount}`);

if (errors.length) {
  console.log(`  ✗ 错误 ${errors.length} 项:`);
  for (const e of errors) console.log(`    • ${e}`);
} else {
  console.log('  ✓ 错误 0 项');
}
if (warns.length) {
  console.log(`  ! 警告 ${warns.length} 项 (建议检查):`);
  for (const w of warns) console.log(`    • ${w}`);
}

if (errors.length === 0) {
  console.log('\n✓ 通过 — 可交付');
  process.exit(0);
} else {
  console.log('\n✗ 未通过 — 有错误必须修');
  process.exit(1);
}
