#!/usr/bin/env node
/**
 * build-journal.mjs · 模版 C（东方学报风）
 * 从内容 JSON 生成手册 HTML。物理规格与模版 A/B 同族（210×285 单页 / 432×291 对开画布）。
 *
 * 用法:
 *   node build-journal.mjs <content.json> <输出.html> [--theme engineering-terra]
 *
 * 分页模型（版式锁，与 references/layouts.md 一一对应）:
 *   对开1  封底 X00 | 封面 X01（无页码）
 *   对开2  序 X02 | 序图 X03（X03 出血无 folio）
 *   对开3  目录·上篇 X04 | 目录·下篇 X05（.ve-pg 页码自动回填）
 *   对开4  幕封 X06 | 引文 X07
 *   对开5–7  上篇数据页固定六页：X08 条图 | X09 圆环 / X10 大字格 | X11 细条 / X12 柱图 | X13 阶梯
 *   每岗位  对开8 X15 岗位封面（出血无 folio）| X17a 详解一
 *           对开9 X17b 详解二 | X17c 详解三
 *           对开10 X17d 详解四 | X18 结语（页码/预告回填）
 *   C 分页锁死：上篇六页固定顺序不可调；每岗位固定 4 个详情页，不做贪心打包。
 *
 * 主题映射：seal ← 主题 --accent；ink ← --cov-ink；paper ← --bg；paper-2 ← --surface；
 *   ink-2 ← --fg；muted ← --muted；border ← --border。
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
  console.error('用法: node build-journal.mjs <content.json> <输出.html> [--theme <name>]');
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
const CMAP = { paper: 'bg', 'paper-2': 'surface', ink: 'cov-ink', 'ink-2': 'fg', muted: 'muted', border: 'border', seal: 'accent' };
for (const [to, from] of Object.entries(CMAP)) {
  if (!theme[from]) {
    console.error(`主题 ${themeName} 缺少 --${from} token（C 的 ${to} 映射源）`);
    process.exit(2);
  }
}

/* ---------- 工具 ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad2 = (n) => String(n).padStart(2, '0');
const CH_ORD = ['其壹', '其贰', '其叁', '其肆', '其伍', '其陆'];
const SI_ORD = ['其一', '其二', '其三', '其四', '其五', '其六'];

/* ================================================================
   分页模型（固定，无贪心打包）
   ================================================================ */
const meta = data.meta;
const jobs = (data.part2 && data.part2.jobs) || [];
const nJobs = jobs.length;
const PG = {
  cover: [0, 1],            // X00=00 | X01=01
  preface: [2, 3],          // X02=02 | X03=03（03 出血）
  toc: [4, 5],              // X04=04 | X05=05
  divider: [6, 7],          // X06=06 | X07=07
  data: [8, 9, 10, 11, 12, 13],   // X08..X13
};
PG.jobs = jobs.map((job, i) => {
  const base = 14 + 6 * i;
  return { base, cover: base, a: base + 1, b: base + 2, c: base + 3, d: base + 4, x18: base + 5 };
});
const totalPages = 14 + 6 * nJobs;

/* 下篇目录条目：07 一览 → 首个岗位 X15；岗位条目 → 首个岗位 X17a，后续岗位 → 各自 X15 封面 */
const tocJobEntryPg = (i) => (i === 0 ? PG.jobs[0].a : PG.jobs[i].cover);

/* ================================================================
   组件渲染
   ================================================================ */
const folio = (pg) => `<div class="folio">— <b>${pad2(pg)}</b> —</div>`;
const colTitle = (cn, en) =>
  `<div class="col-title"><span class="ct-cn">${esc(cn)}</span><span>${esc(en)}</span></div>`;
const sitem = (t, d, mb = '5mm') =>
  `<div class="sitem" style="margin-bottom:${mb}"><div><div class="si-t">${esc(t)}</div><div class="si-d">${esc(d)}</div></div></div>`;

