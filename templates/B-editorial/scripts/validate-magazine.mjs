#!/usr/bin/env node
/**
 * validate-magazine.mjs
 * 模版 B（杂志编辑风）交付前自检：跑一遍确认版式/数据/组件纪律。
 * 检查项针对 B 组件族（骨架 M00–M17）：
 *   folio 页码与奇偶 / 圆环图 SVG / track 数据轨道(--v) / 堆叠条(--w) /
 *   柱图 / 支柱色块 / xtable 表格 / pullquote 引文 / 岗位档案 sec-no 序列。
 *
 * 用法:
 *   node validate-magazine.mjs <手册.html> [--quiet] [--sample]
 *
 * 退出码: 0 = 通过(可打印), 1 = 有错误(需修), 2 = 有警告(可打印但建议看)
 */
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const file = args.find(a => !a.startsWith('--'));

if (!file) {
  console.error('用法: node validate-magazine.mjs <手册.html> [--quiet] [--sample]');
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

const hasToken = (tag, token) => {
  const m = tag.match(/\bclass="([^"]*)"/);
  if (!m) return false;
  return new RegExp(`(?:^|\\s)${token}(?:\\s|$)`).test(m[1]);
};
// 嵌套感知切取：从开标签起，数 <tag>/</tag> 深度，取到配对闭合（含内部嵌套内容）
const nestSlice = (start) => {
  const tag = body.slice(start).match(/^<(\w+)/)[1];
  const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'g');
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(body))) {
    if (m[0].startsWith('</')) { if (--depth === 0) return body.slice(start, re.lastIndex); }
    else if (!m[0].endsWith('/>')) depth++;
  }
  return body.slice(start);
};
const elements = (openRe, pred) =>
  [...body.matchAll(openRe)].filter(m => pred(m[0])).map(m => nestSlice(m.index));

/* ---------- 1. data-layout 覆盖率（骨架 M00–M17） ---------- */
const pageTags = [...body.matchAll(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g)]
  .map(m => ({ tag: m[0], idx: m.index }))
  .filter(o => hasToken(o.tag, 'page'));
