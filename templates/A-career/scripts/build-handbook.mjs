#!/usr/bin/env node
/**
 * build-handbook.mjs
 * 从 content JSON 生成手册 HTML（模板架构的产物）。
 * 未来换专业 = 只改 content JSON + theme tokens，版式永不走样。
 *
 * 用法:
 *   node build-handbook.mjs <content.json> <输出.html> [--theme academy-blue]
 *
 * 分页模型（版式锁）:
 *   - 页面单位 = 210×285 大16开单页，按阅读顺序流式编号（01,02,03,…）。
 *   - 打印对开 = 420×285。
 *   - 封面+封底 = 整版宽页（左半封底 / 右半封面），无页码。
 *   - 序+目录 = 一个对开（左页序 / 右页目录）。
 *   - meta.sample === true：其后的幕封/数据页/岗位页逐页单页展示（.spread.single），
 *     等待全量内容到位后由配对器自动两两拼对开。
 *   - meta.sample !== true：内容页两两配对（左页 + 右页），绝无右页空白。
 */
import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let jsonPath = args[0], outPath = args[1], themeFlag = null;
if (args[2] === '--theme') themeFlag = args[3];
else if (args[2] && args[2].startsWith('--theme')) themeFlag = args[2];
if (!jsonPath || !outPath) {
  console.error('用法: node build-handbook.mjs <content.json> <输出.html> [--theme <name>]');
  process.exit(2);
}