const paraHtml = (p) => {
  if (typeof p === 'string') return `<p>${esc(p)}</p>`;
  return `<p>${p.pre ? esc(p.pre) : ''}<mark>${esc(p.m)}</mark>${esc(p.d)}</p>`;
};

const bodyText = (paras, cls = 'no-indent') =>
  `<div class="body-text ${cls}">` + paras.map(paraHtml).join('\n      ') + `</div>`;

const contentTitle = (lines) =>
  `<div style="font-family:var(--disp);font-size:16pt;font-weight:700;line-height:1.4">` +
  lines.map(esc).join('<br />') + `</div>`;

/* ---------- 封面 X00 / X01 ---------- */
const renderX00 = () => {
  const c = data.cover;
  return `<div class="bc-center">
      <span class="seal">${esc(c.seal)}</span>
      <div class="nm">${esc(c.nm || meta.handbook)}</div>
    </div>
    <div class="bc-foot">
      ${(c.credits || []).map(esc).join('<br />\n      ')}<br />
      <span style="font-family:var(--mono);letter-spacing:.2em">${esc(c.monoEn || `CAREER HANDBOOK · VOL. ${meta.year}`)}</span>
    </div>`;
};

const renderX01 = () => {
  const c = data.cover;
  return `${c.logo ? `<div class="cov-logo"><img src="${esc(c.logo)}" alt="${esc(meta.school || '学校标识')}"></div>` : ''}
    <div class="vt cov-vtitle">${esc(c.vtitle || meta.handbook)}</div>
    ${c.vsub ? `<div class="vt cov-vsub">${esc(c.vsub)}</div>` : ''}
    ${c.covSeal ? `<span class="seal cov-seal">${esc(c.covSeal)}</span>` : ''}
    <div class="cov-meta">
      <div class="yr">${esc(c.yr || `VOL. ${meta.year} · 第壹辑`)}</div>
      <div class="ttl">${esc(c.ttl || '')}</div>
    </div>
    <div class="cov-strip">
      ${(c.strip || []).map(s => `<span class="cs"><b>${esc(s.b)}</b>${esc(s.t)}</span>`).join('\n      ')}
    </div>`;
};

/* ---------- 序 X02 / 序图 X03 ---------- */
const renderX02 = (pg) => {
  const f = data.preface;
  return `${colTitle('卷首', 'PREFACE')}
    <div class="pf-head">
      <span class="zi">序</span>
      ${f.seal ? `<span class="seal">${esc(f.seal)}</span>` : ''}
      <div class="side">
        <div class="a">PREFACE · ${esc(f.year || meta.year)}</div>
        <div class="b">${esc(f.dept || '')}</div>
      </div>
    </div>
    <div class="wenwu" style="margin-bottom:8mm"></div>
    <div class="body-text">
      ${(f.paras || []).map(paraHtml).join('\n      ')}
    </div>
    <div class="pf-sign">
      <div class="who">${esc(f.who || '')}${f.whoSeal ? `<span class="seal">${esc(f.whoSeal)}</span>` : ''}</div>
      <div class="when">${esc(f.when || '')}</div>
    </div>
    ${folio(pg)}`;
};

const renderX03 = () => {
  const f = data.preface;
  return `<img class="img-bleed" src="${esc(f.image)}" alt="${esc(f.imageCaption || '序配图')}">
    <div class="caption-chip" style="left:12mm;bottom:12mm"><b>FIG. 01 · ${esc(f.figLabel || '卷首图')}</b>${esc(f.imageCaption || '')}（示意图）</div>`;
};

