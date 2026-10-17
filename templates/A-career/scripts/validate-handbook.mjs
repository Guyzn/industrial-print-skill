#!/usr/bin/env node
/**
 * validate-handbook.mjs
 * 手册 HTML 交付前自检：跑一遍确认版式/数据/图链纪律。
 *
 * 用法:
 *   node validate-handbook.mjs <手册.html> [--quiet]
 *
 * 退出码: 0 = 通过(可打印), 1 = 有错误(需修), 2 = 有警告(可打印但建议看)
 */
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const file = args.find(a => !a.startsWith('--'));

if (!file) {
  console.error('用法: node validate-handbook.mjs <手册.html> [--quiet]');
  exit(2);
}

let html;
try {
  html = readFileSync(file, 'utf8');
} catch (e) {
  console.error(`读取失败: ${e.message}`);
  exit(1);
}

const errors = [];
const warnings = [];

// 剥掉 <script>/<style> 里的干扰内容, 只留可打印 HTML
const body = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '');

const q = (re) => [...body.matchAll(re)].map(m => m[0]);

// class 属性里是否含某个独立词元（避免 \bpage\b 误中 page-head/page-foot）
const hasToken = (tag, token) => {
  const m = tag.match(/\bclass="([^"]*)"/);
  if (!m) return false;
  return new RegExp(`(?:^|\\s)${token}(?:\\s|$)`).test(m[1]);
};

/* ---------- 1. data-layout 覆盖率 ---------- */
const pageTags = [...body.matchAll(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g)]
  .map(m => ({ tag: m[0], idx: m.index }))
  .filter(o => hasToken(o.tag, 'page'));
const pages = pageTags.map(o => {
  // 该页自身标签及其直到下一页之间的片段
  const end = pageTags.find(p => p.idx > o.idx);
  return { tag: o.tag, slice: body.slice(o.idx, end ? end.idx : undefined) };
});
const layouted = pages.filter(p => /\bdata-layout="L\d{2}[a-z]?(\s+[a-z]+)?"/.test(p.tag));
if (pages.length && layouted.length !== pages.length) {
  const missing = pages.length - layouted.length;
  errors.push(`[版式] 有 ${missing}/${pages.length} 个 .page 缺 data-layout="Lxx"`);
}

/* ---------- 2. 锚点有效性: sp-* 必须被 toc 引用 ---------- */
// --sample: 样板只收录部分章节，目录引用未收录页属预期，降级为警告
const sampleMode = args.includes('--sample');
const spIds = new Set(q(/id="(sp-[^"]+)"/g).map(m => m.match(/id="([^"]+)"/)[1]));
const tocRefs = new Set(q(/href="#(sp-[^"]+)"/g).map(m => m.match(/href="#([^"]+)"/)[1]));
for (const ref of tocRefs) {
  if (!spIds.has(ref)) {
    const msg = `[锚点] 目录引用了不存在的 id="#${ref}"`;
    (sampleMode ? warnings : errors).push(sampleMode ? `${msg}(样板未收录)` : msg);
  }
}
// 顶层对开 id（不含 -page / -detail / -pN 后缀）都应被目录引用；内页 id 属于锚点定位，不检查
const topSpreadIds = [...spIds].filter(id => !/-(?:page|detail|p\d+)$/.test(id));
for (const id of topSpreadIds) {
  if (!tocRefs.has(id)) warnings.push(`[锚点] id="#${id}" 未被目录引用(若为封面/幕封可忽略)`);
}

/* ---------- 元素整块切取（开标签 → 块内全部内容） ---------- */
const blocks = (openRe) => {
  const tags = [...body.matchAll(openRe)].map(m => ({ tag: m[0], idx: m.index }));
  return tags.map(o => {
    const end = tags.find(t => t.idx > o.idx);
    return body.slice(o.idx, end ? end.idx : undefined);
  });
};

/* ---------- 3. 条形图数据纪律 ---------- */
const barCharts = [...body.matchAll(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g)]
  .filter(m => hasToken(m[0], 'bar-chart'))
  .map(m => {
    // 切到下一个 page-foot 或 </section>（条形图只出现在数据页，页脚前收尾）
    const endFoot = body.indexOf('page-foot', m.index);
    const endSec = body.indexOf('</section>', m.index);
    const end = Math.min(...[endFoot, endSec].filter(v => v > m.index));
    return body.slice(m.index, end > 0 ? end : m.index + 3000);
  });