const pages = pageTags.map(o => {
  const end = pageTags.find(p => p.idx > o.idx);
  return { tag: o.tag, slice: body.slice(o.idx, end ? end.idx : undefined) };
});
const layoutRe = /\bdata-layout="M\d{2}[a-z]?"/;
const layouted = pages.filter(p => layoutRe.test(p.tag));
if (pages.length && layouted.length !== pages.length) {
  errors.push(`[版式] 有 ${pages.length - layouted.length}/${pages.length} 个 .page 缺 data-layout="Mxx"`);
}
for (const p of layouted) {
  const m = p.tag.match(/data-layout="(M\d{2})/);
  if (m && parseInt(m[1].slice(1), 10) > 17) {
    errors.push(`[版式] 未知骨架 ${m[1]}（模板只定义 M00–M17）`);
  }
}

/* ---------- 2. 页面左右交替 & 页码奇偶 ---------- */
for (let i = 0; i < pages.length; i++) {
  const expectSide = i % 2 === 0 ? 'left' : 'right';
  if (!hasToken(pages[i].tag, expectSide)) {
    errors.push(`[版式] 第 ${i + 1} 页应为 .${expectSide}（对开须 left/right 交替）`);
  }
}
const folioPages = pages.filter(p => p.slice.includes('fl-num'));
const nums = folioPages.map(p => parseInt(p.slice.match(/class="fl-num"[^>]*>([^<]*)</)[1], 10));
for (let i = 0; i < folioPages.length; i++) {
  const isLeft = hasToken(folioPages[i].tag, 'left');
  if (!isNaN(nums[i]) && (nums[i] % 2 === 0) !== isLeft) {
    errors.push(`[页码] P.${String(nums[i]).padStart(2, '0')} 奇偶与左右页不符（偶数须在左页）`);
  }
  if (i > 0 && !isNaN(nums[i]) && !isNaN(nums[i - 1]) && nums[i] <= nums[i - 1]) {
    errors.push(`[页码] P.${nums[i]} 未按顺序递增（前一页 P.${nums[i - 1]}）`);
  }
}
// 无 folio 的白名单：M00/M01 封面、M03 序图、M15 岗位封面（计数但不显示）
const NO_FOLIO = new Set(['M00', 'M01', 'M03', 'M15']);
for (const p of pages) {
  const m = p.tag.match(/data-layout="(M\d{2})/);
  if (m && !NO_FOLIO.has(m[1]) && !p.slice.includes('fl-num')) {
    errors.push(`[页码] ${m[1]} 页缺 .folio 页码（仅 M00/M01/M03/M15 可不显示）`);
  }
}
const emptyNums = q(/class="fl-num"[^>]*>([^<]*)</g).map(m => m[1].trim()).filter(v => !v);
if (emptyNums.length) errors.push(`[页码] 有 ${emptyNums.length} 个空页码 .fl-num`);

/* ---------- 3. 锚点有效性: sp-* 必须被目录引用 ---------- */
const sampleMode = args.includes('--sample');
const spIds = new Set(q(/id="(sp-[^"]+)"/g).map(m => m.match(/id="([^"]+)"/)[1]));
const tocRefs = new Set(q(/href="#(sp-[^"]+)"/g).map(m => m.match(/href="#([^"]+)"/)[1]));
for (const ref of tocRefs) {
  if (!spIds.has(ref)) {
    const msg = `[锚点] 目录引用了不存在的 id="#${ref}"`;
    (sampleMode ? warnings : errors).push(sampleMode ? `${msg}(样板未收录)` : msg);
  }
}

/* ---------- 4. 图表纪律：SVG 内禁 var() 作 presentation 属性 ---------- */
const svgBlocks = body.match(/<svg\b[\s\S]*?<\/svg>/g) || [];
for (const s of svgBlocks) {
  const bad = s.match(/\b(?:fill|stroke|stop-color)="var\(/);
  if (bad) errors.push(`[SVG] 存在 ${bad[0]}… — presentation 属性不可用 var()，改用 style="${bad[0].split('=')[0]}: var(--x);"`);
}

/* ---------- 5. 圆环图纪律（donut） ---------- */
const donuts = svgBlocks.filter(s => s.includes('donut-svg'));
for (const d of donuts) {
  if (!/viewBox="0 0 42 42"/.test(d)) errors.push('[圆环图] donut-svg viewBox 必须为 "0 0 42 42"');
  const segs = [...d.matchAll(/stroke-dasharray="([\d.]+) ([\d.]+)"/g)];
  if (!segs.length) { errors.push('[圆环图] 圆环无 stroke-dasharray 分段'); continue; }
  for (const s of segs) {
    const sum = parseFloat(s[1]) + parseFloat(s[2]);
    if (Math.abs(sum - 100) > 0.5) errors.push(`[圆环图] dasharray "${s[1]} ${s[2]}" 两值之和应为 100（实得 ${sum.toFixed(1)}）`);
  }
  const first = d.match(/stroke-dasharray="[\d.]+ [\d.]+" stroke-dashoffset="([\d.-]+)"/);
  if (first && Math.abs(parseFloat(first[1]) - 25) > 0.01) {
    errors.push(`[圆环图] 首环 dashoffset 必须为 25（12 点起画），实得 ${first[1]}`);
  }
}
if (donuts.length && !body.includes('donut-legend')) {
  errors.push('[圆环图] 存在圆环图但没有 .donut-legend 图例');
}

/* ---------- 6. 数据轨道纪律（track 的 --v 与 tr-val 数量一致） ---------- */
const tracks = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'track') && !hasToken(t, 'track-row') && !hasToken(t, 'track-bar'));
for (const t of tracks) {
  const rowCount = (t.match(/class="track-row"/g) || []).length;
  if (rowCount === 0) { errors.push('[数据轨道] .track 内无 .track-row'); continue; }
  const vs = [...t.matchAll(/--v:\s*([0-9.]+)%/g)].map(m => parseFloat(m[1]));
  const vals = [...t.matchAll(/class="tr-val">([^<]*)</g)].map(m => m[1].trim());
  if (vs.length !== rowCount) errors.push(`[数据轨道] 有 ${rowCount} 行但只有 ${vs.length} 个 --v`);
  if (vals.length !== rowCount) errors.push(`[数据轨道] 有 ${rowCount} 行但只有 ${vals.length} 个 .tr-val`);
  if ((t.match(/class="tb-fill/g) || []).length < rowCount) errors.push('[数据轨道] 存在无 .tb-fill 填色的轨道行');
  if (vs.some(v => v <= 0 || v > 100)) errors.push('[数据轨道] --v 须在 (0,100] 区间（以最大值为满刻度归一）');
}

/* ---------- 7. 堆叠条纪律（stack-bar 的 --w 之和 ≈ 100） ---------- */
const stacks = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'stack-bar'));
for (const s of stacks) {
  const ws = [...s.matchAll(/--w:\s*([0-9.]+)%/g)].map(m => parseFloat(m[1]));
  if (!ws.length) { errors.push('[堆叠条] .stack-bar 内无 --w 分段'); continue; }
  const sum = ws.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 1) errors.push(`[堆叠条] --w 之和应为 100%，实得 ${sum.toFixed(2)}%`);
}

/* ---------- 8. 柱图纪律（col-chart） ---------- */
const colCharts = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'col-chart'));
for (const c of colCharts) {
  const cols = (c.match(/class="ccol">/g) || []).length;
  if (!cols) { errors.push('[柱图] .col-chart 内无 .ccol'); continue; }
  const after = body.slice(body.indexOf(c) + c.length);
  const labels = after.match(/<div class="ccol-labels">([\s\S]*?)<\/div>/);
  const labelSpan = labels ? (labels[1].match(/<span>/g) || []).length : 0;
  if (!labelSpan) errors.push('[柱图] 缺 .ccol-labels 类别标签');
  else if (labelSpan !== cols) errors.push(`[柱图] 柱数 ${cols} 与标签数 ${labelSpan} 不一致`);
  const hs = [...c.matchAll(/class="bar"[^>]*height:\s*([0-9.]+)%/g)].map(m => parseFloat(m[1]));
  if (hs.some(h => h > 100)) errors.push('[柱图] 柱高超过 100%（须按峰值归一）');
  if (hs.length && Math.max(...hs) < 99) warnings.push('[柱图] 无 100% 满刻度柱（峰值柱应 height:100%）');
}