/* ---------- 目录 X04 / X05 ---------- */
const renderX04 = (pg) => {
  const t = data.toc.p1;
  const rows = (data.part1 && data.part1.sections || []).map((s, k) =>
    `<div class="vt-entry"><span class="ve-no">${pad2(k + 1)}</span><span class="ve-tt">${esc(s.tt || s.note)}</span><span class="ve-pg" data-pg="${pad2(PG.data[k])}">${pad2(PG.data[k])}</span></div>`).join('\n      ');
  return `${colTitle('目录', 'CONTENTS · 上篇')}
    <div class="toc-title">目 录</div>
    <div class="wenwu" style="margin-bottom:7mm"></div>
    <div class="vtoc">
      <div class="vt-part">
        <span class="vp-name">${esc(t.name || '上篇')}</span>
        <span class="seal">${esc(t.seal || '壹')}</span>
        <span class="vp-en">${esc(t.en || 'PART 01 · DATA')}</span>
      </div>
      ${rows}
    </div>
    <div class="pin-bottom">
      <div class="note">${esc(t.note || '')}</div>
    </div>
    ${folio(pg)}`;
};

const renderX05 = (pg) => {
  const t = data.toc.p2;
  const jobRows = jobs.map((job, i) =>
    `<div class="vt-entry"><span class="ve-no">${pad2(8 + i)}</span><span class="ve-tt">${esc(job.name)}</span><span class="ve-pg" data-pg="${pad2(tocJobEntryPg(i))}">${pad2(tocJobEntryPg(i))}</span></div>`).join('\n      ');
  const glance = data.toc.glance || {};
  return `${colTitle('目录', 'CONTENTS · 下篇')}
    <div class="toc-title">目 录</div>
    <div class="wenwu" style="margin-bottom:7mm"></div>
    <div class="vtoc">
      <div class="vt-part">
        <span class="vp-name">${esc(t.name || '下篇')}</span>
        <span class="seal">${esc(t.seal || '贰')}</span>
        <span class="vp-en">${esc(t.en || 'PART 02 · JOBS')}</span>
      </div>
      <div class="vt-entry"><span class="ve-no">07</span><span class="ve-tt">${esc(t.indexTitle || '主要就业岗位一览')}</span><span class="ve-pg" data-pg="${pad2(tocJobEntryPg(0))}">${pad2(tocJobEntryPg(0))}</span></div>
      ${jobRows}
    </div>
    <div class="glance-strip">
      <div class="gs-h"><span class="t">${esc(glance.title || '本期速览')}</span><span class="e">${esc(glance.en || `AT A GLANCE · ${meta.year}`)}</span></div>
      ${(glance.rows || []).map(g =>
        `<div class="gs-row"><span class="gn">${esc(g.gn)}${g.small ? `<small>${esc(g.small)}</small>` : ''}</span><span class="gd">${esc(g.gd)}</span></div>`).join('\n      ')}
    </div>
    ${folio(pg)}`;
};

/* ---------- 幕封 X06 / 引文 X07 ---------- */
const renderX06 = (pg) => {
  const d = data.divider;
  return `<div class="dv-watermark">${esc(d.watermark || '壹')}</div>
    <div class="vt dv-vt"><span class="pt-tag">${esc(d.tag || '上篇')}</span>${esc(d.vt || '')}</div>
    ${d.seal ? `<span class="seal dv-seal">${esc(d.seal)}</span>` : ''}
    <div class="dv-sum">
      <div class="lab">${esc(d.lab || 'PART 01 · 本篇概要')}</div>
      <div class="tx">${esc(d.tx || '')}</div>
    </div>
    ${folio(pg)}`;
};

const renderX07 = (pg) => {
  const e = data.editor || {};
  return `${colTitle(e.cn || '编者按', e.en || "EDITOR'S NOTE")}
    <div style="margin-top:38mm">
      <div class="q-mark">「</div>
      <div class="q-body">${(e.body || []).map(esc).join('<br />')}</div>
      <div class="pull-src">—— ${esc(e.src || '')}</div>
    </div>
    <div class="pin-bottom note" style="border-top:.5pt solid var(--border);padding-top:3mm">
      ${esc(e.note || '')}
    </div>
    ${folio(pg)}`;
};

