#!/usr/bin/env node
/**
 * validate-journal.mjs
 * 模版 C（东方学报风）交付前自检：跑一遍确认版式/数据/组件纪律。
 * 检查项针对 C 组件族（骨架 X00–X18）：
 *   folio 页码与奇偶 / 圆环图 SVG / 柱图 / 技能阶梯 ladder /
 *   薪酬三档 sal / 发展路径 pway / 岗位十二段序数 / 目录 data-pg 回填 /
 *   canvas 溢出（folio 底线、对开宽度）。
 *
 * 用法:
 *   node validate-journal.mjs <手册.html> [--quiet]
 *
 * 退出码: 0 = 通过(可打印), 1 = 有错误(需修), 2 = 有警告(可打印但建议看)
 */
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const file = args.find(a => !a.startsWith('--'));

if (!file) {
  console.error('用法: node validate-journal.mjs <手册.html> [--quiet]');
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

// 剥掉 <script>/<style>, 只留可打印 HTML
const body = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '');

const q = (re) => [...body.matchAll(re)].map(m => m[0]);

const hasToken = (tag, token) => {
  const m = tag.match(/\bclass="([^"]*)"/);
  if (!m) return false;
  return new RegExp(`(?:^|\\s)${token}(?:\\s|$)`).test(m[1]);
};
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

/* ---------- 1. data-layout 覆盖率（骨架 X00–X18） ---------- */
const pageTags = [...body.matchAll(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g)]
  .map(m => ({ tag: m[0], idx: m.index }))
  .filter(o => hasToken(o.tag, 'page'));
const pages = pageTags.map(o => {
  const end = pageTags.find(p => p.idx > o.idx);
  return { tag: o.tag, slice: body.slice(o.idx, end ? end.idx : undefined) };
});
const layoutRe = /\bdata-layout="X\d{2}[a-z]?"/;
const layouted = pages.filter(p => layoutRe.test(p.tag));
if (pages.length && layouted.length !== pages.length) {
  errors.push(`[版式] 有 ${pages.length - layouted.length}/${pages.length} 个 .page 缺 data-layout="Xxx"`);
}
for (const p of layouted) {
  const m = p.tag.match(/data-layout="(X\d{2})/);
  if (m && parseInt(m[1].slice(1), 10) > 18) {
    errors.push(`[版式] 未知骨架 ${m[1]}（模板只定义 X00–X18）`);
  }
}
// 必现骨架清单（C 分页锁死：上篇六页 + 每岗位 5 页）
const layoutsSeen = new Set(layouted.map(p => p.tag.match(/data-layout="(X\d{2}[a-z]?)"/)[1]));
const MANDATORY = ['X00', 'X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07', 'X08', 'X09', 'X10', 'X11', 'X12', 'X13', 'X15', 'X17a', 'X17b', 'X17c', 'X17d', 'X18'];
for (const L of MANDATORY) {
  if (!layoutsSeen.has(L)) errors.push(`[版式] 缺必需骨架 ${L}（上篇六页 + 岗位五页是固定分页锁）`);
}

/* ---------- 2. 页面左右交替 & 页码奇偶 ---------- */
for (let i = 0; i < pages.length; i++) {
  const expectSide = i % 2 === 0 ? 'left' : 'right';
  if (!hasToken(pages[i].tag, expectSide)) {
    errors.push(`[版式] 第 ${i + 1} 页应为 .${expectSide}（对开须 left/right 交替）`);
  }
}
const folioPages = pages.filter(p => /class="folio"/.test(p.slice));
const nums = folioPages.map(p => {
  const m = p.slice.match(/class="folio"[^>]*>[\s\S]*?<b>(\d+)<\/b>/);
  return m ? parseInt(m[1], 10) : NaN;
});
for (let i = 0; i < folioPages.length; i++) {
  const isLeft = hasToken(folioPages[i].tag, 'left');
  if (!isNaN(nums[i]) && (nums[i] % 2 === 0) !== isLeft) {
    errors.push(`[页码] P.${String(nums[i]).padStart(2, '0')} 奇偶与左右页不符（偶数须在左页）`);
  }
  if (i > 0 && !isNaN(nums[i]) && !isNaN(nums[i - 1]) && nums[i] <= nums[i - 1]) {
    errors.push(`[页码] P.${nums[i]} 未按顺序递增（前一页 P.${nums[i - 1]}）`);
  }
}
// 无 folio 的白名单：X00/X01 封面、X03 序图、X15 岗位封面（出血整版图）
const NO_FOLIO = new Set(['X00', 'X01', 'X03', 'X15']);
for (const p of pages) {
  const m = p.tag.match(/data-layout="(X\d{2})/);
  if (m && !NO_FOLIO.has(m[1]) && !/class="folio"/.test(p.slice)) {
    errors.push(`[页码] ${m[1]} 页缺 .folio 页码（仅 X00/X01/X03/X15 可不显示）`);
  }
}

/* ---------- 3. 目录回填：vt-entry 的 data-pg 与显示页码一致 ---------- */
for (const v of q(/class="vt-entry"[^>]*>[\s\S]*?<\/div>/g)) {
  const dataM = v.match(/\bdata-pg="(\d+)"/);
  if (!dataM) continue;
  const shownM = v.match(/class="ve-pg"([^>]*)>(\d+)</);
  if (!shownM) { errors.push('[目录] .ve-pg 未显示页码'); continue; }
  if (dataM[1] !== shownM[2]) {
    errors.push(`[目录] .ve-pg 显示 ${shownM[2]} 与 data-pg="${dataM[1]}" 不一致`);
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

/* ---------- 6. 柱图纪律（col-chart） ---------- */
const colCharts = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'col-chart'));
for (const c of colCharts) {
  const cols = (c.match(/\bclass="ccol(?:\s|")/g) || []).length;
  if (!cols) { errors.push('[柱图] .col-chart 内无 .ccol'); continue; }
  const after = body.slice(body.indexOf(c) + c.length);
  const labels = after.match(/class="ccol-labels">([\s\S]*?)<\/div>/);
  const labelSpan = labels ? (labels[1].match(/<span>/g) || []).length : 0;
  if (!labelSpan) errors.push('[柱图] 缺 .ccol-labels 类别标签');
  else if (labelSpan !== cols) errors.push(`[柱图] 柱数 ${cols} 与标签数 ${labelSpan} 不一致`);
  const hs = [...c.matchAll(/class="bar"[^>]*height:\s*([0-9.]+)%/g)].map(m => parseFloat(m[1]));
  if (hs.some(h => h > 100)) errors.push('[柱图] 柱高超过 100%（须按峰值归一）');
  if (hs.length && Math.max(...hs) < 99) warnings.push('[柱图] 无 100% 满刻度柱（峰值柱应 height:100%）');
}

/* ---------- 7. 细条图纪律（hbar） ---------- */
const hbars = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'hbar-row'));
for (const h of hbars) {
  const fill = h.match(/class="hf([^"]*)"[^>]*width:\s*([0-9.]+)%/);
  if (!fill) { errors.push('[细条图] .hbar-row 内无 .hf 填色'); continue; }
  const w = parseFloat(fill[2]);
  if (w > 100) errors.push(`[细条图] 条宽 ${w}% 超过 100%（须按满宽归一）`);
}