/* ---------- 9. 支柱色块纪律（pillars） ---------- */
const pcols = elements(/<div\b[^>]*\bclass="(pcol\s[^"]*|pcol)"[^>]*>/g, () => true);
for (const p of pcols) {
  if (!/pcol-idx/.test(p)) errors.push('[支柱] .pcol 缺 .pcol-idx');
  if (!/pcol-t/.test(p)) errors.push('[支柱] .pcol 缺 .pcol-t 标题');
  if (!/pcol-d/.test(p)) errors.push('[支柱] .pcol 缺 .pcol-d 描述');
}

/* ---------- 10. 表格纪律 ---------- */
const xtables = elements(/<table\b[^>]*class="([^"]*)"/g, t => hasToken(t, 'xtable'));
for (const t of xtables) {
  if (!/<th[^>]*>/.test(t)) errors.push('[表格] .xtable 缺少表头 <th>');
}

/* ---------- 11. 引文纪律 ---------- */
const quotes = elements(/<(?:div|blockquote)\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'pullquote'));
for (const qq of quotes) {
  if (!/class="pq-cn"/.test(qq) && !/<p>/.test(qq)) errors.push('[引文] .pullquote 缺少 .pq-cn 或 <p> 引文正文');
}

/* ---------- 12. 岗位档案 sec-no 序列（十二段连号） ---------- */
const secNos = q(/class="sec-no">(\d+)</g).map(m => parseInt(m.match(/>(\d+)</)[1], 10));
for (let i = 1; i < secNos.length; i++) {
  if (secNos[i] !== secNos[i - 1] + 1 && secNos[i] !== 1) {
    errors.push(`[岗位档案] sec-no 断号：…${String(secNos[i - 1]).padStart(2, '0')} → ${String(secNos[i]).padStart(2, '0')}（十二段须连号）`);
  }
}

/* ---------- 13. pin-bottom 纪律（须在 flex-fill 页内） ---------- */
for (const p of pages) {
  if (p.slice.includes('pin-bottom') && !hasToken(p.tag, 'flex-fill')) {
    errors.push('[布局] 存在 .pin-bottom 但页面无 .flex-fill（margin-top:auto 需要 flex 页）');
  }
}

/* ---------- 14. 图片纪律 ---------- */
const imgs = q(/<img\b[^>]*>/g);
for (const img of imgs) {
  const src = img.match(/\bsrc="([^"]*)"/);
  if (!src || !src[1]) errors.push('[图片] 存在无 src 的 <img>');
  else if (/^https?:\/\//.test(src[1])) errors.push(`[图片] 外链图片不可用于印刷: ${src[1]}`);
  if (!/alt="/.test(img)) warnings.push('[图片] 存在无 alt 的 <img>');
}

/* ---------- 15. 占位符纪律 ---------- */
const leftover = q(/\[必填[^\]]*\]/g);
if (leftover.length) errors.push(`[占位] 仍有 ${leftover.length} 个 [必填] 占位符未替换`);
if (body.includes('Lorem')) warnings.push('[占位] 疑似残留 Lorem 占位文本');

/* ---------- 16. 字体文件 ---------- */
const needsFonts = ['MiSans-Regular', 'MiSans-Semibold', 'IBMPlexMono', 'AlibabaPuHuiTi-3', 'NotoSerifSC'];
for (const f of needsFonts) {
  if (!html.includes(f)) warnings.push(`[字体] 未引用 ${f}(若未用到可忽略)`);
}

/* ---------- 输出 ---------- */
const fmt = (list, kind) => list.forEach(m => console.log(`  ${kind} ${m}`));
console.log(`\n校验手册: ${file}`);
console.log(`  页面数: ${pages.length} | 骨架布局: ${layouted.length}/${pages.length} | 页码: ${nums.length ? `P.${String(nums[0]).padStart(2, '0')}–P.${String(nums[nums.length - 1]).padStart(2, '0')}` : '无'} | 锚点: ${spIds.size} 个`);
if (errors.length) {
  console.log(`  ✗ 错误 ${errors.length} 项 (必须修复):`);
  fmt(errors, '•');
} else {
  console.log('  ✓ 错误 0 项');
}
if (warnings.length) {
  console.log(`  ! 警告 ${warnings.length} 项 (建议检查):`);
  if (!quiet) fmt(warnings, '•');
} else if (!errors.length) {
  console.log('  ✓ 警告 0 项');
}
console.log(`\n${errors.length ? '✗ 未通过 — 请修复后重跑' : '✓ 通过 — 可交付'}`);
exit(errors.length ? 1 : warnings.length ? 2 : 0);