/* ---------- 上篇数据页（固定六页） ---------- */
const D_COLORS = ['var(--seal)', 'var(--ink)', 'var(--muted)', 'var(--border)'];

/* X08 条图 */
const renderX08 = (s, pg) => {
  const hero = s.hero || {};
  return `${colTitle('上篇 · 数据', `01 · ${s.en || 'OVERVIEW'}`)}
    <div style="margin-bottom:6mm">
      <div class="note" style="margin-bottom:2mm">${esc(s.note || '')}</div>
      <div class="hero-num">${esc(hero.v || '')}<small> ${esc(hero.small || '')}</small></div>
    </div>
    ${sitem(s.si_t, s.si_d, '6mm')}
    <div class="chart-unit">
      ${(s.rows || []).map((r, i) =>
        `<div class="stat-row${r.top ? ' top' : ''}"${i === 0 ? ' style="border-top:1.6px solid var(--ink)"' : ''}>
        <span class="sn">${esc(r.sn)}${r.small ? `<small>${esc(r.small)}</small>` : ''}</span>
        <span class="st">${esc(r.st)}</span>
        <span class="sd">${esc(r.sd)}</span>
        <span class="bar" style="width:${r.width}%"></span>
      </div>`).join('\n      ')}
      <div class="figcap">${esc(s.figcap || '')}</div>
    </div>
    ${bodyText(s.body || [])}
    ${folio(pg)}`;
};

/* X09 圆环 */
const renderX09 = (s, pg) => {
  const segs = s.donut.segs || [];
  let acc = 0;
  const rings = segs.map((seg, i) => {
    const shown = seg.pct > 0 && seg.pct < 3 ? 2.3 : seg.pct;
    const off = 25 - acc;
    acc += seg.pct;
    return `<circle cx="21" cy="21" r="15.9155" fill="none" style="stroke:${D_COLORS[i % 4]}" stroke-width="4.2" stroke-dasharray="${shown} ${(100 - shown).toFixed(2)}" stroke-dashoffset="${off}" />`;
  }).join('\n          ');
  const max = segs.reduce((a, b) => (b.pct > a.pct ? b : a), { pct: -1 });
  return `${colTitle('上篇 · 数据', `02 · ${s.en || 'CITIES'}`)}
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">${esc(s.note || '')}</div>
      ${contentTitle(s.title || [])}
    </div>
    ${sitem(s.si_t, s.si_d, '5mm')}
    <div class="chart-unit">
      <div class="donut-row">
        <svg class="donut-svg" viewBox="0 0 42 42" role="img" aria-label="${esc(s.donut.aria || '圆环图')}">
          <circle cx="21" cy="21" r="15.9155" fill="none" style="stroke:var(--border)" stroke-width="4.2" />
          ${rings}
          <text x="21" y="19.5" text-anchor="middle" style="font-family:var(--disp);font-weight:700;font-size:6px;fill:var(--ink)">${esc(s.donut.center || (max.pct + '%'))}</text>
          <text x="21" y="24" text-anchor="middle" style="font-family:var(--mono);font-size:2px;letter-spacing:.05em;fill:var(--muted)">${esc(s.donut.centerNote || max.label || '')}</text>
        </svg>
        <div class="donut-legend">
          ${segs.map((seg, i) => `<div class="dl-row"><span class="dl-dot" style="background:${D_COLORS[i % 4]}"></span><span class="dl-label">${esc(seg.label)}</span><span class="dl-val">${esc(seg.val)}</span></div>`).join('\n            ')}
        </div>
      </div>
      <div class="figcap">${esc(s.figcap || '')}</div>
    </div>
    ${bodyText(s.body || [])}
    <div class="mod-grid">
      ${(s.mods || []).map(m => `<div class="mod">
        <div class="mod-h"><span class="mh-no">${esc(m.no)}</span><span class="mh-name">${esc(m.name)}</span>${m.stat ? `<span class="mh-stat">${esc(m.stat)}</span>` : ''}</div>
        <p>${esc(m.text)}</p>
      </div>`).join('\n      ')}
    </div>
    ${folio(pg)}`;
};