/* ---------- 主题色提取（从 _shared/themes.md 解析 9 套 token，三模版共用） ---------- */
const SHARED = join(ROOT, '..', '..', '_shared');
const themesMd = readFileSync(join(SHARED, 'themes.md'), 'utf8');
const themeNames = [...themesMd.matchAll(/^## \d+\. \S+ [一-龥A-Za-z]+ ([A-Z][A-Za-z ]+)（.*$/gm)].map(m => m[1].trim());
const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
const themeTokenRe = /--([a-z0-9-]+):\s*(#[0-9a-f]{6})/g;
const themes = {};
const themeBlocks = [...themesMd.matchAll(/```css\n([\s\S]*?)\n```/g)];
themeBlocks.forEach((blk, i) => {
  const t = {};
  for (const m of blk[1].matchAll(themeTokenRe)) t[m[1]] = m[2];
  themes[slug(themeNames[i])] = t;
});

const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
let themeName = data.meta.theme || 'academy-blue';
if (themeFlag) {
  const t = themeFlag.replace('--theme', '').replace(/^[=:\s]+/, '').trim();
  if (t) themeName = t;
}
const theme = themes[themeName];
if (!theme) {
  console.error(`未知主题: ${themeName}（可选: ${Object.keys(themes).join(', ')}）`);
  process.exit(2);
}
const SAMPLE = data.meta.sample === true;

/* ---------- 工具函数 ---------- */
const p = (s) => `<p>${s}</p>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const img = (src, cls, alt) => (src ? `<img class="${cls}" src="${src}" alt="${esc(alt)}" />` : '');
// 年份 SVG 内联为固定资源（不再转 currentColor / 不随主题换色）
const yearSvg = (src, alt) => {
  if (!src) return '';
  try {
    let svg = readFileSync(join(dirname(outPath), src), 'utf8');
    svg = svg.replace(/<svg\b/i, '<svg class="cv-year-svg"');
    return `<span class="cv-year" role="img" aria-label="${esc(alt)}">${svg}</span>`;
  } catch (e) {
    return img(src, 'cv-year-svg', alt);
  }
};

let pfNum = 0;
const pageOf = {}; // 分页时登记 页面 id → 页码（目录 toc-pg 自动回填用）
const wsReport = []; // 数据页内容底距页码线（mm）几何报告：目标 ∈ [6,14]
const contSeq = {}; // 各节续页计数（保证续页 id 唯一）
const nextPage = () => ++pfNum;
const pageFoot = () =>
  `<div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">${String(pfNum).padStart(2, '0')}</span></div>`;

/* ---------- 分页器 ---------- */
const sections = [];
const pending = []; // 待配对单页 {id, layout, html}
let nextSpreadId = null;
const wrapPage = (pg, side) =>
  `<div class="page ${side}${pg.cls ? ' ' + pg.cls : ''}" data-layout="${pg.layout}" id="${pg.id}">\n    ${pg.html}\n  </div>`;
const emitSpread = (inner, cls, id) => {
  const idAttr = id ? ` id="${id}"` : '';
  sections.push(`<section class="spread${cls ? ' ' + cls : ''}"${idAttr}>\n  ${inner}\n</section>`);
};
const flushPages = () => {
  if (SAMPLE) {
    // 样板：幕封(coupled)与紧随页拼一个真对开；标注 pair 的连续两页也按实际对开拼版
    for (let i = 0; i < pending.length; i++) {
      const pg = pending[i];
      const id = pg.spreadId || nextSpreadId || undefined; // 页 id 已在 .page 上，对开不重复挂 id
      nextSpreadId = null;
      const partner = pending[i + 1];
      if ((pg.coupled || pg.pair) && partner && !partner.coupled) {
        emitSpread(`${wrapPage(pg, 'left')}\n  ${wrapPage(partner, 'right')}`, '', id);
        i++;
      } else {
        emitSpread(wrapPage(pg, 'left'), 'single', id);
      }
    }
  } else {
    for (let i = 0; i < pending.length; i += 2) {
      const l = pending[i];
      const r = pending[i + 1];
      const id = (l && l.spreadId) || (r && r.spreadId) || nextSpreadId;
      nextSpreadId = null;
      let inner = wrapPage(l, 'left');
      if (r) inner += `\n  ${wrapPage(r, 'right')}`;
      emitSpread(inner, r ? '' : 'single', id);
    }
  }
  pending.length = 0;
};
const full = (html) => { flushPages(); sections.push(html); };
const page = (id, layout, html, coupled, cls, spreadId, pair) => { pageOf[id] = pfNum; pending.push({ id, layout, html, coupled, cls, spreadId, pair }); };

/* ---------- L00 封面+封底（整版宽页：左封底 / 右封面，无页码） ---------- */
{
  const c = data.cover;
  const back = c.back || {};
  const stats = (c.stats || []).map(s => `<span>${esc(s)}</span>`).join('<i class="sep"></i>');
  const badge = c.badge || [];
  full(`<!-- L00 封面+封底 -->
<section class="spread cover" id="sp-cover">
  <div class="cov-back">
    <div class="cb-foot">${esc(back.kicker || `CAREER HANDBOOK · ${data.meta.year}`)}</div>
    <div class="cb-notes">${(back.blurb || []).map(p).join('')}</div>
  </div>
  <div class="cov-front">
    <div class="cv-photo">${img(c.image || 'images/cover-main.png', 'cv-img', `${data.meta.major}主视觉`)}</div>
    <div class="cv-band"></div>
    ${img(c.logo || 'images/logo-placeholder.svg', 'cv-logo', '校徽')}
    ${yearSvg(c.yearSvg || 'images/cover-year-2026.svg', String(data.meta.year))}
    <div class="cv-badge"><b>${esc(badge[0] || '职业发展手册')}</b><span>${esc(badge[1] || 'CAREER HANDBOOK')}</span></div>
    <h1 class="cv-title">${esc(c.title.join(''))}</h1>
    <div class="cv-sub">${esc(c.subtitle)}</div>
    <div class="cv-redline"></div>
    <div class="cv-tagline">${esc(c.tagline)}</div>
    <div class="cv-stats">${stats}</div>
  </div>
</section>`);
}

/* ---------- L01+L02 序+目录（左页序 / 右页目录 = 一个对开） ---------- */
{
  const pr = data.preface;
  const t = data.toc;
  // TOC 条目多时（如智能制造 12 个岗位）目录会超出可排版高 → 整体上移 + 缩小部分标题高，保证条目展示且距页码线 ≥12mm
  const tocTotal = [t.part1, t.part2].filter(Boolean).reduce((n, p) => n + (p.entries || []).length, 0);
  const tocCompact = tocTotal > 14 ? ' compact' : '';
  const parts = [t.part1, t.part2].filter(Boolean).map((part, pi) => {
    const partNum = String(pi + 1).padStart(2, '0');
    const rows = (part.entries || []).map((e, i) =>
      `<a class="toc-row" href="#${e.target}">
        <span class="toc-cn">${partNum}.${i + 1}</span>
        <span class="toc-t">${esc(e.title)}</span>
        <span class="toc-pg" data-pg="${e.target}">${SAMPLE ? e.page : ''}</span>
      </a>`).join('');
    return `<div class="toc-part">
      <div class="toc-part-head">${esc(part.tag)}${part.title ? `<span class="tpt">${esc(part.title)}</span>` : ''}</div>
      ${rows}
    </div>`;
  }).join('');
  full(`<!-- L01+L02 序+目录 -->
<section class="spread" id="sp-preface">
  <div class="page left" data-layout="L01" id="preface-1">
    <div class="preface">
      <div class="page-head"><span class="ph-tag">序 · PREFACE</span><span class="ph-title">职业发展手册</span></div>
      <div class="pf-main">
        <figure class="pf-band">
          <img src="${pr.image || 'images/preface-band.png'}" alt="${esc(pr.imageAlt || '序页配图')}" />
        </figure>
        <div class="pf-col">
          <h2 class="pf-title">${esc(pr.kicker || '序')}/</h2>
          <div class="pf-body">
            ${(pr.paragraphs || []).map(p).join('')}
          </div>
          <div class="pf-sign"><span>${esc(pr.sign)}</span><span>${esc(pr.date)}</span></div>
        </div>
      </div>
    </div>
  </div>
  <div class="page right" data-layout="L02" id="sp-toc">
    <div class="toc${tocCompact}">
      <div class="page-head"><span class="ph-tag">目录 · CONTENTS</span><span class="ph-title">职业发展手册</span></div>
      <h2 class="toc-title">目录/</h2>
      <div class="toc-en">Contents</div>
      ${parts}
    </div>
  </div>
  <div class="spread-bar"></div>
</section>`);
}

/* ---------- L03s 幕封（Figma 1309-2717 / 1312-2927：kicker/01-02矢量/双行标题/发丝线/摘要） ---------- */
/* 幕封无「必须落左页」约束：页数由内容撑出，配对器按实际次序拼对开（可落左或右）。 */
/* 幕封数字 01/02 为白色转曲 SVG（Figma 导出，geometry=paths）。
   01 = 1310:2925 "0"+1310:2924 "1"（viewBox 48×47）；02 = 1312:2940 "0"+"2"（viewBox 57×47）。
   两数字在各自幕封内均锚定在 01 的坐标位（rel x34 / y110，用户要求"以01位置为准"）。 */
const DV01 = `<svg viewBox="0 0 48 47" fill="none" aria-hidden="true">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.0978 0C16.6921 0 19.7472 1.1417 22.2632 3.4251C24.8214 5.72964 26.1428 9.01732 26.2274 13.2881V33.6802C26.1428 37.9298 24.8214 41.2069 22.2632 43.5115C19.7472 45.7949 16.6921 46.9577 13.0978 47C9.60931 46.9577 6.60706 45.7949 4.09109 43.5115C1.40598 41.2069 0.0422852 37.9298 0 33.6802V13.2881C0.0422852 9.01732 1.40598 5.72964 4.09109 3.4251C6.60706 1.1417 9.60931 0 13.0978 0ZM13.0978 6.62821C8.86932 6.71278 6.71278 9.07018 6.62821 13.7004V33.2996C6.71278 37.9721 8.86932 40.3295 13.0978 40.3718C17.3052 40.3295 19.4723 37.9721 19.5992 33.2996V13.7004C19.4723 9.07018 17.3052 6.71278 13.0978 6.62821Z" fill="white"/>
    <path d="M47.9514 46.6194H41.3232V7.38934L34.7584 12.2099V5.16937L41.3232 0.380567H47.9514V46.6194Z" fill="white"/>
  </svg>`;
const DV02 = `<svg viewBox="0 0 57 47" fill="none" aria-hidden="true">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.0566 0C16.6395 0 19.685 1.1381 22.193 3.41431C24.7432 5.71159 26.0605 8.98891 26.1448 13.2463V33.574C26.0605 37.8103 24.7432 41.0771 22.193 43.3744C19.685 45.6506 16.6395 46.8098 13.0566 46.8519C9.57903 46.8098 6.58625 45.6506 4.0782 43.3744C1.40155 41.0771 0.042152 37.8103 0 33.574V13.2463C0.042152 8.98891 1.40155 5.71159 4.0782 3.41431C6.58625 1.1381 9.57903 0 13.0566 0ZM13.0566 6.60732C8.84138 6.69163 6.69163 9.0416 6.60732 13.6572V33.1947C6.69163 37.8525 8.84138 40.2024 13.0566 40.2446C17.2507 40.2024 19.411 37.8525 19.5374 33.1947V13.6572C19.411 9.0416 17.2507 6.69163 13.0566 6.60732Z" fill="white"/>
    <path d="M43.5324 0C47.4947 0.042152 50.7088 1.30671 53.1747 3.79368C55.6828 6.25957 56.9578 9.38935 57 13.183C57 16.218 56.0727 18.9157 54.218 21.2762L39.391 39.8652H57V46.4725H30.7288V40.2446L48.7171 17.7354C49.4126 16.8292 49.8869 15.9861 50.1398 15.2063C50.3084 14.4687 50.3927 13.7732 50.3927 13.1198C50.3927 11.3916 49.8552 9.88464 48.7804 8.599C47.6633 7.31337 46.0826 6.64947 44.0383 6.60732C42.2257 6.60732 40.7188 7.18691 39.5175 8.34609C38.274 9.50527 37.5363 11.1387 37.3045 13.2463H30.7288C30.8974 9.41043 32.183 6.23849 34.5857 3.73045C37.0094 1.28563 39.9917 0.042152 43.5324 0Z" fill="white"/>
  </svg>`;
const dvNumeral = (num) =>
  num === '01' ? DV01 : num === '02' ? DV02 : `<span class="dv-num-text">${esc(num)}</span>`;
const divider = (d, id, layout) => {
  nextPage(); // 幕封计入页码（01 起）并显示反白页码
  page(`${id}-page`, layout, `<div class="dv-kicker">${esc(d.kicker)}</div>
    <div class="dv-num">${dvNumeral(d.num)}</div>
    <h2 class="dv-title">${d.title.map(esc).join('<br />')}</h2>
    <div class="dv-line"></div>
    <p class="dv-lead">${esc(d.lead)}</p>
    ${pageFoot()}`, true, 'divider-p', id);
};
divider(data.part1.divider, 'sp-part1', 'L03s');

/* ---------- L04–L09 数据页（每节 1 页） ---------- */
/* 环形图色阶：accent 明度梯度（同色族，印刷安全），角度由 pct×3.6° 累加 */
// 图表分类色板：多色相（--chart-1..7 在模板 :root 由 accent/marker 派生，随主题自动变化）
const segColor = (i) => `var(--chart-${Math.min(i + 1, 7)})`;
const donutSegs = (sec) => {
  if (!Array.isArray(sec.segs) || !sec.segs.length) {
    console.error(`[环形图] 节 ${sec.id || '(未命名)'} 缺少 segs 数组（须为 [{name, count, pct}]，角度由 pct×3.6° 自动计算）。`);
    process.exit(2);
  }
  return sec.segs;
};
const donutStops = (segs) => {
  if (!Array.isArray(segs) || !segs.length) {
    console.error('[环形图] donutStops 接收到无效 segs 数组（须为 [{name, count, pct}]，请确保 donutSegs() 已验证数据后再传入）。');
    process.exit(2);
  }
  for (let i = 0; i < segs.length; i++) {
    if (typeof segs[i].pct !== 'number' || isNaN(segs[i].pct)) {
      console.error(`[环形图] donutStops: 第 ${i + 1} 个 seg "${segs[i].name || '(未命名)'}" 的 pct 无效（须为数字，收到: ${JSON.stringify(segs[i].pct)}）。`);
      process.exit(2);
    }
  }
  let acc = 0;
  return segs.map((s, i) => {
    const a0 = acc * 3.6; acc += s.pct; const a1 = acc * 3.6;
    return `${segColor(i)} ${a0.toFixed(2)}deg ${a1.toFixed(2)}deg`;
  }).join(', ');
};
const barChart = (bc) => {
  const rows = bc.bars.map((b, i) =>
    `<div class="bar-row">
      <span class="bar-label">${esc(b.label)}${b.count ? `<small>${esc(b.count)}</small>` : ''}</span>
      <div class="bar-track"><div class="bar-fill" style="--v:${b.value};--bar:${segColor(i)}"></div></div>
      <span class="bar-value">${esc(b.value)}${b.unit ? `<b class="b-unit">${esc(b.unit)}</b>` : ''}</span>
    </div>`).join('');
  return `<div class="bar-chart" style="--max:${bc.max}">${rows}</div>`;
};
const statGrid = (stats, cols) =>
  `<div class="stat-grid${cols ? ` cols-${cols}` : ''}">
    ${stats.map(s => `<div class="stat-cell"><div class="st-num">${esc(s.num)}<b>${esc(s.unit)}</b></div><div class="st-label">${esc(s.label)}</div></div>`).join('')}
  </div>`;
const readingBlock = (r) => {
  const items = (Array.isArray(r) ? r : [r]).map(it =>
    typeof it === 'string'
      ? `<div class="rd-item"><p class="rd-body">${esc(it)}</p></div>`
      : `<div class="rd-item"><h3 class="rd-head">${esc(it.h)}</h3><p class="rd-body">${esc(it.t)}</p></div>`
  ).join('');
  return `<div class="reading-block">${items}</div>`;
};
const dataTitleHtml = (sec) =>
  `<h2 class="dp-title">${sec.title.map(esc).join('<br />')}</h2>${sec.note ? `<p class="dp-note">${esc(sec.note)}</p>` : ''}<div class="dp-rule"></div>`;
const dataReadingHtml = (r) =>
  `<div class="rd-item"><h3 class="rd-head">${esc(r.h)}</h3><p class="rd-body">${esc(r.t)}</p></div>`;
const dataChartHtml = (sec) => {
  if (sec.type === 'donut') {
    const segs = donutSegs(sec);
    return `${sec.figcap ? `<div class="fig-cap">${esc(sec.figcap)}</div>` : ''}
    <div class="donut-wrap">
      <div class="donut-box">
        <div class="donut" style="background: conic-gradient(${donutStops(segs)});"></div>
        <div class="donut-hole"><b>${esc(sec.total)}</b><span>${esc(sec.totalLabel || '岗位总量')}</span></div>
      </div>
      <div class="donut-legend">
        ${segs.map((s, i) => `<div class="lg-row"><span class="lg-dot" style="background:${segColor(i)}"></span><span class="lg-name">${esc(s.name)}</span><span class="lg-val">${esc(s.count)} · ${s.pct}%</span></div>`).join('')}
      </div>
    </div>${sec.stats ? statGrid(sec.stats, 3) : ''}`;
  } else if (sec.type === 'bars') {
    return barChart(sec);
  } else if (sec.type === 'stats') {
    return statGrid(sec.stats, 4);
  } else if (sec.type === 'edu') {
    // 上文字 + 下图（用户锁定：禁左图表右文）
    return `<p class="rd-body edu-reading">${esc(sec.reading)}</p>
      <div class="dp-kicker" style="margin-bottom:2mm">学历分布</div>
      ${barChart(sec)}`;
  } else if (sec.type === 'pillars') {
    return `<div class="pillar-grid">
      ${sec.pillars.map(pl => `<div class="pillar">
        <div class="pl-title">${esc(pl.title)}</div>
        <div class="pl-desc">${esc(pl.desc)}</div>
        <div class="pl-tags">${(pl.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>`).join('')}
    </div>`;
  }
  return '';
};
/* 第一部分连续流式排版（用户锁定：各标题不独占一页、内容连贯、一个标题紧跟下一个，
   触到最小 12mm 底距才启动新页；图表紧跟其所在阅读块下方，不单独成页、不重复标题）。
   每个数据节 = 【标题块】+【阅读块组】+【图表】三组原子，按预算流式填页，图表原子化不拆。 */
const DATA_TITLE_H = 22;   // 标题16pt + note10pt + 发丝线 + 上下边距
const MODULE_GAP = 12;      // 第一部分模块间 12mm（用户锁定：01.2 与 01.3 等）
const DATA_RUN_H = 19;      // 续页页头（与第二部分 .jd-run 同款：文字在上、分割线在下）
const RD_HEAD_H = 7.6;      // 阅读小标 11pt/600 lh1.95
const RD_ITEM_TOP = 5.9;    // 小节间距（首节 4.2）
const RD_FIRST_TOP = 4.2;   // 首节间距
const DATA_BUDGET_FIRST = 148; // 首页（band 顶图 113.8，容纳 01.1 全模块：标题+阅读+环形图，底距页码 ≥12mm）
const DATA_BUDGET = 262;    // 续页（容纳 01.4+01.5 双模块同页，其余各模块单页；内容底距页码 ≥12mm）
const LINE_H = 5.11;
const CHARS = 54; // 第一部分数据页专用（实测底距 7–14mm 良好，保持不动）
const JOB_CHARS = 63; // 第二部分岗位页专用：实测混合 CJK+ASCII 每行约 60–66 档（Range.getClientRects 校准）；旧 54 偏低 → 模型高估节高 ~17% → 回拉欠填充、页底留白 23–53mm 超 14mm 上限。63 档使行数估算贴合真实渲染。
const PULL_LEEWAY = 14; // 页底余量 >14mm 时回拉下一节首段/首行/首子标
// 阅读小节高 = 小标 + 正文字行 + 小节上距（首节 4.2 / 后节 5.9，缺则模型低估→内容压页码）
const rdItemH = (t, first) => RD_HEAD_H + Math.max(1, Math.ceil(t.length / CHARS)) * LINE_H + (first ? RD_FIRST_TOP : RD_ITEM_TOP);
const dataChartH = (sec) => {
  if (sec.type === 'donut') {
    // 环形图 + 图例（图例行数决定高度，9+ 行时图例高于图身 46mm）
    const R = (sec.segs || []).length;
    const legendH = Math.max(46, R * 5.08 + Math.max(0, R - 1) * 1.4);
    return 7.8 + legendH + 3 + (sec.stats ? 27 : 0);
  }
  if (sec.type === 'bars') return 6 + sec.bars.length * 13;
  if (sec.type === 'edu') return Math.ceil((sec.reading || '').length / CHARS) * LINE_H + 6 + (sec.bars ? sec.bars.length : 0) * 13 + 10;
  if (sec.type === 'pillars') return 37;
  if (sec.type === 'stats') return 7 + 22;
  return 0;
};
const renderDataFlow = (sections) => {
  // 连续流式排版（用户锁定）：内容逐单元连续流动，01.2 紧跟 01.1 图表页，不重启一页。
  // 阅读块按「能放多少放多少」逐行拆分跨页，余下换页续排；仅图表原子化放不下时整表换页。
  // 每页内容底距页码分割线 ∈ [6,14]mm：逐行填满至不足 6mm 即换行，故落在 [6,11.1) 带内。
  const isBand = !!(sections[0] && sections[0].band);
  const PAGE_TOP = 13, BAND_TOP = 113.8, PAGE_BOTTOM = 263, RUN_H = 19, WS_MIN = 6;
  const contMax = PAGE_BOTTOM - PAGE_TOP - WS_MIN - RUN_H; // 续页内容额（不含页头 19）→ 底距 ≥6
  const bandMax = PAGE_BOTTOM - BAND_TOP - WS_MIN;         // band 首页内容额（hero 之下）→ 底距 ≥6

  const textLines = (t) => {
    const n = Math.max(1, Math.ceil((t || '').length / CHARS));
    const a = [];
    for (let i = 0; i < n; i++) a.push(t.slice(i * CHARS, (i + 1) * CHARS));
    return a;
  };

  // 连续填页：cur = 当前页单元列表；load = 当前页已占内容高；pageIdx = 当前页索引
  const chunks = []; let cur = [], load = 0, pageIdx = 0;
  const budget = (idx) => (idx === 0 && isBand) ? bandMax : contMax;
  const addAtomic = (h, html, gap, meta) => {
    if (cur.length && load + gap + h > budget(pageIdx)) { chunks.push(cur); cur = []; load = 0; pageIdx++; }
    cur.push(Object.assign({ h, html }, meta)); load += h;
  };
  // 阅读块逐行拆分：header 随首行首页，续页不再重复小标；跨页时关闭上一个 <p>、新页重开（无小标）
  const addReading = (sec, hdr, t, first) => {
    const tlines = textLines(t), n = tlines.length;
    let buf = '', bufH = 0, headerPlaced = false;
    const closeAndFlush = () => {
      if (!buf) return;
      buf += '</p></div>';
      cur.push({ h: bufH, html: buf, sec }); load += bufH; buf = ''; bufH = 0;
    };
    for (let li = 0; li < n; li++) {
      const unitH = (li === 0)
        ? LINE_H + (hdr ? RD_HEAD_H : 0) + (first ? RD_FIRST_TOP : RD_ITEM_TOP)
        : LINE_H;
      if (cur.length && load + bufH + unitH > budget(pageIdx)) {
        closeAndFlush();
        chunks.push(cur); cur = []; load = 0; pageIdx++;
      }
      if (li === 0) {
        buf += hdr
          ? `<div class="rd-item"><h3 class="rd-head">${esc(hdr)}</h3><p class="rd-body">${esc(tlines[0])}`
          : `<div class="rd-item"><p class="rd-body">${esc(tlines[0])}`;
        headerPlaced = true;
      } else {
        buf += esc(tlines[li]);
      }
      bufH += unitH;
    }
    closeAndFlush();
  };

  // 逐节流式排版：标题(原子) + 阅读块(可拆) + 图表(原子，放不下整表换页)
  sections.forEach((sec) => {
    const titleHtml = `<span id="${sec.id}" class="data-anchor"></span><div class="dp-module">${dataTitleHtml(sec)}</div>`;
    addAtomic(DATA_TITLE_H, titleHtml, MODULE_GAP, { kind: 'title', sec });
    if (sec.type === 'edu') {
      addReading(sec, '', sec.reading || '', true);
      const barsH = 6 + (sec.bars ? sec.bars.length : 0) * 13 + 10;
      addAtomic(barsH, `<div class="dp-kicker" style="margin-bottom:2mm">学历分布</div>${barChart(sec)}`, DATA_RUN_H * 0.6, { sec });
    } else if (Array.isArray(sec.reading)) {
      for (let i = 0; i < sec.reading.length; i++) addReading(sec, sec.reading[i].h, sec.reading[i].t, i === 0);
      const chartH = dataChartH(sec);
      if (chartH > 0) addAtomic(chartH, dataChartHtml(sec), RD_ITEM_TOP, { sec });
    } else if (dataChartH(sec) > 0) {
      addAtomic(dataChartH(sec), dataChartHtml(sec), 0, { sec });
    }
  });
  if (cur.length) chunks.push(cur);

  // 唯一分页约束：内容底距页码分割线 ∈ [6,14]mm。页数完全由实际内容撑出，
  // 无「幕封在左」「part1 页数奇/偶」等硬约束（流水排版已按 [6,14] 带逐行填满）。

  // 渲染：首页带 band 顶图（仅第一节 band）；除幕封与带图页外，所有页顶部都要有页头（.data-run）
  const part1RunTitle = esc((data.part1.divider.title || []).slice(-1)[0] || '第一部分');
  chunks.forEach((chunk, ci) => {
    nextPage();
    const foot = pageFoot();
    const isBand = ci === 0 && sections[0] && sections[0].band && sections[0].image;
    const hero = isBand ? img(sections[0].image, 'dp-hero-full', sections[0].title.join('')) : '';
    const layout = isBand ? `${sections[0].layout} band` : 'L04';
    const run = isBand ? '' : `<div class="data-run"><span class="data-run-no">第一部分</span><span class="data-run-title">${part1RunTitle}</span></div>`;
    // 仅页面首个标题加 no-gap（其余标题沿用 .dp-module 12mm 间距）
    const flat = chunk.map((at, ai) =>
      ai === 0 && at.kind === 'title'
        ? { ...at, html: at.html.replace('class="dp-module"', 'class="dp-module no-gap"') }
        : at);
    const secTitles = flat.filter(at => at.kind === 'title');
    const firstU = flat[0];
    // 页首为标题 → 该节在此起页；页首为阅读块/图表 → 该节续页（id 追加序号保证唯一）
    let secId;
    if (secTitles.length) {
      secId = secTitles[0].sec.id;
      secTitles.forEach(at => { pageOf[at.sec.id] = pfNum; });
    } else {
      const base = firstU ? firstU.sec.id : sections[0].id;
      const n = ++contSeq[base];
      secId = base + '-cont' + (n > 1 ? '-' + n : '');
    }
    page(secId, layout, `<div class="data">
      ${hero}
      ${run}
      ${flat.map(at => at.html).join('\n')}
    </div>
    ${foot}`, undefined, undefined, undefined, true);
    // 底距报告（几何校验用）：内容底距页码线 = PAGE_BOTTOM − (页顶 + 内容高)
    const top = isBand ? BAND_TOP : PAGE_TOP;
    let est = isBand ? 0 : RUN_H;
    flat.forEach((at, ai) => { if (ai > 0 && at.kind === 'title') est += MODULE_GAP; est += at.h; });
    wsReport.push({ id: secId, page: pfNum, ws: Math.round((PAGE_BOTTOM - (top + est)) * 10) / 10 });
  });
  return chunks.length;
};
const part1Sections = data.part1.sections.map(s => Object.assign({}, s));
const dataPages = renderDataFlow(part1Sections);

/* ---------- L03s 第二部分幕封 ---------- */
divider(data.part2.divider, 'sp-part2', 'L03s');

/* ---------- L11 岗位详解（Figma 1315:2977：首页 = band 满版顶图 + 16pt 题 + 副题 + 发丝线 + 12 节流式，按字符预算分页） ---------- */
// 段落除字符外还有固定行距/段距开销：每段 +16 字符当量，每节头 +60 当量。
// 小节内容若全部为「短标签：正文」形态（如第 10 节 6 小块），自动渲染为小标：
//   前置小色块 + 变色标题 + 正文，每小标再 +55 当量。
const isSubList = (s) =>
  !s.day && !s.table && !!s.body && s.body.length > 0 &&
  s.body.every(pa => /^[^：。，]{2,24}：/.test(pa));
// 行级重量模型：全部以真实 mm 计（template.html CSS + 探针实测校准，不再用「当量」）。
// 正文 10pt/1.45 → 行高 5.11mm；内容宽 186mm ÷ 10pt 全角字(3.53mm) ≈ 52.7 字/行 → 取 54。
// 距值（模板 CSS）：节距 6.93、节头 6.93（序号方块）、正文/小标容器上距 2.77、段距 1.4、
// 小标题行 6.21 + 正文上距 0.7 + 小标间距 3.5、续接正文上距 1.8、日程表上距 2.77 + 表头行 10.71、
// 表格上距 2.5 + 表头行 9.6 + 数据行 9.9、插图 ≈ 42.4（上距 3 + 高 34 + 图注 5.4）。
const SEC_TOP = 6.93;
const HEAD_H = 6.93;
const BODY_TOP = 2.77;
const PARA_GAP = 1.4;
const SUB_H = 6.21;
const SUB_BODY_TOP = 0.7;
const SUB_TOP = 3.5;
const CONT_TOP = 1.8;
const TBL_TOP = 2.5;
const TBL_HEAD = 9.6;
const TBL_ROW = 9.9;
const DAY_TOP = 2.77;
const DAY_HEAD = 10.71;
const DAY_PAD = 5.6;
const FIG_H = 42.4;
// 全角字计 1 档、ASCII/数字计 0.5 档（混合段落实际行数更少，模型按纯 CJK 会高估高度→欠填充）。
// 表面 186mm ÷ 全角 3.53mm ≈ 52.7 档/行，但实测渲染每行实际容纳约 60–66 档（字体更窄/行排版更密），
// 故 CHARS 校准为 63 档贴合真实行数，消除 ~17% 节高估误差。
const width = (t) => (t.match(/[^\x00-\x7f]/g) || []).length + 0.5 * (t.match(/[\x00-\x7f]/g) || []).length;
const paraLines = (t) => Math.max(1, Math.ceil(width(t) / JOB_CHARS));
const bodyH = (s) => {
  const items = s.body || [];
  if (!items.length) return 0;
  const lines = items.reduce((n, pa) => n + paraLines(pa), 0) * LINE_H;
  if (isSubList(s)) return BODY_TOP + lines + items.length * (SUB_H + SUB_BODY_TOP) + (items.length - 1) * SUB_TOP;
  return BODY_TOP + lines + (items.length - 1) * PARA_GAP;
};
const dayRowW = (r) => DAY_PAD + Math.max(LINE_H, r.task.reduce((n, t) => n + paraLines(t) * LINE_H, 0) + (r.task.length - 1) * PARA_GAP);
const secWeight = (s, first) => {
  let w = first ? 0 : SEC_TOP;
  if (!s.cont) w += HEAD_H;
  w += bodyH(s);
  w += s.table ? TBL_TOP + TBL_HEAD + s.table.length * TBL_ROW : 0;
  w += s.day ? DAY_TOP + DAY_HEAD + s.day.reduce((n, r) => n + dayRowW(r), 0) : 0;
  w += s.fig ? FIG_H : 0;
  return w;
};
const BUDGET = 243;       // 续页：实测首节顶 33.3 → 页码线 276.5 = 243.2mm 可用内容区（footY−firstSecTop）
const BUDGET_FIRST = 124; // 首页：band 113.8 + 题 7.34 + 副题 7.1 + 发丝线 8.35 → 260.4 − 136.6 ≈ 124mm
const dayTable = (day) => `<table class="day-tbl">
      <tbody>
        <tr><td class="t-time">时间段</td><td class="t-task"><p>工作内容</p></td></tr>
        ${day.map(r => `<tr>
          <td class="t-time">${esc(r.time)}</td>
          <td class="t-task">${r.task.map(t => `<p>${esc(t)}</p>`).join('')}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
const subList = (s) => `<div class="js-body js-subs">
      ${s.body.map(pa => {
        const m = pa.match(/^([^：。，]{2,24})：([\s\S]*)$/);
        return `<div class="js-sub">
          <div class="js-sub-head"><span class="js-sub-dot"></span><span class="js-sub-title">${esc(m[1])}</span></div>
          <p class="js-sub-body">${esc(m[2].trim())}</p>
        </div>`;
      }).join('')}
    </div>`;
// 流式填满：小节在当前页放不下时，按段界/日程行界拆出一部分填满本页，
// 剩余部分续到下一页（cont 续接，不重复小节标题；day 表续页自动重复表头行）。
const paraItemW = (s, pa) => isSubList(s)
  ? SUB_H + SUB_BODY_TOP + paraLines(pa) * LINE_H + SUB_TOP
  : paraLines(pa) * LINE_H + PARA_GAP;
const splitToFit = (s, avail, first) => {
  const overhead = (first ? 0 : SEC_TOP) + (s.cont ? 0 : HEAD_H);
  if (s.day) {
    let room = avail - overhead - DAY_TOP - DAY_HEAD, k = 0;
    for (const r of s.day) { const w = dayRowW(r); if (room - w < 0) break; room -= w; k++; }
    if (k > 0 && k < s.day.length) return [
      Object.assign({}, s, { day: s.day.slice(0, k) }),
      Object.assign({}, s, { day: s.day.slice(k), body: undefined, cont: true })];
    return [null, s];
  }
  if (s.table || s.fig) {
    // 表格/插图原子化：整块放得下则整体拉回，放不下不拆
    if (secWeight(s, first) <= avail) return [s, null];
    return [null, s];
  }
  const body = s.body || [];
  let room = avail - overhead - BODY_TOP, k = 0;
  for (const pa of body) { const w = paraItemW(s, pa); if (room - w < 0) break; room -= w; k++; }
  if (k > 0 && k < body.length) return [
    Object.assign({}, s, { body: body.slice(0, k) }),
    Object.assign({}, s, { body: body.slice(k), cont: true })];
  return [null, s];
};
// 回拉：分页后逐页检查，若当前页还有 >14mm 空位而下一页首节可拆，把其首段/首行/首子标拉回本页，
// 消除「预算按节估算 → 页底大面积留白」的欠填充（day 表跨页自动重复表头，cont 不重复小节标题）。
const chunkSections = (secs) => {
  const chunks = [];
  let cur = [], load = 0;
  let budget = BUDGET_FIRST;
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; load = 0; budget = BUDGET; };
  for (const s of secs) {
    let rem = s, guard = 0;
    while (rem && guard++ < 40) {
      const first = cur.length === 0;
      if (load + secWeight(rem, first) <= budget) { cur.push(rem); load += secWeight(rem, first); break; }
      const [head, tail] = splitToFit(rem, budget - load, first);
      if (head) { cur.push(head); flush(); rem = tail; continue; }
      if (cur.length) { flush(); continue; }
      const [h2, t2] = splitToFit(rem, budget, true); // 单节超整页：按整页预算强制拆
      if (h2) { cur.push(h2); flush(); rem = t2; continue; }
      cur.push(rem); flush(); break; // 拆不动（单段即超页），独占一页
    }
  }
  if (cur.length) chunks.push(cur);
  // —— 回拉 pass：把下一页首个可拆节的头部内容拉回欠填充页 ——
  for (let i = 0; i < chunks.length - 1; i++) {
    const pageBudget = i === 0 ? BUDGET_FIRST : BUDGET;
    let guard = 0;
    while (guard++ < 40) {
      const used = chunks[i].reduce((n, x, j) => n + secWeight(x, j === 0), 0);
      if (pageBudget - used <= PULL_LEEWAY) break;
      const nextChunk = chunks[i + 1];
      if (!nextChunk || !nextChunk.length) break;
      const lead = nextChunk[0];
      if (lead.cont || !((lead.body || []).length || (lead.day || []).length)) break;
      const [head, tail] = splitToFit(lead, pageBudget - used, chunks[i].length === 0);
      if (!head) break;
      chunks[i].push(head);
      if (tail) nextChunk[0] = tail; else nextChunk.shift();
    }
  }
  if (process.env.DBG_JOB) {
    chunks.forEach((c, i) => {
      const pb = i === 0 ? BUDGET_FIRST : BUDGET;
      const u = c.reduce((n, x, j) => n + secWeight(x, j === 0), 0);
      const real = c.reduce((n, x) => n + (x.__realH || 0), 0);
      console.error(`[DBG] chunk${i} secs=${c.length} modelUsed=${u.toFixed(1)} budget=${pb} free=${(pb - u).toFixed(1)}`);
    });
  }
  return chunks.filter(c => c.length);
};
const jobDetailPages = (job, coverId) => {
  let secs = job.detail.sections.map(s => Object.assign({}, s));
  let chunks = chunkSections(secs);
  chunks.forEach((chunk, i) => {
    nextPage();
    const foot = pageFoot();
    const secHtml = chunk.map(s => {
      let fig = '';
      if (s.fig && s.fig.src) fig = `<figure class="js-fig"><img src="${s.fig.src}" alt="${esc(s.fig.alt)}" /><figcaption class="fig-note">${esc(s.fig.caption)}</figcaption></figure>`;
      let tbl = '';
      if (s.day) tbl = dayTable(s.day);
      else if (s.table) tbl = `<table class="tbl">
        <tr><th>职级</th><th>月薪范围</th><th>说明</th></tr>
        ${s.table.map(r => `<tr><td>${esc(r.level)}</td><td class="num">${esc(r.salary)}</td><td>${esc(r.note)}</td></tr>`).join('')}
      </table>`;
      // 色相随小节编号锁定（01/04/… accent，02/05/… accent-2，03/06/… accent 色相偏移）：
      // 跨页续段编号不变 → 整节（含小标题块、日程表单元格）颜色始终如一。
      const hueN = ((parseInt(s.no, 10) || 1) - 1) % 3;
      const hueCls = hueN === 1 ? ' js-c2' : hueN === 2 ? ' js-c3' : '';
      const head = s.cont ? '' : `<div class="js-head"><span class="js-nb">${esc(s.no)}</span><span class="js-title">${esc(s.title)}</span></div>`;
      const body = isSubList(s)
        ? subList(s)
        : (s.body && s.body.length) ? `<div class="js-body${s.cont ? ' js-cont' : ''}">${s.body.map(p).join('')}</div>` : '';
      return `<div class="job-sec${hueCls}">
        ${head}
        ${body}
        ${fig}
        ${tbl}
      </div>`;
    }).join('');
    if (i === 0) {
      // 首页（Figma 1315:2977）：band 满版顶图 + 「02.1 岗位名」16pt/700 + 副题 + 发丝线
      page(coverId, 'L11 band', `<div class="job-detail">
        ${img(job.cover.image, 'dp-hero-full', `${job.title}场景`)}
        <h2 class="jd-title">${esc(job.no)} ${esc(job.title)}</h2>
        <p class="jd-sub">${esc(job.subtitle)}</p>
        <div class="jd-rule"></div>
        ${secHtml}
      </div>
      ${foot}`, undefined, undefined, undefined, true);
    } else {
      page(`${coverId}-p${i + 1}`, 'L11', `<div class="job-detail">
        <div class="jd-run"><span class="jd-run-no">${esc(job.no)}</span><span class="jd-run-title">${esc(job.title)}</span></div>
        ${secHtml}
      </div>
      ${foot}`, undefined, undefined, undefined, true);
    }
  });
};

const jobs = data.part2.jobs || [];
// 无全局奇偶调平：页数完全由各岗位内容按 [6,14]mm 留白带撑出，不再强制总页数为偶。
jobs.forEach((job, i) => {
  jobDetailPages(job, `sp-job-${i + 1}`);
});

/* ---------- 组装 ---------- */
const template = readFileSync(join(ROOT, 'assets/template.html'), 'utf8');
const skeletonStart = template.indexOf('SLOT: 页面骨架占位');
const stageStart = template.lastIndexOf('<main class="stage">');
const stageEnd = template.indexOf('</main>');

if (skeletonStart < 0 || stageStart < 0 || stageEnd < 0) {
  console.error('模板缺少 SLOT: 页面骨架占位 或 <main class="stage"> 标记');
  process.exit(2);
}

flushPages();
const head = template.slice(0, stageStart) + '<main class="stage">\n\n' + sections.join('\n\n') + '\n\n  </main>';
const tail = template.slice(stageEnd + '</main>'.length);

// 替换主题 token（SLOT: theme tokens）
let finalHtml = head + tail;
for (const [k, v] of Object.entries(theme)) finalHtml = finalHtml.replace(new RegExp(`(--${k}:)\\s*#[0-9a-fA-F]{6}`), `$1 ${v}`);
// 替换标题
finalHtml = finalHtml.replace('<title>[必填] 替换为手册标题 · 职业发展手册</title>', `<title>${esc(data.meta.major)} · 职业发展手册</title>`);
// 目录页码自动回填：分页完成后按 data-pg 目标 id 回填实际页码（全量模式；样板保留 JSON 硬编码值）
if (!SAMPLE) {
  finalHtml = finalHtml.replace(/<span class="toc-pg" data-pg="([^"]+)"[^>]*>[\s\S]*?<\/span>/g, (m, target) => {
    const n = pageOf[target];
    return `<span class="toc-pg" data-pg="${target}">${n != null ? n : ''}</span>`;
  });
}
// 移除残留的 [必填]
finalHtml = finalHtml.replace(/\[必填[^\]]*\]/g, '');