/* ---------- 8. 技能阶梯纪律（ladder：3 级固定、编号连号） ---------- */
const ladders = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'ladder') && !hasToken(t, 'lad-r'));
for (const l of ladders) {
  const rows = (l.match(/class="lad-r"/g) || []).length;
  if (rows !== 3) errors.push(`[技能阶梯] .ladder 应为 3 级，实得 ${rows} 级`);
  const nos = [...l.matchAll(/class="lad-no">([^<]*)</g)].map(m => m[1]);
  const CH = ['其一', '其二', '其三'];
  for (let i = 0; i < Math.min(nos.length, CH.length); i++) {
    if (nos[i] !== CH[i]) errors.push(`[技能阶梯] 第 ${i + 1} 级序号应为「${CH[i]}」，实得「${nos[i]}」`);
  }
  for (const r of [...l.matchAll(/class="lad-r"[\s\S]*?<\/div><\/div>/g)].map(m => m[0])) {
    if (!/lad-t/.test(r) || !/lad-k/.test(r) || !/lad-d/.test(r)) {
      errors.push('[技能阶梯] 某级缺 .lad-t / .lad-k / .lad-d 之一');
    }
  }
}

/* ---------- 9. 薪酬三档纪律（sal：三档、有 acc 高亮） ---------- */
const sals = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'sal') && !hasToken(t, 'sal-c'));
for (const s of sals) {
  const cells = (s.match(/class="sal-c/g) || []).length;
  if (cells !== 3) errors.push(`[薪酬] .sal 应为 3 档，实得 ${cells} 档`);
  if (!/sal-c acc/.test(s)) warnings.push('[薪酬] .sal 无 acc 高亮档（高级档应有朱砂 highlight）');
}

/* ---------- 10. 发展路径纪律（pway：每轨有箭头链与末级高亮） ---------- */
const pways = elements(/<div\b[^>]*\bclass="([^"]*)"[^>]*>/g, t => hasToken(t, 'pway') && !hasToken(t, 'pw-r'));
for (const p of pways) {
  const tracks = (p.match(/class="pw-r"/g) || []).length;
  if (tracks < 2) errors.push(`[发展路径] .pway 至少 2 轨，实得 ${tracks} 轨`);
  const arrowChains = (p.match(/pw-step/g) || []).length;
  if (!arrowChains) errors.push('[发展路径] .pway 内无 .pw-step');
  const steps = (p.match(/\bclass="pw-step(?:\s|")/g) || []).length;
  if (steps !== arrowChains) errors.push(`[发展路径] 轨道步数 ${steps} 与高亮数不一致`);
  for (const t of [...p.matchAll(/class="pw-r"[\s\S]*?<\/div><\/div>/g)].map(m => m[0])) {
    if (!/pw-t/.test(t) || !/pw-seq/.test(t)) errors.push('[发展路径] 某轨缺 .pw-t 或 .pw-seq');
    if (!/pw-step hl/.test(t)) errors.push('[发展路径] 某轨缺末级 .hl 高亮');
  }
}