/* X10 大字格 */
const renderX10 = (s, pg) => {
  return `${colTitle('上篇 · 数据', `03 · ${s.en || 'COMPANIES'}`)}
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">${esc(s.note || '')}</div>
      ${contentTitle(s.title || [])}
    </div>
    ${sitem(s.si_t, s.si_d, '5mm')}
    <div class="firm-grid">
      ${(s.cells || []).map(c => `<div class="firm-cell${c.acc ? ' acc' : ''}">
        <div class="fn">${esc(c.v)}${c.small ? `<small>${esc(c.small)}</small>` : ''}</div>
        <div class="ft">${esc(c.ft)}</div>
        <div class="fd">${esc(c.fd)}</div>
      </div>`).join('\n      ')}
    </div>
    <div class="figcap" style="margin-top:7mm">${esc(s.figcap || '')}</div>
    ${bodyText(s.body || [])}
    ${folio(pg)}`;
};

/* X11 细条 */
const renderX11 = (s, pg) => {
  const hero = s.hero || {};
  return `${colTitle('上篇 · 数据', `04 · ${s.en || 'EDUCATION'}`)}
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">${esc(s.note || '')}</div>
      ${contentTitle(s.title || [])}
    </div>
    ${sitem(s.si_t, s.si_d, '5mm')}
    <div class="hero-num" style="margin-bottom:6mm">${esc(hero.v || '')}${hero.small ? `<small>${esc(hero.small)}</small>` : ''}</div>
    <div class="chart-unit">
      ${(s.bars || []).map(b => `<div class="hbar-row"><span class="hl">${esc(b.hl)}</span><span class="ht"><span class="hf${b.acc ? ' acc' : ''}" style="width:${b.width}%"></span></span><span class="hv">${esc(b.hv)}</span></div>`).join('\n      ')}
      <div class="figcap">${esc(s.figcap || '')}</div>
    </div>
    ${bodyText(s.body || [])}
    ${folio(pg)}`;
};

/* X12 柱图 */
const renderX12 = (s, pg) => {
  return `${colTitle('上篇 · 数据', `05 · ${s.en || 'EXPERIENCE'}`)}
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">${esc(s.note || '')}</div>
      ${contentTitle(s.title || [])}
    </div>
    ${sitem(s.si_t, s.si_d, '5mm')}
    <div class="chart-unit">
      <div class="col-chart">
        ${(s.cols || []).map(c => `<div class="ccol${c.acc ? ' acc' : ''}"><span class="v">${esc(c.v)}${c.small ? `<small>${esc(c.small)}</small>` : ''}</span><div class="bar" style="height:${c.height}%"></div></div>`).join('\n        ')}
      </div>
      <div class="ccol-labels">
        ${(s.cols || []).map(c => `<span>${esc(c.label)}${c.em ? `<em>${esc(c.em)}</em>` : ''}</span>`).join('\n        ')}
      </div>
      <div class="figcap">${esc(s.figcap || '')}</div>
    </div>
    ${bodyText(s.body || [])}
    ${folio(pg)}`;
};

/* X13 阶梯 */
const renderX13 = (s, pg) => {
  return `${colTitle('上篇 · 数据', `06 · ${s.en || 'SKILLS'}`)}
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">${esc(s.note || '')}</div>
      ${contentTitle(s.title || [])}
    </div>
    ${sitem(s.si_t, s.si_d, '5mm')}
    <div class="ladder">
      ${(s.ladder || []).map(l => `<div class="lad-r">
        <span class="lad-no">${esc(l.no)}</span>
        <span class="lad-t">${esc(l.t)}</span>
        <span class="lad-k">${esc(l.k)}</span>
        <span class="lad-d">${esc(l.d)}</span>
      </div>`).join('\n      ')}
    </div>
    <div class="figcap">${esc(s.figcap || '')}</div>
    ${bodyText(s.body || [])}
    ${folio(pg)}`;
};

