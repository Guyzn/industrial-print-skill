#!/usr/bin/env node
/**
 * build-magazine.mjs · 模版 B（杂志编辑风）
 * 从内容 JSON 生成手册 HTML。物理规格与模版 A 同族（210×285 单页 / 432×291 对开画布）。
 *
 * 用法:
 *   node build-magazine.mjs <content.json> <输出.html> [--theme engineering-terra]
 *
 * 分页模型（版式锁，与 references/layouts.md 一一对应）:
 *   对开1  封底 M00 | 封面 M01（无页码）
 *   对开2  序 M02 | 序图 M03（M03 出血无 folio）
 *   对开3  目录 M04（页码自动回填）| 本期速览 M05
 *   对开4  PART 01 幕封 M06 | 章首引文 M07（.spread.navy）
 *   对开5+ PART 01 数据页两两配对：按 section.chart 选骨架
 *          donut→M08 / track→M09 / bignum→M10 / stack→M11 / colchart→M12 / pillars→M13
 *   对开n  PART 02 幕封 M06（inline 主色）| 岗位一览 M14（页码自动回填）
 *   每岗位 M15 岗位封面（出血无 folio）| M16 岗位开篇（IN THIS FILE 页码回填）
 *   每岗位 M17 岗位详情：十二段贪心打包（真实 mm 预算），奇数页补 closing 页
 *
 * 主题映射：accent ← 主题 --cov-ink（B 唯一换色入口）；--chart-2/3/4 固定图表辅色。
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
  console.error('用法: node build-magazine.mjs <content.json> <输出.html> [--theme <name>]');
  process.exit(2);
}

/* ---------- 主题色提取（_shared/themes.md，三模版共用） ---------- */
const SHARED = join(ROOT, '..', '..', '_shared');
const themesMd = readFileSync(join(SHARED, 'themes.md'), 'utf8');
const themeNames = [...themesMd.matchAll(/^## \d+\. \S+ [一-龥A-Za-z]+ ([A-Z][A-Za-z ]+)（.*$/gm)].map(m => m[1].trim());
const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
const themeTokenRe = /--([a-z0-9-]+):\s*(#[0-9a-f]{6})/g;
const themes = {};
[...themesMd.matchAll(/```css\n([\s\S]*?)\n```/g)].forEach((blk, i) => {
  const t = {};
  for (const m of blk[1].matchAll(themeTokenRe)) t[m[1]] = m[2];
  themes[slug(themeNames[i])] = t;
});

const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
let themeName = data.meta.theme || 'engineering-terra';
if (themeFlag) {
  const t = themeFlag.replace('--theme', '').replace(/^[=:\s]+/, '').trim();
  if (t) themeName = t;
}
const theme = themes[themeName];
if (!theme) {
  console.error(`未知主题: ${themeName}（可选: ${Object.keys(themes).join(', ')}）`);
  process.exit(2);
}
const accent = theme['cov-ink'] || theme.accent;
if (!accent) {
  console.error(`主题 ${themeName} 缺少 --cov-ink token（B 的 accent 映射源）`);
  process.exit(2);
}

/* ---------- 工具 ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad2 = (n) => String(n).padStart(2, '0');
const lines = (t, cpl = 54) => Math.max(1, Math.ceil(String(t || '').length / cpl));

/* ---------- 真实 mm 分页常量（定稿原型校准） ---------- */
const PAGE_CONTENT = 252;      // 291 - ink-top 13 - ink-bottom 26（folio 留白已含在 ink-bottom 内）
const COL_TITLE = 13;          // 栏目标题带（含 7mm 下间距）
const BUDGET = PAGE_CONTENT - COL_TITLE;   // = 239
const SAFE = 6;                // 接纳余量：fill ≤ BUDGET - SAFE 才收入下一节
const SEC_GAP = 12, SEC_GAP_ROOMY = 17, SEC_GAP_TIGHT = 9;
const SEC_HEAD = 11;           // sec-head（含 4.5mm 下间距）
const LINE_LEDE = 6.9, LINE_P = 7.05;      // 10pt×1.95 / 10pt×2.0
const DAY_ROW = 13.2;          // 时段色块行（含 1.5mm 行距）
const DUTY_ITEM = 24, DUTY_RGAP = 5;       // 职责格（2 列）
const MOD = 27, MOD_RGAP = 6.5;            // mod 格（2 列 / 3 列同高近似）
const PATH_H = 62;             // 路径图（SVG + 四栏说明）
const ADV_H = 33;              // 优势色带
const SALARY_H = 25;           // 薪酬大数字条（不含总述段）
const NEXTISSUE_H = 20;        // 下期预告块

const folioHtml = (run, num, onDark) =>
  `<div class="folio${onDark ? ' on-dark' : ''}"><span class="fl-run">${esc(run)}</span><span class="fl-num">${pad2(num)}</span></div>`;

/* ================================================================
   第一遍：岗位十二段打包（需要页码前先知道每段落在哪页）
   ================================================================ */

/* 每段的估算高度（mm）与渲染器；渲染器在第二遍拿到页码后执行 */
function jobSectionDescriptors(job) {
  const J = job.sections || {};
  const S = [];
  const head = (no, title) => `<div class="sec-head"><span class="sec-no">${no}</span><span class="sec-title">${esc(title)}</span></div>`;
  const withQuotes = (arr) => {
    const out = [];
    for (const d of arr) {
      out.push(d);
      const q = job.pullQuotes && job.pullQuotes[d.no];
      if (q) out.push({
        no: d.no + '-quote', h: 18,
        html: () => `<div class="pullquote"><div class="pq-cn" style="font-size: 14pt;">${esc(q.text)}</div><div class="pq-by">— ${esc(q.by || '岗位档案')}</div></div>`,
      });
    }
    return out;
  };

  if (J.overview) S.push({
    no: '01', title: '岗位综述', h: SEC_HEAD + lines(J.overview) * LINE_LEDE,
    html: () => head('01', '岗位综述') + `<p class="lede">${esc(J.overview)}</p>`,
  });
  if (Array.isArray(J.day) && J.day.length) S.push({
    no: '02', title: `${job.shortName}的一天`, h: SEC_HEAD + J.day.length * DAY_ROW,
    html: () => head('02', `${job.shortName}的一天`) + `<div class="day">` + J.day.map(r =>
      `<div class="day-row"><div class="day-t">${esc(r.t)}</div><div class="day-b">${esc(r.b)}</div></div>`).join('') + `</div>`,
  });
  if (Array.isArray(J.duties) && J.duties.length) {
    const rows = Math.ceil(J.duties.length / 2);
    S.push({
      no: '03', title: '工作职责', type: 'duty', items: J.duties,
      h: SEC_HEAD + rows * DUTY_ITEM + (rows - 1) * DUTY_RGAP,
      splitAfter: (job.layout && job.layout.dutySplit) || 0,
    });
  }
  if (J.outlook) S.push({
    no: '04', title: '行业前景', h: SEC_HEAD + lines(J.outlook) * LINE_LEDE,
    html: () => head('04', '行业前景') + `<p class="lede">${esc(J.outlook)}</p>`,
  });
  if (Array.isArray(J.life) && J.life.length) S.push({
    no: '05', title: `${job.shortName}的生活`, h: SEC_HEAD + Math.ceil(J.life.length / 2) * MOD + (Math.ceil(J.life.length / 2) - 1) * MOD_RGAP,
    html: () => head('05', `${job.shortName}的生活`) + `<div class="mod-grid">` + J.life.map(m =>
      `<div class="mod"><div class="mod-h"><span class="mh-name">${esc(m.name)}</span><span class="mh-stat">${esc(m.stat || '')}</span></div><p>${esc(m.text)}</p></div>`).join('') + `</div>`,
  });
  if (J.salary) {
    const sal = J.salary;
    S.push({
      no: '06', title: '薪酬待遇', h: SEC_HEAD + lines(sal.text) * LINE_P + 4 + SALARY_H,
      html: () => head('06', '薪酬待遇') + `<p>${esc(sal.text)}</p>
        <div class="chart-unit" style="display: flex; gap: 14mm; margin-top: 4mm; border-top: 2px solid var(--fg); padding-top: 4mm;">
          ${(sal.nums || []).map((nm, i) => `<div>
            <div style="font-family: var(--disp); font-weight: 900; font-size: 30pt; color: ${i === 0 ? 'var(--accent)' : 'var(--chart-3)'}; line-height: 1.05;">${esc(nm.v)}</div>
            <div style="font-size: 8.5pt; margin-top: 1.5mm;">${esc(nm.k)}</div>
          </div>`).join('')}
          <div class="note" style="align-self: end; flex: 1;">注：${esc(sal.note || '')}</div>
        </div>`,
    });
  }
  if (J.path && Array.isArray(J.path.stages)) {
    const st = J.path.stages;           // 固定 4 阶段；坐标系锁定（见 layouts.md M17）
    const X = [60, 246, 432, 618], Y = [108, 84, 56, 24], TY = [128, 104, 76, 52], NY = [94, 70, 42, 29], NX = [60, 246, 432, 640];
    S.push({
      no: '07', title: '职业发展路径', h: SEC_HEAD + PATH_H,
      html: () => head('07', '职业发展路径') + `<div class="pathmap">
        <svg viewBox="0 0 744 132" role="img" aria-label="${esc(J.path.aria || '职业发展路径图')}">
          <path d="M ${X[0]} ${Y[0]} L ${X[1]} ${Y[1]} L ${X[2]} ${Y[2]} L ${X[3]} ${Y[3]}" fill="none" style="stroke: var(--accent);" stroke-width="2.5"/>
          ${st.map((s, i) => i === 3
            ? `<circle cx="${X[i]}" cy="${Y[i]}" r="8" style="fill: var(--chart-3);"/><circle cx="${X[i]}" cy="${Y[i]}" r="13" fill="none" style="stroke: var(--chart-3);" stroke-width="1"/>`
            : `<circle cx="${X[i]}" cy="${Y[i]}" r="6.5" style="fill: var(--accent);"/>`).join('')}
          ${st.map((s, i) => `<text x="${X[i]}" y="${TY[i]}" style="font-family: var(--mono); fill: var(--muted);" font-size="11" letter-spacing="1">${esc(s.years)}</text>`).join('')}
          ${st.map((s, i) => `<text x="${NX[i]}" y="${NY[i]}" style="font-family: var(--disp); font-weight: 700; fill: ${i === 3 ? 'var(--chart-3)' : 'var(--fg)'};" font-size="16">${esc(s.name)}</text>`).join('')}
        </svg>
        <div class="path-cols">${st.map(s => `<p>${esc(s.desc)}</p>`).join('')}</div>
      </div>`,
    });
  }
  if (Array.isArray(J.threshold) && J.threshold.length) S.push({
    no: '08', title: '准入门槛', h: SEC_HEAD + MOD,
    html: () => head('08', '准入门槛') + `<div class="mod-grid">` + J.threshold.map(m =>
      `<div class="mod"><div class="mod-h"><span class="mh-name">${esc(m.name)}</span><span class="mh-stat">${esc(m.stat || '')}</span></div><p>${esc(m.text)}</p></div>`).join('') + `</div>`,
  });
  if (Array.isArray(J.advantages) && J.advantages.length) {
    const intro = J.advIntro || '';
    S.push({
      no: '09', title: '专业优势', h: SEC_HEAD + (intro ? lines(intro) * LINE_P + 4 : 0) + ADV_H,
      html: () => head('09', '专业优势') + (intro ? `<p style="margin-bottom: 4mm;">${esc(intro)}</p>` : '') +
        `<div class="adv-band">` + J.advantages.map((a, i) =>
          `<div class="adv-cell"><div class="adv-no">ADV. ${pad2(i + 1)}</div><div class="adv-t">${esc(a.t)}</div><p>${esc(a.text)}</p></div>`).join('') + `</div>`,
    });
  }
  if (Array.isArray(J.traits) && J.traits.length) S.push({
    no: '10', title: '什么样的人更适合', h: SEC_HEAD + Math.ceil(J.traits.length / 3) * 21 + (Math.ceil(J.traits.length / 3) - 1) * 5,
    html: () => head('10', '什么样的人更适合') + `<div class="trait">` + J.traits.map(t =>
      `<div class="trait-cell"><div class="trait-t">${esc(t.t)}</div><p>${esc(t.text)}</p></div>`).join('') + `</div>`,
  });
  if (Array.isArray(J.channels) && J.channels.length) S.push({
    no: '11', title: '了解行业及岗位', h: SEC_HEAD + MOD,
    html: () => head('11', '了解行业及岗位') + `<div class="mod-grid cols-3">` + J.channels.map(m =>
      `<div class="mod"><div class="mod-h"><span class="mh-name">${esc(m.name)}</span></div><p>${esc(m.text)}</p></div>`).join('') + `</div>`,
  });
  if (J.plan) S.push({
    no: '12', title: '学习规划建议', h: SEC_HEAD + lines(J.plan) * LINE_LEDE,
    html: () => head('12', '学习规划建议') + `<p class="lede">${esc(J.plan)}</p>`,
  });
  return withQuotes(S);
}

const dutyGridHtml = (items, startIdx) =>
  `<div class="duty">` + items.map((d, i) =>
    `<div class="duty-item"><div class="duty-no">${pad2(startIdx + i + 1)}</div><div class="duty-t">${esc(d.t)}</div><p>${esc(d.text)}</p></div>`).join('') + `</div>`;

/* 贪心打包：返回 { jPages, secPage, nextIssueOnLast } */
function packJob(job) {
  const descs = jobSectionDescriptors(job);
  const breaks = new Set((job.layout && job.layout.breakBefore) || []);
  const jPages = [[]];
  const secPage = {};
  let fill = 0;
  const cur = () => jPages[jPages.length - 1];
  const gap = () => (cur().length ? SEC_GAP : 0);
  const newPage = () => { jPages.push([]); fill = 0; };
  const dutyHead = () => `<div class="sec-head"><span class="sec-no">03</span><span class="sec-title">工作职责</span></div>`;

  for (const d of descs) {
    if (breaks.has(d.no) && cur().length) newPage();

    if (d.type === 'duty') {
      const items = d.items;
      const splitAt = d.splitAfter && d.splitAfter % 2 === 0 && d.splitAfter < items.length ? d.splitAfter : 0;
      if (splitAt) {
        secPage[d.no] = jPages.length - 1;
        const a = items.slice(0, splitAt), b = items.slice(splitAt);
        const ha = SEC_HEAD + Math.ceil(a.length / 2) * DUTY_ITEM + (Math.ceil(a.length / 2) - 1) * DUTY_RGAP;
        let g = gap();
        if (fill + g + ha > BUDGET - SAFE && cur().length) { newPage(); g = 0; }
        cur().push({ h: ha, no: d.no, html: () => dutyHead() + dutyGridHtml(a, 0) });
        fill += g + ha;
        newPage();
        const hb = Math.ceil(b.length / 2) * DUTY_ITEM + (Math.ceil(b.length / 2) - 1) * DUTY_RGAP;
        cur().push({ h: hb, no: d.no + '-cont', html: () => dutyGridHtml(b, splitAt) });
        fill += hb;
      } else {
        let g = gap();
        if (fill + g + d.h > BUDGET - SAFE && cur().length) { newPage(); g = 0; }
        secPage[d.no] = jPages.length - 1;
        cur().push({ h: d.h, no: d.no, html: () => dutyHead() + dutyGridHtml(items, 0) });
        fill += g + d.h;
      }
      continue;
    }

    let g = gap();
    if (fill + g + d.h > BUDGET - SAFE && cur().length) { newPage(); g = 0; }
    if (!(d.no in secPage)) secPage[d.no] = jPages.length - 1;
    cur().push(d);
    fill += g + d.h;
  }

  /* 节奏类：内容少 → sec-roomy；临界 → sec-tight */
  jPages.forEach((pg) => {
    const f = pg.reduce((a, b) => a + b.h, 0) + (pg.length - 1) * SEC_GAP;
    const g = Math.max(0, pg.length - 1);
    if (f + g * (SEC_GAP_ROOMY - SEC_GAP) <= 200) pg.spacing = 'sec-roomy';
    else if (f >= 218) pg.spacing = 'sec-tight';
    else pg.spacing = '';
  });

  /* 下期预告：pin-bottom 浮在页底，按该页实际节奏类换算间距后再判定 */
  let nextIssueOnLast = false;
  if (job.nextIssue) {
    const pg = jPages[jPages.length - 1];
    const g = pg.spacing === 'sec-roomy' ? SEC_GAP_ROOMY : pg.spacing === 'sec-tight' ? SEC_GAP_TIGHT : SEC_GAP;
    const f = pg.reduce((a, b) => a + b.h, 0) + Math.max(0, pg.length - 1) * g;
    if (f + (pg.length ? g : 0) + NEXTISSUE_H <= BUDGET) {
      pg.push({
        h: NEXTISSUE_H, pin: true, no: 'next',
        html: () => `<div class="pin-bottom" style="border-top: 2px solid var(--fg); padding-top: 3mm;">
        <div style="font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.14em; color: var(--muted);">NEXT ISSUE · 下期预告</div>
        <p style="font-size: 9pt; line-height: 1.8; margin-top: 2mm;">${esc(job.nextIssue)}</p>
      </div>`,
      });
      nextIssueOnLast = true;
    } else if (jPages.length % 2 === 0) {
      console.warn(`⚠ ${job.name.join('')}：下期预告放不进末页且无 closing 页（详情页数为偶数），已跳过`);
    }
  }

  return { jPages, secPage, nextIssueOnLast };
}

/* ================================================================
   第二遍：按阅读顺序铺页面（页码在此确定）
   ================================================================ */
const meta = data.meta;
const runMain = `${meta.handbook || '职业发展手册'} · ${meta.year}`;
const jobs = (data.part2 && data.part2.jobs) || [];
const jobPacks = jobs.map(packJob);
if (process.env.DEBUG_PACK) jobPacks.forEach((p, i) => {
  console.error(`[pack] job ${i}: ${p.jPages.length} 页, nextIssueOnLast=${p.nextIssueOnLast}`);
  p.jPages.forEach((pg, k) => console.error(`  p${k}: [${pg.map(it => it.no + ':' + it.h.toFixed(1)).join(' ')}] spacing=${pg.spacing}`));
});

const P1_SECS = (data.part1 && data.part1.sections) || [];
const dataPagesOdd = P1_SECS.length % 2 === 1;
let n = 1;                                   // 封面两页 = 0, 1
const pgPreface = ++n;                       // 02
n += 1;                                      // 03 序图
const pgToc = ++n;                           // 04
n += 1;                                      // 05 速览
const pgDv1 = ++n;                           // 06
n += 1;                                      // 07 章首引文
const pgData0 = n + 1;                       // 08
n += P1_SECS.length + (dataPagesOdd ? 1 : 0);
const pgDv2 = ++n, pgJobIndex = ++n;
const jobInfo = jobs.map((job, i) => {
  const cover = ++n, intro = ++n;
  const detail0 = n + 1;
  n += jobPacks[i].jPages.length;
  const secAbs = {};
  for (const [no, pi] of Object.entries(jobPacks[i].secPage)) secAbs[no] = detail0 + pi;
  const odd = jobPacks[i].jPages.length % 2 === 1;
  if (odd) n += 1;                           // closing 页
  return { job, cover, intro, secAbs, detail0, odd };
});
const totalPages = n + 1;

/* ---------- 组件渲染 ---------- */
const colTitle = (name, idx) =>
  `<div class="col-title">${idx ? `<span class="ct-idx">${esc(idx)}</span>` : ''}<span class="ct-name">${esc(name)}</span></div>`;

/* M00 封底 */
const renderM00 = () => {
  const c = data.cover;
  return `<div class="cov-meta" style="position: absolute; left: var(--ink-outer); top: var(--ink-top);">${esc(c.mastheadEn || 'CAREER HANDBOOK')} · VOL. ${esc(meta.year)}</div>
    <div style="position: absolute; left: var(--ink-outer); right: var(--ink-fold); bottom: 24mm; font-family: 'Alibaba PuHuiTi 3', var(--font); font-weight: 400; font-size: 9pt; line-height: 2.0; color: #ffffff;">
      ${(c.credits || []).map(esc).join('<br />\n      ')}
    </div>
    <hr class="cov-rule" style="position: absolute; left: var(--ink-outer); right: var(--ink-fold); bottom: 15mm;" />`;
};

/* M01 封面 */
const renderM01 = () => {
  const c = data.cover;
  return `${c.logo ? `<img src="${esc(c.logo)}" alt="${esc(meta.school || '')}" style="position: absolute; left: var(--ink-fold); top: var(--ink-top); height: 8.5mm; width: auto;" />` : ''}
    <div class="cov-meta" style="position: absolute; right: var(--ink-outer); top: var(--ink-top);">VOL. ${esc(meta.year)}</div>
    <div style="position: absolute; left: var(--ink-fold); top: 58mm;">
      <div class="cov-kicker">${esc(c.kicker || 'CAREER · HANDBOOK')}</div>
      <h1 class="cov-title" style="margin-top: 7mm;">${(c.title || []).map(esc).join('<br />')}</h1>
      ${c.yearSvg ? `<img class="cov-year-svg" src="${esc(c.yearSvg)}" alt="${esc(meta.year)}" style="margin-top: 6mm;" />` : `<div class="cov-year" style="margin-top: 6mm;">${esc(meta.year)}</div>`}
    </div>
    <div style="position: absolute; left: var(--ink-fold); top: 152mm; display: flex; gap: 7mm; align-items: stretch;">
      <div style="width: 1px; background: #ffffff;"></div>
      <div style="display: flex; flex-direction: column; justify-content: center; gap: 5mm; padding: 1mm 0;">
        <div class="cov-sub">${esc(c.sub || '')}</div>
        <div class="cov-stats">${(c.stats || []).map((s, i) => `${i ? '<span class="sep"></span>' : ''}<span>${esc(s)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="cov-meta" style="position: absolute; left: var(--ink-fold); bottom: 18mm;">${esc(c.footerLine || '')}</div>
    ${c.deco ? `<div class="cov-deco"><img src="${esc(c.deco)}" alt="" /></div>` : ''}`;
};

/* M02 序 */
const renderM02 = () => {
  const f = data.preface;
  return `${colTitle('PREFACE · 序', 'P')}
    <h2 class="disp lg">${(f.title || []).map(esc).join('<br />')}</h2>
    <div class="pullquote tint" style="margin: 7mm 0 8mm;">
      <div class="pq-cn" style="white-space: nowrap;">${esc(f.quote)}</div>
      <div class="pq-by">${esc(f.quoteBy || "EDITOR'S NOTE · 编者手记")}</div>
    </div>
    <div class="body-col dropcap">${(f.paras || []).map(t => `<p>${esc(t)}</p>`).join('')}</div>
    <div style="text-align: right; margin-top: 6mm;">
      <div style="font-family: var(--disp); font-weight: 700; font-size: 11pt;">${esc(f.sign || '')}</div>
      <div style="font-family: var(--mono); font-size: 8pt; letter-spacing: 0.12em; color: var(--muted); margin-top: 1.5mm;">${esc(f.date || '')}</div>
    </div>
    ${folioHtml(runMain, pgPreface)}`;
};

/* M03 序图（出血，无 folio） */
const renderM03 = () => {
  const f = data.preface;
  return `<div class="bleed-img"><img src="${esc(f.image)}" alt="${esc(f.imageCaption || '')}（示意图）" style="object-position: ${esc(f.imagePosition || 'center 40%')};" /></div>
    <div class="caption-chip fold">IMAGE · ${esc(f.imageCaption || '')}（示意图）</div>`;
};

/* M04 目录（页码回填） */
const renderM04 = () => {
  const t = data.toc || {};
  const row = (no, title, desc, pg) =>
    `<div class="toc-row"><span class="tr-no">${no}</span><div class="tr-main"><div class="tr-t">${esc(title)}</div><div class="tr-d">${esc(desc || '')}</div></div><span class="tr-pg">${pad2(pg)}</span></div>`;
  let i = 0;
  const p1rows = P1_SECS.map((s, k) => row(pad2(++i), s.tocTitle || s.title, s.tocDesc || '', pgData0 + k)).join('');
  const idxTitle = (data.part2.index && data.part2.index.title) || '主要就业岗位一览';
  const p2rows = [row(pad2(++i), idxTitle, (data.part2.index && data.part2.index.tocDesc) || '', pgJobIndex)]
    .concat(jobInfo.map(({ job, cover }) => row(pad2(++i), job.name.join(''), job.tocDesc || '岗位详解 · 十二段式职业导引', cover))).join('');
  return `<div class="kicker">CONTENTS · 本期导览</div>
    <h2 class="disp lg" style="margin-top: 3mm;">目录</h2>
    <hr class="ruled" style="margin: 5mm 0 2mm;" />
    <div class="toc compact">
      <div class="toc-part">PART 01 · ${esc((data.part1 && data.part1.tocLabel) || '第一部分')}</div>
      ${p1rows}
      <div class="toc-part">PART 02 · ${esc((data.part2 && data.part2.tocLabel) || '第二部分')}</div>
      ${p2rows}
    </div>
    ${t.quote ? `<div class="pullquote" style="margin-top: 7mm;">
      <div class="pq-cn" style="font-size: 13.5pt;">${esc(t.quote)}</div>
      <div class="pq-by">— ${esc(t.quoteBy || '本手册使用方法')}</div>
    </div>` : ''}
    ${folioHtml(runMain, pgToc)}`;
};

/* M05 本期速览 */
const renderM05 = () => {
  const g = data.glance;
  return `<div class="kicker">AT A GLANCE · 本期速览</div>
    <h2 class="disp md" style="margin-top: 3mm;">${esc(g.title)}</h2>
    <hr class="ruled" style="margin: 5mm 0;" />
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm;">
      ${(g.nums || []).map(bn => `<div class="bignum"><div class="bn-v">${esc(bn.v)}${bn.unit ? `<small>${esc(bn.unit)}</small>` : ''}</div><div class="bn-k">${esc(bn.k)}</div></div>`).join('')}
    </div>
    ${g.image ? `<div class="bleed-img rel" style="height: 120mm; margin: 8mm 0 0;">
      <img src="${esc(g.image)}" alt="${esc(g.imageCaption || '')}（示意图）" />
    </div>
    <div style="font-family: var(--mono); font-size: 7pt; letter-spacing: 0.12em; color: var(--muted); margin-top: 1.5mm;">IMAGE · ${esc(g.imageCaption || '')}（示意图）</div>` : ''}
    ${g.quote ? `<div class="pullquote" style="margin-top: 6mm;">
      <div class="pq-cn">${esc(g.quote)}</div>
      <div class="pq-by">— ${esc(g.quoteBy || '编者手记')}</div>
    </div>` : ''}
    ${folioHtml('本期速览 · AT A GLANCE', pgToc + 1)}`;
};

/* M06 幕封 / M07 章首引文 */
const renderM06 = (d, num, pgNo) => `${d.image ? `<div class="bleed-img"><img src="${esc(d.image)}" alt="" style="opacity: 0.14; object-position: center;" /></div>\n    ` : ''}<div style="position: relative; height: 100%; display: flex; flex-direction: column;">
      <div class="dv-num">${esc(d.num)}</div>
      <div style="margin-top: auto;">
        <div class="dv-kicker">${esc(d.kicker)}</div>
        <div class="dv-title" style="margin-top: 5mm;">${(d.title || []).map(esc).join('<br />')}</div>
        <div class="dv-sub" style="margin-top: 6mm; max-width: 120mm;">${esc(d.sub || '')}</div>
        <div class="kv-rule" style="margin-top: 8mm;"></div>
      </div>
    </div>
    ${folioHtml(d.run, pgNo, true)}`;

const renderM07 = (d, pgNo) => `<div style="margin-top: 34mm;">
      <div class="pullquote" style="border-color: rgba(255,255,255,0.7);">
        <div class="pq-cn" style="color: #ffffff; font-size: 21pt; line-height: 1.5;">${(d.quote || []).map(esc).join('<br />')}</div>
        <div class="pq-by" style="color: rgba(255,255,255,0.65);">— 导语 · ${esc(d.run.replace(/^PART \d+ · /, ''))}</div>
      </div>
      <p style="color: rgba(255,255,255,0.85); font-size: 9.5pt; line-height: 1.85; margin-top: 9mm; max-width: 130mm; text-align: justify;">${esc(d.lead || '')}</p>
    </div>
    ${folioHtml(d.run, pgNo, true)}`;

/* ---------- M08–M13 数据页（按 section.chart 选骨架） ---------- */
const SERIES = ['var(--accent)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)'];
const DONUT_SERIES = ['var(--accent)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-2)'];
const T_CLASS = ['', 't3', 't2', 't4'];
const p1Run = `PART 01 · ${(data.part1 && data.part1.runLabel) || '数据篇'}`;

const modsHtml = (mods, useT) => `<div class="mod-grid" style="margin-top: 7mm;">` + (mods || []).map(m =>
  `<div class="mod"><div class="mod-h"><span class="${useT ? 'mh-t' : 'mh-name'}">${esc(m.t || m.name)}</span>${m.stat ? `<span class="mh-stat">${esc(m.stat)}</span>` : ''}</div><p>${esc(m.text)}</p></div>`).join('') + `</div>`;

const bottomQuote = (q, asBlockquote) => {
  if (!q) return '';
  if (asBlockquote) return `<blockquote class="pullquote pin-bottom"><p>${esc(q.text)}</p></blockquote>`;
  return `<div class="pullquote pin-bottom"><div class="pq-cn" style="font-size: 13pt;">${esc(q.text)}</div>${q.by ? `<div class="pq-by">— ${esc(q.by)}</div>` : ''}</div>`;
};

const donutSvg = (dn) => {
  let acc = 0;
  const rings = dn.segs.map((s, i) => {
    const shown = s.pct > 0 && s.pct < 3 ? 2.3 : s.pct;
    const off = 25 - acc;
    acc += s.pct;
    return `<circle cx="21" cy="21" r="15.9155" fill="none" style="stroke: ${DONUT_SERIES[i % 4]};" stroke-width="5" stroke-dasharray="${shown} ${100 - shown}" stroke-dashoffset="${off}" />`;
  }).join('\n        ');
  return `<svg class="donut-svg" viewBox="0 0 42 42" role="img" aria-label="${esc(dn.aria || '圆环图')}">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#ece8df" stroke-width="5" />
        ${rings}
        <text x="21" y="20" text-anchor="middle" style="font-family: var(--disp); font-weight: 900; font-size: 6.2px; fill: var(--accent);">${esc(dn.center || '')}</text>
        <text x="21" y="25.5" text-anchor="middle" style="font-family: var(--mono); font-size: 2.1px; letter-spacing: 0.04em; fill: var(--muted);">${esc(dn.centerNote || '')}</text>
      </svg>
      <div class="donut-legend">
        ${dn.segs.map((s, i) => `<div class="dl-row"><span class="dl-dot" style="background: ${DONUT_SERIES[i % 4]};"></span><span class="dl-label">${esc(s.label)}</span><span class="dl-val">${esc(s.val)}</span></div>`).join('\n        ')}
      </div>`;
};

const chartHtml = (sec) => {
  const c = sec.chart;
  if (c === 'track') return `<div class="chart-unit" style="margin-top: 10mm;">
    <div class="track">
      ${sec.tracks.map((t, i) => `<div class="track-row"><div class="tr-head"><span class="tr-label">${esc(t.label)}</span><span class="tr-val">${esc(t.val)}</span></div><div class="track-bar"><div class="tb-fill${T_CLASS[i % 4] ? ' ' + T_CLASS[i % 4] : ''}" style="--v: ${t.pct}%;"></div></div></div>`).join('\n      ')}
    </div>
    <div class="note" style="margin-top: 3mm;">${esc(sec.note)}</div>
  </div>`;
  if (c === 'bignum') return `<div class="chart-unit" style="margin-top: 9mm;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 9mm;">
      ${sec.nums.map(bn => `<div class="bignum"><div class="bn-v" style="font-size: 34pt;">${esc(bn.v)}${bn.unit ? `<small>${esc(bn.unit)}</small>` : ''}</div><div class="bn-k">${esc(bn.k)}</div></div>`).join('\n      ')}
    </div>
    <div class="note" style="margin-top: 2.5mm;">${esc(sec.note)}</div>
  </div>`;
  if (c === 'stack') return `<div class="chart-unit" style="margin-top: 10mm;">
    <div class="stack-bar" aria-label="${esc(sec.aria || '堆叠图')}">
      ${sec.segs.map(sg => {
        if (sg.kind === 'other') return `<div class="sb-seg" style="--w: ${sg.w}%; background: var(--surface); border: 0.5pt solid var(--border); border-left: none;">${sg.label ? `<span class="sb-in" style="color: var(--muted);">${esc(sg.label)}</span>` : ''}</div>`;
        return `<div class="sb-seg" style="--w: ${sg.w}%; background: ${sg.kind === 't3' ? 'var(--chart-3)' : 'var(--accent)'};">${sg.label ? `<span class="sb-in">${esc(sg.label)}</span>` : ''}</div>`;
      }).join('\n      ')}
    </div>
    <div class="note mt">${esc(sec.note)}</div>
  </div>`;
  if (c === 'colchart') return `<div class="chart-unit" style="margin-top: 8mm;">
    <div class="col-chart">
      ${sec.cols.map(col => `<div class="ccol"><span class="v">${col.peak ? `<strong>${esc(col.v)}</strong>` : esc(col.v)}</span><div class="bar" style="height: ${col.pct}%;${col.peak ? '' : ` background: ${SERIES[col.ci]};`}"></div></div>`).join('\n      ')}
    </div>
    <div class="ccol-labels">
      ${sec.cols.map(col => `<span>${esc(col.label)}<em>${esc(col.sub || '')}</em></span>`).join('\n      ')}
    </div>
    <div class="note" style="margin-top: 3mm;">${esc(sec.note)}</div>
  </div>`;
  if (c === 'pillars') return `<div class="chart-unit" style="margin-top: 8mm;">
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm;">
      ${sec.pillars.map((p, i) => `<div class="pcol pcol-${i + 1}">
        <div class="pcol-idx">PILLAR ${pad2(i + 1)} · ${esc(p.idx)}</div>
        <div class="pcol-t">${esc(p.title)}</div>
        <div class="pcol-d">${esc(p.desc)}</div>
        <div class="pcol-tags">${(p.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      </div>`).join('\n      ')}
    </div>
    <div class="note" style="margin-top: 2.5mm;">${esc(sec.note)}</div>
  </div>`;
  return '';
};

const LAYOUT_OF = { donut: 'M08', track: 'M09', bignum: 'M10', stack: 'M11', colchart: 'M12', pillars: 'M13' };

const renderDataPage = (sec, i, pgNo) => {
  const side = pgNo % 2 === 0 ? 'left' : 'right';
  const layout = LAYOUT_OF[sec.chart];
  const desk = colTitle(`数据版 · DATA DESK · ${(data.part1 && data.part1.deskLabel) || 'PART 01 ' + ((data.part1 && data.part1.runLabel) || '')}`);
  const kicker = `<div class="kicker" style="margin-bottom: 4mm;">${pad2(i + 1)} · ${esc(sec.tocTitle || (sec.title || []).join(''))}</div>`;
  const title = `<h3 class="disp md">${(sec.title || []).map(esc).join('<br />')}</h3>`;
  const lede = sec.lede ? `<p style="font-size: 9.5pt; line-height: 1.85; margin-top: ${sec.chart === 'colchart' ? 7 : 8}mm; text-align: justify;">${esc(sec.lede)}</p>` : '';
  let inner;
  if (sec.chart === 'donut') {
    inner = `${desk}
  ${kicker}
  <div class="bignum"><div class="bn-v">${esc(sec.bignum.v)}${sec.bignum.unit ? `<small> ${esc(sec.bignum.unit)}</small>` : ''}</div><div class="bn-k">${esc(sec.bignum.k)}</div></div>
  ${lede.replace('margin-top: 8mm', 'margin-top: 9mm')}
  <div class="donut-row" style="margin-top: 10mm;">
    <div class="donut-side">${donutSvg(sec.donut)}</div>
    <div style="flex: 1;">${(sec.mods || []).map(m =>
      `<div class="mod"><div class="mod-h"><span class="mh-name">${esc(m.t || m.name)}</span>${m.stat ? `<span class="mh-stat">${esc(m.stat)}</span>` : ''}</div><p>${esc(m.text)}</p></div>`).join('\n      ')}</div>
  </div>
  ${sec.table ? `<table class="xtable" style="margin-top: 10mm;">
    <tr>${sec.table.head.map((h, k) => `<th${k ? ' class="num"' : ''}>${esc(h)}</th>`).join('')}</tr>
    ${sec.table.rows.map(r => `<tr>${r.map((td, k) => `<td${k ? ' class="num"' : ''}>${esc(td)}</td>`).join('')}</tr>`).join('\n    ')}
    ${sec.table.total ? `<tr class="tot">${sec.table.total.map((td, k) => `<td${k ? ' class="num"' : ''}>${esc(td)}</td>`).join('')}</tr>` : ''}
  </table>` : ''}
  <div class="note pin-bottom">${esc(sec.note)}</div>`;
  } else if (sec.chart === 'colchart') {
    inner = `${desk}
  ${kicker}${title}${lede}${chartHtml(sec)}
  ${sec.mods ? `<div class="mod-grid cols-3" style="margin-top: 8mm;">${sec.mods.map(m =>
    `<div class="mod"><div class="mod-h"><span class="mh-name">${esc(m.t || m.name)}</span>${m.stat ? `<span class="mh-stat">${esc(m.stat)}</span>` : ''}</div><p>${esc(m.text)}</p></div>`).join('\n    ')}</div>` : ''}
  ${bottomQuote(sec.quote, true)}`;
  } else {
    const useT = sec.chart === 'stack' || sec.chart === 'pillars';
    inner = `${desk}
  ${kicker}${title}
  ${sec.chart === 'pillars' && sec.lede ? `<p style="font-size: 9.5pt; line-height: 1.9; margin-top: 4mm; text-align: justify;">${esc(sec.lede)}</p>` : ''}
  ${chartHtml(sec)}
  ${sec.chart !== 'pillars' ? lede : ''}
  ${sec.mods ? modsHtml(sec.mods, useT) : ''}
  ${bottomQuote(sec.quote)}`;
  }
  return { side, layout, inner, folio: folioHtml(p1Run, pgNo) };
};

/* M14 岗位一览 */
const renderM14 = (pgNo) => {
  const idx = data.part2.index || {};
  const pgOf = (name) => {
    const ji = jobInfo.find(({ job }) => job.name.join('') === name);
    return ji ? `P.${ji.cover}` : '—';
  };
  return `<div class="col-title"><span class="ct-idx">${pad2(P1_SECS.length + 1)}</span><span class="ct-name">${esc(idx.title || '主要就业岗位一览')}</span></div>
    <table class="xtable">
      <tr><th>岗位</th><th>方向</th><th class="num">详解</th></tr>
      ${(idx.rows || []).map(r => `<tr><td>${r.detail ? `<b>${esc(r.job)}</b>` : esc(r.job)}</td><td>${esc(r.dir)}</td><td class="num">${r.detail ? pgOf(r.job) : '—'}</td></tr>`).join('\n      ')}
    </table>
    ${idx.quote ? `<div class="pullquote" style="margin-top: 9mm;">
      <div class="pq-cn" style="font-size: 13.5pt;">${esc(idx.quote)}</div>
      <div class="pq-by">— ${esc(idx.quoteBy || '编辑部说明')}</div>
    </div>` : ''}
    ${idx.howToRead ? `<div style="margin-top: 9mm; border-top: 1px solid var(--border); padding-top: 3mm;">
      <div style="font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.14em; color: var(--muted);">HOW TO READ · 阅读指南</div>
      <p style="font-size: 9pt; line-height: 1.8; margin-top: 2mm; text-align: justify;">${esc(idx.howToRead)}</p>
    </div>` : ''}
    ${folioHtml(`PART 02 · ${(data.part2 && data.part2.runLabel) || '岗位篇'}`, pgNo)}`;
};

/* M15 岗位封面（出血，无 folio） */
const renderM15 = (job) => `<div class="bleed-img"><img src="${esc(job.image)}" alt="${esc(job.imageCaption || '')}（示意图）" style="height: 108%; object-position: center top;" /></div>
    <div class="caption-chip">IMAGE · ${esc(job.imageCaption || '')}（示意图）</div>`;

/* M16 岗位开篇（IN THIS FILE 页码回填） */
const SEC_TITLES = (job) => ({
  '01': '岗位综述', '02': `${job.shortName}的一天`, '03': '工作职责', '04': '行业前景',
  '05': `${job.shortName}的生活`, '06': '薪酬待遇', '07': '职业发展路径', '08': '准入门槛',
  '09': '专业优势', '10': '什么样的人更适合', '11': '了解行业及岗位', '12': '学习规划建议',
});
const renderM16 = (job, info, pgNo) => {
  const titles = SEC_TITLES(job);
  const item = (no) => `<div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 8.5pt;"><span><span style="font-family: var(--mono); color: var(--accent); font-weight: 700; margin-right: 2mm;">${no}</span>${esc(titles[no])}</span><span style="font-family: var(--mono); color: var(--muted);">${info.secAbs[no] != null ? 'P.' + pad2(info.secAbs[no]) : '—'}</span></div>`;
  const rows = [0, 1, 2, 3, 4, 5].map(k => item(pad2(k + 1)) + '\n        ' + item(pad2(k + 7))).join('\n        ');
  return `<div class="kicker">JOB FILE · ${esc(job.no)} · ${esc(job.dir)}</div>
    <h3 class="disp lg" style="margin-top: 4mm;">${job.name.map(esc).join('<br />')}</h3>
    <p style="font-family: var(--disp); font-weight: 700; font-size: 12pt; color: var(--muted); margin-top: 3mm; line-height: 1.4;">${esc(job.portrait)}</p>
    <hr class="ruled" style="margin: 6mm 0;" />
    <p style="font-size: 10pt; line-height: 1.9; text-align: justify;">${esc(job.summary)}</p>
    <div class="meta-grid" style="margin-top: 8mm;">
      ${(job.meta || []).map(m => `<div class="mg-item"><div class="mg-k">${esc(m.k)}</div><div class="mg-v">${esc(m.v)}</div></div>`).join('\n      ')}
    </div>
    <div class="cm-tags" style="margin-top: 8mm;">${(job.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
    <div style="margin-top: 9mm; border-top: 2px solid var(--fg); padding-top: 3.5mm;">
      <div style="font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.14em; color: var(--muted);">IN THIS FILE · 本岗导览</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2.2mm 8mm; margin-top: 3.5mm;">
        ${rows}
      </div>
    </div>
    ${folioHtml(`JOB FILE · ${job.name.join('')}`, pgNo)}`;
};

/* M17 详情页 / closing 页 */
const renderM17 = (job, pg, pgNo) => {
  const side = pgNo % 2 === 0 ? 'left' : 'right';
  const hasPin = pg.some(x => x.pin);
  const secs = pg.filter(it => !it.pin).map((it, k, arr) =>
    `<div class="sec"${k === arr.length - 1 && !hasPin ? ' style="margin-bottom: 0;"' : ''}>${it.html()}</div>`).join('\n  ');
  const pin = pg.filter(it => it.pin).map(it => it.html()).join('\n  ');
  return { side, layout: 'M17', cls: `flex-fill${pg.spacing ? ' ' + pg.spacing : ''}`, inner: `${colTitle('岗位档案 · JOB FILE · PART 02 岗位详解')}\n  ${secs}\n  ${pin}`, folio: folioHtml(`JOB FILE · ${job.name.join('')}`, pgNo) };
};

const renderClosing = (job, pack, pgNo) => {
  const cq = job.closingQuote || (data.part2 && data.part2.closingQuote) || {};
  const next = job.nextIssue && !pack.nextIssueOnLast
    ? `<div style="margin-top: 10mm; border-top: 2px solid var(--fg); padding-top: 3mm;">
      <div style="font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.14em; color: var(--muted);">NEXT ISSUE · 下期预告</div>
      <p style="font-size: 9pt; line-height: 1.8; margin-top: 2mm;">${esc(job.nextIssue)}</p>
    </div>` : '';
  return { side: 'right', layout: 'M17', inner: `${colTitle('岗位档案 · JOB FILE · PART 02 岗位详解')}
  ${cq.text ? `<div class="pullquote tint" style="margin-top: 40mm;">
    <div class="pq-cn" style="font-size: 15pt;">${esc(cq.text)}</div>
    <div class="pq-by">— ${esc(cq.by || '编辑部')}</div>
  </div>` : ''}
  ${next}`, folio: folioHtml(`JOB FILE · ${job.name.join('')}`, pgNo) };
};

/* ================================================================
   组装对开
   ================================================================ */
const pageHtml = (p) =>
  `<div class="page ${p.side}${p.cls ? ' ' + p.cls : ''}" data-layout="${p.layout}"${p.style ? ` style="${p.style}"` : ''}>${p.inner}${p.folio || ''}</div>`;
const spread = (id, l, r, navy) =>
  `<section class="spread${navy ? ' navy' : ''}"${id ? ` id="${id}"` : ''}>\n  ${pageHtml(l)}\n  ${pageHtml(r)}\n</section>`;

const spreads = [];
spreads.push(spread('sp-cover',
  { side: 'left', layout: 'M00', cls: 'cov', inner: renderM00() },
  { side: 'right', layout: 'M01', cls: 'cov', inner: renderM01() }));
spreads.push(spread('sp-preface',
  { side: 'left', layout: 'M02', inner: renderM02() },
  { side: 'right', layout: 'M03', style: 'padding: 0;', inner: renderM03() }));
spreads.push(spread('sp-toc',
  { side: 'left', layout: 'M04', inner: renderM04() },
  { side: 'right', layout: 'M05', inner: renderM05() }));

const d1 = data.part1.divider;
spreads.push(spread('sp-part1',
  { side: 'left', layout: 'M06', inner: renderM06(d1, d1.num, pgDv1) },
  { side: 'right', layout: 'M07', inner: renderM07(d1, pgDv1 + 1) }, true));

P1_SECS.forEach((sec, i) => {
  const pg = renderDataPage(sec, i, pgData0 + i);
  const left = { side: pg.side, layout: pg.layout, cls: 'flex-fill', inner: pg.inner, folio: pg.folio };
  if (i % 2 === 0) {
    if (i + 1 < P1_SECS.length) {
      const pg2 = renderDataPage(P1_SECS[i + 1], i + 1, pgData0 + i + 1);
      spreads.push(spread(null, left, { side: pg2.side, layout: pg2.layout, cls: 'flex-fill', inner: pg2.inner, folio: pg2.folio }));
    } else {
      const fillerQ = (data.part1 && data.part1.closingQuote) || {};
      spreads.push(spread(null, left, {
        side: 'right', layout: 'M13',
        inner: fillerQ.text ? `<div class="pullquote tint" style="margin-top: 40mm;"><div class="pq-cn" style="font-size: 15pt;">${esc(fillerQ.text)}</div><div class="pq-by">— ${esc(fillerQ.by || '编辑部')}</div></div>` : '',
        folio: folioHtml(p1Run, pgData0 + i + 1),
      }));
    }
  }
});

const d2 = data.part2.divider;
spreads.push(spread('sp-part2',
  { side: 'left', layout: 'M06', style: 'background: var(--accent); color: #ffffff;', inner: renderM06({ ...d2, image: null }, d2.num, pgDv2) },
  { side: 'right', layout: 'M14', inner: renderM14(pgJobIndex) }));

jobs.forEach((job, i) => {
  const info = jobInfo[i], pack = jobPacks[i];
  spreads.push(spread(`sp-job-${i + 1}`,
    { side: 'left', layout: 'M15', style: 'padding: 0;', inner: renderM15(job) },
    { side: 'right', layout: 'M16', inner: renderM16(job, info, info.intro) }));
  for (let k = 0; k < pack.jPages.length; k += 2) {
    const a = renderM17(job, pack.jPages[k], info.detail0 + k);
    let b;
    if (k + 1 < pack.jPages.length) b = renderM17(job, pack.jPages[k + 1], info.detail0 + k + 1);
    else b = renderClosing(job, pack, info.detail0 + k + 1);
    spreads.push(spread(null,
      { side: a.side, layout: a.layout, cls: a.cls, inner: a.inner, folio: a.folio },
      { side: b.side, layout: b.layout, cls: b.cls, inner: b.inner, folio: b.folio }));
  }
});

/* ================================================================
   注入模板 · 输出
   ================================================================ */
const tpl = readFileSync(join(ROOT, 'assets', 'template.html'), 'utf8');
const mainOpen = tpl.indexOf('<main class="stage">');
const mainClose = tpl.indexOf('</main>');
let out = tpl.slice(0, mainOpen + '<main class="stage">'.length) +
  '\n\n' + spreads.join('\n\n') + '\n\n' + tpl.slice(mainClose);

out = out.replace(/(--accent:\s*)#[0-9a-f]{6}/i, `$1${accent}`);
out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title || `${(data.cover.title || []).join('')} · ${meta.handbook || '职业发展手册'}`)}</title>`);
out = out.replace(/\[必填[^\]]*\]/g, '');

cpSync(join(SHARED, 'fonts'), join(dirname(outPath), 'fonts'), { recursive: true });
mkdirSync(join(dirname(outPath), 'images'), { recursive: true });
cpSync(join(SHARED, 'placeholders', 'logo-placeholder.svg'), join(dirname(outPath), 'images', 'logo-placeholder.svg'));
writeFileSync(outPath, out);
// 同步内容 JSON 目录下的 images/ 到输出目录
const contentImagesDir = join(dirname(jsonPath), 'images');
if (existsSync(contentImagesDir)) {
  cpSync(contentImagesDir, join(dirname(outPath), 'images'), { recursive: true, force: true });
}
console.log(`OK ${outPath} · 主题 ${themeName}（accent ${accent}）· ${spreads.length} 对开 / ${totalPages} 页`);