for (const chart of barCharts) {
  const maxM = chart.match(/--max:\s*([0-9.]+)/);
  if (!maxM || parseFloat(maxM[1]) === 0) {
    errors.push(`[条形图] .bar-chart 缺少非 0 的 --max`);
    continue;
  }
  const barCount = (chart.match(/class="([^"]*bar-row[^"]*)"/g) || []).length;
  if (barCount === 0) errors.push(`[条形图] .bar-chart 内无 .bar-row`);
  if (!chart.includes('bar-label')) errors.push(`[条形图] 存在无类别标签(bar-label)的图`);
  if (!chart.includes('bar-fill')) errors.push(`[条形图] 存在无 bar-fill 的图`);
  if (!chart.includes('bar-value')) errors.push(`[条形图] 存在无数值标签(bar-value)的图`);
}

/* ---------- 4. 环形图数据纪律 ---------- */
const donuts = blocks(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g).filter(b => hasToken(b, 'donut') && !hasToken(b, 'donut-wrap') && !hasToken(b, 'donut-box'));
for (const d of donuts) {
  const hasAngles = /--d0:\s*[\d.]+deg/.test(d) || /conic-gradient\(/.test(d);
  if (!hasAngles) errors.push(`[环形图] .donut 缺少角度定义(conic-gradient，按百分比×3.6° 累加)`);
  if (!/donut-hole/.test(body)) errors.push(`[环形图] 存在环形图但缺少 donut-hole 空心结构`);
}
if (donuts.length && !body.includes('donut-legend')) {
  errors.push(`[环形图] 存在环形图但没有 donut-legend 图例`);
}

/* ---------- 5. 图片纪律 ---------- */
const imgs = q(/<img\b[^>]*>/g);
for (const img of imgs) {
  const src = img.match(/\bsrc="([^"]+)"/);
  if (src && /^https?:\/\//.test(src[1])) {
    errors.push(`[图片] 外链图片不可用于印刷: ${src[1]}`);
  }
  if (!/alt="[^"]+"/.test(img)) warnings.push(`[图片] 存在无 alt 的 <img>`);
  if (!src || src[1] === '') errors.push(`[图片] 存在无 src 的 <img>`);
}
const figures = q(/<figure\b[^>]*>[\s\S]*?<\/figure>/g);
for (const fig of figures) {
  if (!/<\s*img/.test(fig)) errors.push(`[图片] 存在空 <figure>(无 <img>)`);
}

/* ---------- 6. 页码完整性 ---------- */
for (const page of pages) {
  if (!hasToken(page.tag, 'cover') && !hasToken(page.tag, 'divider') && !page.slice.includes('page-foot')) {
    warnings.push(`[页码] 某 .page 疑似无 .page-foot(封面/幕封可忽略)`);
  }
}
const pfNums = q(/class="pf-num"[^>]*>([^<]*)</g).map(m => m[1].trim());
const emptyNums = pfNums.filter(v => !v);
if (emptyNums.length) errors.push(`[页码] 有 ${emptyNums.length} 个空页码 .pf-num`);

/* ---------- 7. 骨架纪律: 组件缺件 ---------- */
const statCells = blocks(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g).filter(b => hasToken(b, 'st-num'));
const missingUnit = statCells.filter(b => !/<b[^>]*>/.test(b.slice(0, b.indexOf('</div>'))));
if (missingUnit.length) warnings.push(`[组件] 有 ${missingUnit.length} 个 .st-num 无 <b> 单位标记`);

/* ---------- 输出 ---------- */
const fmt = (list, kind) => list.forEach(m => console.log(`  ${kind} ${m}`));
console.log(`\n校验手册: ${file}`);
console.log(`  页面数: ${pages.length} | 骨架布局: ${layouted.length}/${pages.length} | 锚点: ${spIds.size} 个`);
if (errors.length) {
  console.log(`  ✗ 错误 ${errors.length} 项 (必须修复):`);
  fmt(errors, '•');
} else {
  console.log(`  ✓ 错误 0 项`);
}
if (warnings.length) {
  console.log(`  ! 警告 ${warnings.length} 项 (建议检查):`);
  fmt(warnings, '•');
} else if (!errors.length) {
  console.log(`  ✓ 警告 0 项`);
}
console.log(`\n${errors.length ? '✗ 未通过 — 请修复后重跑' : '✓ 通过 — 可交付'}`);
exit(errors.length ? 1 : warnings.length ? 2 : 0);