/* ---------- 岗位 X15 / X17a–d / X18 ---------- */
const jobFileNo = (i) => `JOB FILE · ${pad2(i + 1)}`;
const jobPosLine = (i) => `POSITION ${pad2(i + 1)} / ${pad2(nJobs)} · ` + SI_ORD.slice(0, 3).map(x => x.replace('其', '其')).join('至').replace(/其其/g, '其');

const renderX15 = (job, i) => {
  return `<img class="img-bleed" src="${esc(job.image)}" alt="${esc(job.imageCaption || '岗位场景')}" style="height:100%;object-position:${esc(job.imagePos || 'center 30%')}">
    <div class="job-band">
      <div class="jb-no">下篇 · 重点岗位 · ${esc(CH_ORD[i] || '')}</div>
      <div class="jb-title">${esc(job.name)}</div>
      <div class="jb-sub">${esc(job.sub || '')}</div>
    </div>
    <div class="caption-chip" style="right:12mm;top:12mm"><b>FIG. 2-${i + 1} · 岗位场景</b>${esc(job.imageCaption || '')}（示意图）</div>`;
};

const jmHead = (no, name, en) =>
  `<div class="jm-h"><span class="jm-no">${no}</span><span class="jm-name">${esc(name)}</span><span class="jm-en">${esc(en)}</span></div>`;

const slist = (items) =>
  `<div class="slist">
    ${items.map(it => `<div class="sitem"><div><div class="si-t">${esc(it.t)}</div><div class="si-d">${esc(it.d)}</div></div></div>`).join('\n      ')}
  </div>`;

const ditem = (items) =>
  items.map(it => `<div class="ditem"><span class="dno">${esc(it.no)}</span><div class="dt2"><div class="t">${esc(it.t)}</div><div class="d">${esc(it.d)}</div></div></div>`).join('\n      ');

const renderX17a = (job, i, pg) => {
  const S = job.sections;
  return `${colTitle('下篇 · 岗位档案', jobFileNo(i))}
    <div style="margin-bottom:5mm">
      <div style="font-family:var(--mono);font-size:7pt;letter-spacing:.24em;color:var(--seal);margin-bottom:2mm">${jobPosLine(i)}</div>
      <div style="font-family:var(--disp);font-size:15pt;font-weight:700;letter-spacing:.1em">${esc(job.name)} · 岗位详解</div>
    </div>
    <div class="lede jsec">
      ${jmHead('壹', '岗位综述', S.overview.en || 'OVERVIEW')}
      <p>${esc(S.overview.text)}</p>
    </div>
    <div class="jsec">
      ${jmHead('贰', `${job.name}的一天`, S.day.en || 'A DAY')}
      <div class="day-tab">
        ${S.day.rows.map(r => `<div class="day-row"><div class="dt">${esc(r.t)}</div><div class="dc">${esc(r.d)}</div></div>`).join('\n        ')}
      </div>
    </div>
    <div class="jsec">
      ${jmHead('叁', '工作职责', S.duties.en || 'RESPONSIBILITIES')}
      ${ditem(S.duties.items)}
    </div>
    ${folio(pg)}`;
};

const renderX17b = (job, i, pg) => {
  const S = job.sections;
  const sal = S.salary;
  return `${colTitle('下篇 · 岗位档案', jobFileNo(i))}
    <div class="jsec">
      ${jmHead('肆', '行业前景', S.outlook.en || 'OUTLOOK')}
      ${slist(S.outlook.items)}
    </div>
    <div class="jsec">
      ${jmHead('伍', `${job.name}的生活`, S.life.en || 'LIFESTYLE')}
      ${slist(S.life.items)}
    </div>
    <div class="jsec">
      ${jmHead('陆', '薪酬待遇', S.salary.en || 'SALARY')}
      <div class="sal">
        ${sal.tiers.map((t, k) => `<div class="sal-c${t.acc ? ' acc' : ''}">
          <div class="sc-t">${esc(t.t)}</div>
          <div class="sc-v">${esc(t.v)}${t.small ? `<small>${esc(t.small)}</small>` : ''}</div>
          <div class="sc-d">${esc(t.d)}</div>
        </div>`).join('\n        ')}
      </div>
      <div class="figcap">${esc(sal.figcap || '')}</div>
    </div>
    ${folio(pg)}`;
};