/* ---------- 11. 岗位十二段序数连号（壹→拾贰，跨页接力） ---------- */
const ORD = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾', '拾壹', '拾贰'];
const secNos = q(/class="jm-no">([^<]*)</g).map(m => m.match(/>([^<]*)</)[1]);
let ordPos = 0;
for (const s of secNos) {
  if (s === ORD[ordPos]) { ordPos++; continue; }
  // 新岗位重置回壹
  if (s === '壹') { ordPos = 1; continue; }
  errors.push(`[岗位档案] 序数断号：应为「${ORD[ordPos]}」，实得「${s}」（十二段须连号且每岗位从壹起）`);
}
const perJob = q(/class="jm-no">壹</g).length;
if (perJob) {
  const n = q(/class="jm-h"/g).length / perJob;
  if (Math.abs(n - 12) > 0.01) warnings.push(`[岗位档案] 平均每岗位 ${n.toFixed(1)} 段（应 12 段）`);
}

/* ---------- 12. 对开结构：spread 双页 & 整版出血页无内边距 ---------- */
const spreads = [...body.matchAll(/<section class="spread"/g)];
const pageCount = pages.length;
if (spreads.length && spreads.length * 2 !== pageCount) {
  errors.push(`[版式] ${spreads.length} 个对开 × 2 ≠ ${pageCount} 页`);
}
for (const p of pages) {
  const m = p.tag.match(/data-layout="(X\d{2})/);
  if (m && ['X01', 'X03', 'X15'].includes(m[1]) && !/padding:0/.test(p.tag)) {
    errors.push(`[出血] ${m[1]} 整版出血页应 padding:0`);
  }
}

/* ---------- 13. 图片纪律 ---------- */
const imgs = q(/<img\b[^>]*>/g);
for (const img of imgs) {
  const src = img.match(/\bsrc="([^"]*)"/);
  if (!src || !src[1]) errors.push('[图片] 存在无 src 的 <img>');
  else if (/^https?:\/\//.test(src[1])) errors.push(`[图片] 外链图片不可用于印刷: ${src[1]}`);
  if (!/alt="/.test(img)) warnings.push('[图片] 存在无 alt 的 <img>');
}

/* ---------- 14. 占位符纪律 ---------- */
const leftover = q(/\[必填[^\]]*\]/g);
if (leftover.length) errors.push(`[占位] 仍有 ${leftover.length} 个 [必填] 占位符未替换`);
if (body.includes('Lorem')) warnings.push('[占位] 疑似残留 Lorem 占位文本');

/* ---------- 15. 字体文件 ---------- */
const needsFonts = ['MiSans-Regular', 'MiSans-Semibold', 'IBMPlexMono', 'NotoSerifSC'];
for (const f of needsFonts) {
  if (!html.includes(f)) warnings.push(`[字体] 未引用 ${f}(若未用到可忽略)`);
}

/* ---------- 输出 ---------- */
const fmt = (list, kind) => list.forEach(m => console.log(`  ${kind} ${m}`));
const pgRange = nums.length ? `P.${String(nums[0]).padStart(2, '0')}–P.${String(nums[nums.length - 1]).padStart(2, '0')}` : '无';
console.log(`\n校验手册: ${file}`);
console.log(`  页面数: ${pages.length} | 对开: ${spreads.length} | 骨架: ${layouted.length}/${pages.length} | 页码: ${pgRange} | 岗位段: ${secNos.length} 个`);
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