writeFileSync(outPath, finalHtml, 'utf8');

// 字体本地化：生成物旁必须有 ./fonts/（@font-face 相对路径），保证打印内嵌（等同转曲）
const fontsSrc = join(SHARED, 'fonts');
const fontsDst = join(dirname(outPath), 'fonts');
cpSync(fontsSrc, fontsDst, { recursive: true });
// 占位校徽：build 自动同步 _shared/placeholders/ → 输出目录 images/（真实校徽替换后不受影响）
mkdirSync(join(dirname(outPath), 'images'), { recursive: true });
cpSync(join(SHARED, 'placeholders', 'logo-placeholder.svg'), join(dirname(outPath), 'images', 'logo-placeholder.svg'));
// 同步内容 JSON 目录下的 images/ 到输出目录（示例封面、2026 年份 SVG 等）
const contentImagesDir = join(dirname(jsonPath), 'images');
if (existsSync(contentImagesDir)) {
  cpSync(contentImagesDir, join(dirname(outPath), 'images'), { recursive: true, force: true });
}
console.log(`已生成: ${outPath}`);
console.log(`  字体已同步: ${fontsDst}`);
console.log(`  数据页底距报告（目标 6–14mm）:`);
const wsBad = wsReport.filter(r => r.ws < 6 || r.ws > 14);
for (const r of wsReport) console.log(`    p${r.page} ${r.id.padEnd(16)} 底距 ${r.ws}mm${r.ws < 6 || r.ws > 14 ? '  ⚠' : ''}`);
if (wsBad.length) {
  console.log(`  ⚠ ${wsBad.length} 个数据页底距超出 [12,20]mm，请人工复核（估算值，含模型误差）。`);
} else {
  console.log(`  ✓ 全部数据页底距估算 ∈ [12,20]mm`);
}
console.log(`  主题: ${themeName} | 模式: ${SAMPLE ? '样板(单页展示)' : '全量(对开拼版)'} | 页数(含页码): ${pfNum} | 对开: ${sections.length} | 岗位: ${jobs.length} 个`);