const renderX17c = (job, i, pg) => {
  const S = job.sections;
  return `${colTitle('下篇 · 岗位档案', jobFileNo(i))}
    <div class="jsec">
      ${jmHead('柒', '职业发展路径', S.path.en || 'PATH')}
      <div class="pway">
        ${S.path.tracks.map(t => `<div class="pw-r"><div class="pw-t">${esc(t.t)}</div><div class="pw-seq">
          ${t.steps.map((s, k) =>
            `<span class="pw-step${k === t.steps.length - 1 ? ' hl' : ''}">${esc(s)}</span>${k < t.steps.length - 1 ? '<span class="pw-arrow">→</span>' : ''}`).join('')}
        </div></div>`).join('\n        ')}
      </div>
    </div>
    <div class="jsec">
      ${jmHead('捌', '准入门槛', S.threshold.en || 'ENTRY')}
      ${ditem(S.threshold.items)}
    </div>
    <div class="jsec">
      ${jmHead('玖', '专业优势', S.advantages.en || 'ADVANTAGE')}
      ${slist(S.advantages.items)}
    </div>
    ${folio(pg)}`;
};

const renderX17d = (job, i, pg) => {
  const S = job.sections;
  return `${colTitle('下篇 · 岗位档案', jobFileNo(i))}
    <div class="jsec">
      ${jmHead('拾', '什么样的人更适合', S.fit.en || 'FIT')}
      ${ditem(S.fit.items)}
    </div>
    <div class="jsec">
      ${jmHead('拾壹', '如何了解这个行业', S.channels.en || 'RESOURCES')}
      ${slist(S.channels.items)}
    </div>
    ${folio(pg)}`;
};

const renderX18 = (job, i, pg) => {
  const S = job.sections;
  const C = job.closing || {};
  const next = jobs[i + 1];
  const nextPg = next ? PG.jobs[i + 1].cover : null;
  const planItems = (S.plan && S.plan.items) || [];
  return `<div class="dv-watermark" style="right:auto;left:6mm">终</div>
    <div class="vt" style="position:absolute;top:40mm;right:auto;left:18mm;font-size:24pt;font-weight:700;letter-spacing:.3em">${esc(C.vt || '寄语')}</div>
    <span class="seal" style="position:absolute;top:40mm;left:38mm;width:11mm;height:11mm;font-size:8pt">${esc(C.seal || CH_ORD[i])}</span>
    <div style="position:absolute;left:60mm;right:14mm;top:44mm">
      <div class="note" style="margin-bottom:4mm">${esc(C.note || `卷末 · ${CH_ORD[i]}结语`)}</div>
      <div class="jsec">
        ${jmHead('拾贰', '学习规划建议', S.plan.en || 'PLAN')}
        ${slist(planItems)}
      </div>
      <div class="pull" style="border-top:1.6px solid var(--ink);padding-top:5mm;font-size:13.5pt;line-height:1.9">
        ${esc(C.pull || '')}
        <div class="pull-src" style="margin-top:2mm">—— ${esc(C.pullSrc || `编者按 · ${CH_ORD[i]}终`)}</div>
      </div>
      ${next && C.next ? `<div class="note" style="margin-top:8mm">${esc(C.next)}「${esc(next.name)}」—— ${esc(next.blurb || '')}，页面 ${nextPg}。</div>` : ''}
    </div>
    ${folio(pg)}`;
};

/* ================================================================
   组装对开
   ================================================================ */
const pageHtml = (layout, side, inner, style) =>
  `<div class="page ${side}" data-layout="${layout}"${style ? ` style="${style}"` : ''}>\n    ${inner}\n  </div>`;
const spread = (id, l, r) =>
  `<section class="spread"${id ? ` id="${id}"` : ''}>\n  ${l}\n  ${r}\n</section>`;

const spreads = [];
spreads.push(spread('sp-cover',
  pageHtml('X00', 'left', renderX00()),
  pageHtml('X01', 'right', renderX01(), 'padding:0')));
spreads.push(spread('sp-preface',
  pageHtml('X02', 'left', renderX02(PG.preface[0])),
  pageHtml('X03', 'right', renderX03(), 'padding:0')));

const parts = data.part1 || {};
spreads.push(spread('sp-toc',
  pageHtml('X04', 'left', renderX04(PG.toc[0])),
  pageHtml('X05', 'right', renderX05(PG.toc[1]))));
spreads.push(spread('sp-divider-1',
  pageHtml('X06', 'left', renderX06(PG.divider[0])),
  pageHtml('X07', 'right', renderX07(PG.divider[1]))));

const SECS = parts.sections || [];
const DATA_RENDER = [renderX08, renderX09, renderX10, renderX11, renderX12, renderX13];
spreads.push(spread('sp-data-1',
  pageHtml('X08', 'left', DATA_RENDER[0](SECS[0], PG.data[0])),
  pageHtml('X09', 'right', DATA_RENDER[1](SECS[1], PG.data[1]))));
spreads.push(spread('sp-data-2',
  pageHtml('X10', 'left', DATA_RENDER[2](SECS[2], PG.data[2])),
  pageHtml('X11', 'right', DATA_RENDER[3](SECS[3], PG.data[3]))));
spreads.push(spread('sp-data-3',
  pageHtml('X12', 'left', DATA_RENDER[4](SECS[4], PG.data[4])),
  pageHtml('X13', 'right', DATA_RENDER[5](SECS[5], PG.data[5]))));

jobs.forEach((job, i) => {
  const p = PG.jobs[i];
  spreads.push(spread(`sp-job-${i + 1}-1`,
    pageHtml('X15', 'left', renderX15(job, i), 'padding:0'),
    pageHtml('X17a', 'right', renderX17a(job, i, p.a))));
  spreads.push(spread(`sp-job-${i + 1}-2`,
    pageHtml('X17b', 'left', renderX17b(job, i, p.b)),
    pageHtml('X17c', 'right', renderX17c(job, i, p.c))));
  spreads.push(spread(`sp-job-${i + 1}-3`,
    pageHtml('X17d', 'left', renderX17d(job, i, p.d)),
    pageHtml('X18', 'right', renderX18(job, i, p.x18))));
});

/* ================================================================
   注入模板 · 输出
   ================================================================ */
const tpl = readFileSync(join(ROOT, 'assets', 'template.html'), 'utf8');
const mainOpen = tpl.indexOf('<main class="stage">');
const mainClose = tpl.lastIndexOf('</main>');
let out = tpl.slice(0, mainOpen + '<main class="stage">'.length) +
  '\n\n' + spreads.join('\n\n') + '\n\n' + tpl.slice(mainClose);

/* 主题 tokens 替换（SLOT: theme tokens 内的 7 个颜色变量） */
for (const [to, from] of Object.entries(CMAP)) {
  out = out.replace(new RegExp(`(--${to}:\\s*)#[0-9a-f]{6}`, 'i'), `$1${theme[from]}`);
}
out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title || `${meta.handbook || '职业发展手册'} · ${meta.year}`)}</title>`);
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
console.log(`OK ${outPath} · 主题 ${themeName}（seal ${theme.accent} / ink ${theme['cov-ink']}）· ${spreads.length} 对开 / ${totalPages} 页`);
