#!/usr/bin/env node
/**
 * build.mjs — D · 工业技术风 构建脚本
 * 用法: node build.mjs <content.json> <out.html> [--paper a4|cn16]
 *
 * 输入: content JSON（meta + sections/spreads）
 * 输出: 单文件 HTML（样式与 blocks.css 全内联）+ 同步字体目录到产物旁
 * 零依赖，Node >= 18
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TPL = resolve(HERE, '..');            // templates/D-industrial
const SKILL = resolve(TPL, '../..');        // skill root

/* ---------------- 骨架清单（validate.mjs 共用，勿重复定义） ---------------- */
export const LAYOUTS = [
  'D00', 'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07',
  'D08', 'D09', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15'
];
export const BLOCK_TYPES = [
  'text', 'grades', 'table', 'twin', 'flow', 'chart',
  'image', 'svg', 'stats', 'certs', 'timeline', 'contact'
];
/** 纸张口径：--page-* 是成品单页，--spread-* 是含 3mm 四缘出血的印刷幅面（折线处不出血）。
 *  @page size 写死在 blocks.css（a4 默认），cn16 由 build() 动态替换。 */
export const PAPERS = {
  a4:   { '--page-w': '210mm', '--page-h': '297mm', '--spread-w': '426mm', '--spread-h': '303mm', page: '426mm 303mm' },
  cn16: { '--page-w': '216mm', '--page-h': '291mm', '--spread-w': '438mm', '--spread-h': '297mm', page: '438mm 297mm' }
};

/* ---------------- 工具 ---------------- */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* 资源根目录：矢量图（logo / 图表）要内联进 HTML，才能继承页面的字体与主题色。
   由 main() 设成内容 JSON 所在目录，与 images/ 的相对路径保持一致。 */
let ASSET_ROOT = process.cwd();

/** 把 SVG 文件内联成页内元素。
 *  <img src="x.svg"> 是独立文档，拿不到 @font-face 与 CSS 变量——图表上的字会掉成
 *  系统 Helvetica，送印时 PDF 里就多一套字体。内联后 CSS 变量与 MiSans 都能继承。 */
function inlineSvg(src, cls) {
  const p = join(ASSET_ROOT, src);
  if (!existsSync(p)) throw new Error(`找不到 SVG: ${src}`);
  const raw = readFileSync(p, 'utf8')
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .trim()
    .replace(/<svg([^>]*)>/, (m, attrs) => `<svg class="${cls}"${attrs}>`);
  return raw;
}

/** 文本值归一化：字符串 → {zh,en}；对象 → 补齐缺语 */
function norm(v) {
  if (v == null) return { zh: '', en: '' };
  if (typeof v === 'string' || typeof v === 'number') return { zh: String(v), en: '' };
  return { zh: String(v.zh ?? ''), en: String(v.en ?? '') };
}
/** 双语渲染：两语都输出，由 CSS 按 data-lang 显隐——lang 切换不改 HTML */
function t(v, cls = '') {
  const { zh, en } = norm(v);
  if (!zh && !en) return '';
  const c = cls ? ` ${cls}` : '';
  return `<span class="zh${c}">${esc(zh)}</span>` +
    (en ? `<span class="bi-en${c}">${esc(en)}</span>` : '');
}
/** 双语块级渲染（en 另起一行）；\n 转 <br> 供标题断行使用 */
function tb(v, cls = '') {
  const { zh, en } = norm(v);
  const c = cls ? ` ${cls}` : '';
  const br = (s) => esc(s).replace(/\r?\n/g, '<br/>');
  let out = zh ? `<span class="zh${c}">${br(zh)}</span>` : '';
  if (en) out += `<span class="bi-en${c}">${br(en)}</span>`;
  return out;
}

/* ---------------- 主题解析（themes.md 为唯一权威，防漂移） ---------------- */
export function loadThemes() {
  const md = readFileSync(join(SKILL, '_shared', 'themes.md'), 'utf8');
  const themes = {};
  // 形如: ## 10. 🔧 钢蓝 Steel Blue（工业默认）
  const headRe = /^##\s+(\d+)\.\s*\S*\s*([\u4e00-\u9fff]+)\s+([A-Za-z][A-Za-z ]*?)\s*[（(]/gm;
  let m;
  const marks = [];
  while ((m = headRe.exec(md)) !== null) {
    marks.push({ idx: m.index, en: m[3].trim() });
  }
  const cssRe = /```css\n([\s\S]*?)```/g;
  const cssBlocks = [];
  let c;
  while ((c = cssRe.exec(md)) !== null) cssBlocks.push({ idx: c.index, code: c[1] });
  for (const mk of marks) {
    const block = cssBlocks.find((b) => b.idx > mk.idx);
    if (!block) continue;
    const slug = mk.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const toks = {};
    const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
    let tm;
    while ((tm = re.exec(block.code)) !== null) toks[tm[1]] = tm[2].trim();
    themes[slug] = toks;
  }
  return themes;
}

/* ---------------- 表格渲染 ---------------- */
function renderTable(spec) {
  const cols = spec.cols || [];
  const rows = spec.rows || [];
  const compact = spec.compact ? ' compact' : '';
  const zebra = spec.zebra !== false;
  let h = `<table class="tb${compact}">`;
  if (spec.caption) {
    h += `<caption>${tb(spec.caption)}</caption>`;
  }
  h += '<thead><tr>';
  for (const col of cols) {
    const num = col.num ? ' n' : '';
    h += `<th class="${num.trim()}">${esc(col.k ?? col)}${col.en ? `<span class="bi-en"> ${esc(col.en)}</span>` : ''}</th>`;
  }
  h += '</tr></thead><tbody>';
  rows.forEach((r, i) => {
    const cls = zebra && i % 2 === 1 ? ' class="zebra"' : '';
    h += `<tr${cls}>`;
    r.forEach((cell, j) => {
      const col = cols[j] || {};
      const cls2 = col.num ? ' class="n"' : (col.k ? ' class="k"' : '');
      h += `<td${cls2}>${t(cell)}</td>`;
    });
    h += '</tr>';
  });
  h += '</tbody></table>';
  return h;
}

/* ---------------- 块渲染器 ---------------- */
const R = {
  text(b) {
    const cols = b.cols || 2;
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += `<div class="cols-${cols}">`;
    for (const p of (b.paras || [])) {
      h += `<p class="${norm(p).en ? 'has-en' : ''}">${tb(p)}</p>`;
    }
    if (b.pull) {
      h += `<div class="pull">${tb(b.pull.q)}${b.pull.who ? `<span class="who">${t(b.pull.who)}</span>` : ''}</div>`;
    }
    h += '</div>';
    return h;
  },

  grades(b) {
    const cards = b.cards || [];
    const cols = b.cols || 3;
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += `<div class="grade-grid${cols === 2 ? ' c2' : ''}">`;
    for (const g of cards) {
      h += '<div class="grade-card">';
      h += `<div class="head"><div class="code">${esc(g.code)}${g.code_en ? `<span class="en">${esc(g.code_en)}</span>` : ''}</div></div>`;
      if (g.name) h += `<div class="nm">${tb(g.name)}</div>`;
      if (g.rows && g.rows.length) {
        h += '<dl>';
        for (const [k, v] of g.rows) h += `<dt>${esc(k)}</dt><dd>${t(v)}</dd>`;
        h += '</dl>';
      }
      if (g.badges && g.badges.length) {
        h += '<div class="badges">' + g.badges.map((x) => `<span class="tag ghost">${t(x)}</span>`).join('') + '</div>';
      }
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  table(b) {
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    for (const tspec of (b.tables || [])) h += renderTable(tspec);
    if (b.note) h += `<p style="font-size:var(--fs-small);color:var(--muted);margin-top:3mm">${tb(b.note)}</p>`;
    return h;
  },

  twin(b) {
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += `<div class="twin${b.wideLeft ? ' wide-left' : ''}">`;
    for (const tspec of (b.tables || [])) h += renderTable(tspec);
    h += '</div>';
    return h;
  },

  flow(b) {
    const steps = b.steps || [];
    // cols:2 让纵向流程分两栏——6 步以上单栏排下来只占半页，两栏才撑得住一个对开
    const v = (b.dir === 'v' ? ' v' : '') + (b.dir === 'v' && b.cols === 2 ? ' cols2' : '');
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += `<div class="flow${v}">`;
    steps.forEach((s, i) => {
      h += '<div class="step">';
      h += `<span class="no">${String(i + 1).padStart(2, '0')}</span>`;
      h += `<span class="tt">${tb(s.title)}</span>`;
      if (s.desc) h += `<div class="dd">${tb(s.desc)}</div>`;
      h += '</div>';
    });
    h += '</div>';
    return h;
  },

  chart(b) {
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += '<div class="chart-pair">';
    if (b.bars) {
      h += '<div class="bars">';
      for (const r of (b.bars.rows || [])) {
        h += `<div class="row" style="--v:${Number(r.v) || 0};--max:${Number(b.bars.max) || 100}">` +
          `<span class="lb">${tb(r.label)}</span>` +
          `<span class="track"><span class="fill"></span></span>` +
          `<span class="val">${esc(r.val ?? r.v)}</span></div>`;
      }
      h += '</div>';
    }
    if (b.donut) {
      h += '<div class="donut-wrap"><div class="donut" style="--v:' +
        `${Number(b.donut.v) || 0};--max:${Number(b.donut.max) || 100}">` +
        `<b>${esc(b.donut.label ?? '')}</b></div><div class="donut-legend">`;
      for (const li of (b.donut.legend || [])) {
        const sw = li.s ? ` s${li.s}` : '';
        h += `<div class="li"><span class="sw${sw}"></span><span>${tb(li.k)}</span><span class="val">${esc(li.v)}</span></div>`;
      }
      h += '</div></div>';
    }
    if (b.nums && b.nums.length) {
      h += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6mm">';
      for (const n of b.nums) {
        h += `<div class="big-num"><b>${esc(n.v)}</b><span class="lb">${tb(n.label)}</span></div>`;
      }
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  image(b) {
    const full = b.mode === 'full';
    if (full) {
      return `<div class="bleed-img"><img src="${esc(b.src)}" alt="${esc(norm(b.caption).zh)}" />` +
        (b.caption ? `<div class="fig-cap">${b.no ? `<span class="no">${esc(b.no)}</span>` : ''}${tb(b.caption)}</div>` : '') +
        '</div>';
    }
    return `<figure class="fig-plate"><img src="${esc(b.src)}" alt="${esc(norm(b.caption).zh)}" />` +
      (b.caption ? `<figcaption>${b.no ? `${esc(b.no)} ` : ''}${tb(b.caption)}</figcaption>` : '') +
      '</figure>';
  },

  svg(b) {
    const cap = b.caption
      ? `<figcaption>${b.no ? `${esc(b.no)} ` : ''}${tb(b.caption)}</figcaption>`
      : '';
    return `<figure class="fig-plate fig-svg">${inlineSvg(b.src, 'fig-svg-el')}${cap}</figure>`;
  },

  stats(b) {
    const cells = b.cells || [];
    const n = b.cols || cells.length;
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += `<div class="stat-band${n === 3 ? ' c3' : n === 5 ? ' c5' : ''}">`;
    for (const c of cells) {
      h += `<div class="cell"><b>${esc(c.v)}</b><span class="lb">${tb(c.label)}</span></div>`;
    }
    h += '</div>';
    return h;
  },

  certs(b) {
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += '<div class="cert-grid">';
    for (const c of (b.cells || [])) {
      h += `<div class="cert-cell"><div class="code">${esc(c.code)}</div><div class="nm">${tb(c.name)}</div></div>`;
    }
    h += '</div>';
    return h;
  },

  timeline(b) {
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += '<div class="tl">';
    for (const e of (b.events || [])) {
      h += `<div class="ev"><div class="yr">${esc(e.yr)}</div><div class="tt">${tb(e.title)}</div>` +
        (e.desc ? `<div class="dd">${tb(e.desc)}</div>` : '') + '</div>';
    }
    h += '</div>';
    return h;
  },

  contact(b) {
    let h = '';
    if (b.title) h += `<div class="blk-title">${b.idx ? `<span class="idx">${esc(b.idx)}</span>` : ''}${tb(b.title)}</div>`;
    h += '<div class="contact-grid">';
    for (const col of (b.cols || [])) {
      h += '<div>';
      if (col.title) h += `<div class="blk-title">${tb(col.title)}</div>`;
      h += '<div class="contact-list">';
      for (const r of (col.rows || [])) {
        h += `<div class="row"><span class="k">${esc(r.k)}</span><span class="v">${tb(r.v)}</span></div>`;
      }
      h += '</div></div>';
    }
    h += '</div>';
    if (b.sign) {
      h += `<div class="sign"><b>${tb(b.sign.name)}</b>${tb(b.sign.line)}</div>`;
    }
    return h;
  }
};

/* ---------------- 页面外壳 ---------------- */
function foot(meta, pageNo) {
  return `<div class="page-foot"><span>${esc(meta.footer || meta.doc_no || '')}</span>` +
    `<span class="num">${pageNo != null ? `P.${String(pageNo).padStart(2, '0')}` : ''}</span></div>`;
}

function page(side, inner, pageNo, meta) {
  return `<div class="page ${side}">${inner}${foot(meta, pageNo)}</div>`;
}

/** 全出血图对开：图铺满含出血的整个对开，图注落在成品安全区内 */
function imageSpread(meta, sp, spreadIdx, pageNo) {
  const b = (sp.blocks || [])[0];
  const cap = b.caption
    ? `<div class="fig-cap">${b.no ? `<span class="no">${esc(b.no)}</span>` : ''}${tb(b.caption)}</div>`
    : '';
  return `<section class="spread" id="${esc(sp.id || 'sp-' + spreadIdx)}" data-layout="${esc(sp.layout)}">` +
    `<div class="bleed-img"><img src="${esc(b.src)}" alt="${esc(norm(b.caption).zh)}" />${cap}</div>` +
    `<div class="page-foot foot-l"><span>${esc(meta.footer || meta.doc_no || '')}</span><span class="num">P.${String(pageNo).padStart(2, '0')}</span></div>` +
    `<div class="page-foot foot-r"><span></span><span class="num">P.${String(pageNo + 1).padStart(2, '0')}</span></div>` +
    '</section>';
}

/** 跨对开内容页：pane 直接挂在 .spread 下，避免被 .page 的 overflow:hidden 裁掉 */
function fullSpread(meta, sp, spreadIdx, pageNo) {
  let inner = `<div class="pane full"><div class="fold-guide"></div>`;
  if (sp.title) inner += `<div class="blk-title">${sp.idx ? `<span class="idx">${esc(sp.idx)}</span>` : ''}${tb(sp.title)}</div>`;
  for (const b of (sp.blocks || [])) {
    const fn = R[b.type];
    if (!fn) throw new Error(`未知块类型: ${b.type}（spread #${spreadIdx}）`);
    inner += fn(b);
  }
  inner += '</div>';
  return `<section class="spread" id="${esc(sp.id || 'sp-' + spreadIdx)}" data-layout="${esc(sp.layout)}">` +
    inner +
    `<div class="page-foot foot-l"><span>${esc(meta.footer || meta.doc_no || '')}</span><span class="num">P.${String(pageNo).padStart(2, '0')}</span></div>` +
    `<div class="page-foot foot-r"><span></span><span class="num">P.${String(pageNo + 1).padStart(2, '0')}</span></div>` +
    '</section>';
}

function contentSpread(meta, sp, spreadIdx, pageNo) {
  const side = sp.side || 'both';
  if (side === 'both') {
    const blocks = sp.blocks || [];
    if (blocks.length === 1 && blocks[0].type === 'image' && blocks[0].mode === 'full') {
      return imageSpread(meta, sp, spreadIdx, pageNo);
    }
    return fullSpread(meta, sp, spreadIdx, pageNo);
  }

  let paneCls = 'pane';
  if (side === 'left') paneCls += ' single-left';
  else if (side === 'right') paneCls += ' single-right';

  const blocks = sp.blocks || [];
  let inner = `<div class="${paneCls}">`;
  if (sp.title) inner += `<div class="blk-title">${sp.idx ? `<span class="idx">${esc(sp.idx)}</span>` : ''}${tb(sp.title)}</div>`;
  for (const b of blocks) {
    const fn = R[b.type];
    if (!fn) throw new Error(`未知块类型: ${b.type}（spread #${spreadIdx}）`);
    inner += fn(b);
  }
  inner += '</div>';

  const leftInner = (side === 'right') ? '' : inner;
  const rightInner = (side === 'left') ? '' : inner;
  return `<section class="spread" id="${esc(sp.id || 'sp-' + spreadIdx)}" data-layout="${esc(sp.layout)}">` +
    page('left', leftInner, pageNo, meta) +
    page('right', rightInner, pageNo + 1, meta) +
    '</section>';
}

function coverSpread(meta, spreadIdx) {
  const cov = meta.cover || {};
  const kind = norm(cov.kind);
  // 品牌标识同样走内联：SVG 里若不内联，字会掉成系统字体，送印 PDF 里就多一套
  const logo = /\.svg$/i.test(meta.logo || '')
    ? inlineSvg(meta.logo || 'images/logo-placeholder.svg', 'cov-logo')
    : `<img class="cov-logo" src="${esc(meta.logo || 'images/logo-placeholder.svg')}" alt="logo" />`;
  const left =
    logo +
    `<div class="cov-meta cov-kind">${t(kind)}</div>` +
    `<div class="cov-doc">${esc(meta.doc_no || '')}</div>` +
    (meta.company
      ? `<div class="cov-org"><div class="nm">${tb(meta.company)}</div>` +
        (meta.org_line ? `<div class="tl">${tb(meta.org_line)}</div>` : '') + '</div>'
      : '') +
    `<div class="cov-mist"></div>`;
  const right =
    `<div class="cov-meta cov-kind" style="top:var(--ink-top);right:var(--ink-outer)">${esc(meta.year || '')}</div>` +
    `<div class="cov-year">${esc(meta.year || '')}</div>` +
    `<div class="cov-title">${tb(cov.title || meta.title)}</div>` +
    (cov.sub ? `<div class="cov-sub">${tb(cov.sub)}</div>` : '') +
    (cov.stats && cov.stats.length
      ? `<div class="cov-stats">` + cov.stats.map((s) =>
          `<div class="st"><b>${esc(s.v)}</b><span>${tb(s.label)}</span></div>`).join('') + '</div>'
      : '') +
    `<div class="cov-line"></div><div class="cov-mist"></div>`;
  return `<section class="spread" id="sp-cover">${page('left', left, null, meta)}${page('right', right, null, meta)}</section>`;
}

function tocSpread(meta, sections, startPage) {
  let h = `<div class="toc-wrap"><div class="toc-title">${tb(meta.toc_title || { zh: '目录', en: 'Contents' })}</div><div class="toc-cols">`;
  for (const s of sections) {
    const pg = s._startPage != null ? String(s._startPage).padStart(2, '0') : '—';
    // 章与子目包成一组，换栏时不会被拆开
    h += '<div class="toc-group">';
    h += `<div class="toc-item"><span class="no">${esc(s.no || '')}</span>` +
      `<span class="tt">${tb(s.title)}</span><span class="pg">${pg}</span></div>`;
    // 二级条目用章号.序号，页码取该对开的起始页
    (s._spreads || []).forEach((sp, i) => {
      const sub = `${s.no ? Number(s.no) : ''}.${i + 1}`;
      h += `<div class="toc-item sub"><span class="no">${esc(sub)}</span>` +
        `<span class="tt">${tb(sp.title)}</span>` +
        `<span class="pg">${String(sp.page).padStart(2, '0')}</span></div>`;
    });
    h += '</div>';
  }
  h += '</div></div>';
  // 右页：目录不塞正文，但短文档留一整页空白不合适——放文件信息（meta.toc_panel 可选）
  const tp = meta.toc_panel;
  const panel = tp
    ? `<div class="toc-panel"><div class="toc-panel-title">${tb(tp.title || { zh: '文件信息', en: 'Document control' })}</div>` +
      (tp.rows || []).map((r) => `<div class="prow"><span class="k">${tb(r.k)}</span><span class="v">${tb(r.v)}</span></div>`).join('') +
      (tp.note ? `<div class="pnote">${tb(tp.note)}</div>` : '') + '</div>'
    : '';
  return `<section class="spread" id="sp-toc">${page('left', h, startPage, meta)}${page('right', panel, startPage + 1, meta)}</section>`;
}

function sectionOpenerSpread(meta, sec, pageNo) {
  const guide = sec.guide || [];
  const left =
    `<div class="sec-open"><div class="no">SECTION ${esc(sec.no || '')}</div>` +
    `<h2>${tb(sec.title)}</h2>` +
    (sec.lede ? `<div class="lede">${tb(sec.lede)}</div>` : '') +
    '</div><div class="cov-mist"></div>';
  const right =
    `<div class="sec-open" style="top:60mm"><div class="no">${esc(sec.no || '')}</div>` +
    `<h2 style="font-size:26pt;color:var(--accent)">${tb(sec.title_en || sec.title)}</h2></div>` +
    (guide.length
      ? `<div class="pane" style="top:132mm"><div class="blk-title">${tb({ zh: '本章内容', en: 'In this section' })}</div>` +
        guide.map((g) => `<div class="toc-item"><span class="no">${esc(g.no || '')}</span><span class="tt">${tb(g.title)}</span></div>`).join('') +
        '</div>'
      : '') +
    // 底带两页都要有，只给左页会在折线上断成两截
    '<div class="cov-mist"></div>';
  return `<section class="spread" id="sp-${esc(sec.id)}-open">${page('left', left, pageNo, meta)}${page('right', right, pageNo + 1, meta)}</section>`;
}

function dividerSpread(meta, d, pageNo) {
  const left =
    `<div class="divider"><div class="big">${esc(d.no || '')}</div>` +
    `<div class="tt">${tb(d.title)}</div>` +
    (d.title_en ? `<div class="en">${esc(d.title_en)}</div>` : '') +
    '</div><div class="cov-mist"></div>';
  const right = `<div class="pane" style="top:120mm">${d.note ? `<div class="lede" style="font-size:11pt;color:var(--muted);max-width:120mm">${tb(d.note)}</div>` : ''}</div>`;
  return `<section class="spread" id="sp-divider-${esc(d.no || 'x')}">${page('left', left, pageNo, meta)}${page('right', right, pageNo + 1, meta)}</section>`;
}
export function build(content, opts = {}) {
  const themes = loadThemes();
  const themeName = content.meta.theme || 'steel-blue';
  const theme = themes[themeName];
  if (!theme) {
    throw new Error(`主题不存在: ${themeName}（可用: ${Object.keys(themes).join(', ')}）`);
  }
  const warnings = [];
  const paper = PAPERS[opts.paper || 'a4'];

  // 收集 spread 序列
  const seq = [];
  seq.push({ kind: 'cover' });
  const sections = content.sections || [];
  if (content.toc !== false) seq.push({ kind: 'toc' });

  for (const sec of sections) {
    seq.push({ kind: 'open', sec });
    for (const sp of (sec.spreads || [])) seq.push({ kind: 'content', sp, sec });
    if (sec.endDivider) seq.push({ kind: 'divider', d: sec.endDivider });
  }
  for (const d of (content.dividers || [])) seq.push({ kind: 'divider', d });

  // 页码：封面不编页
  let pageNo = 1;
  for (const item of seq) {
    if (item.kind === 'cover') { item.pageNo = null; pageNo += 2; continue; }
    item.pageNo = pageNo;
    pageNo += 2;
  }
  // section 起始页
  for (const item of seq) {
    if (item.kind === 'open') { item.sec._startPage = item.pageNo; item.sec._spreads = []; }
  }
  // 二级条目：目录要能翻到具体对开，只有章名的话短文档会翻出一整页空白
  for (const item of seq) {
    if (item.kind !== 'content') continue;
    const sp = item.sp;
    const t = sp.title || (sp.blocks || [])[0]?.title || sp.id;
    if (t) item.sec._spreads.push({ title: t, page: item.pageNo });
  }

  const meta = content.meta;
  const CROP_MARKS = ['tl-h', 'tl-v', 'tr-h', 'tr-v', 'bl-h', 'bl-v', 'br-h', 'br-v', 'fold-t', 'fold-b']
    .map((c) => `<div class="crop ${c}"></div>`).join('');
  const spreads = seq.map((item, i) => {
    let h;
    switch (item.kind) {
      case 'cover': h = coverSpread(meta, i); break;
      case 'toc': h = tocSpread(meta, sections, item.pageNo); break;
      case 'open': h = sectionOpenerSpread(meta, item.sec, item.pageNo); break;
      case 'divider': h = dividerSpread(meta, item.d, item.pageNo); break;
      default: h = contentSpread(meta, item.sp, i, item.pageNo); break;
    }
    // 每个对开注入出血区裁切标记 + 折线标记（打印可见，屏幕隐藏）
    return h.replace(/(<section class="spread"[^>]*>)/, (_m, g1) => g1 + CROP_MARKS);
  }).join('\n');

  const themeCss = ':root{\n' + Object.entries(theme)
    .map(([k, v]) => `  --${k}: ${v};`).join('\n') + '\n}\n';
  const paperCss = ':root{\n' + Object.entries(paper)
    .map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}\n';

  const tpl = readFileSync(join(TPL, 'assets', 'template.html'), 'utf8');
  let blocksCss = readFileSync(join(TPL, 'assets', 'blocks.css'), 'utf8');
  // @page size 按纸张口径动态替换（CSS 里是 a4 默认值；@page 不支持 var()）
  blocksCss = blocksCss.replace(/@page\s*{\s*size:\s*[\d.]+mm\s+[\d.]+mm/, `@page { size: ${paper.page}`);

  const html = tpl
    .replace('/*__THEME_TOKENS__*/', () => themeCss + paperCss)
    .replace('/*__BLOCKS_CSS__*/', () => blocksCss)
    .replace('__DOC_TITLE__', () => esc(norm(meta.title).zh || meta.doc_no || 'print'))
    .replace('__LANG__', () => meta.lang || 'zh')
    .replace('__DOC_TYPE__', () => meta.doc || 'catalog')
    .replace('__SPREADS__', () => spreads);

  const pageCount = seq.reduce((n, it) => n + (it.kind === 'cover' ? 0 : 2), 0);
  return { html, warnings, themeName, pageCount, spreadCount: seq.length };
}
/* ---------------- 目录复制（逐文件 copyFileSync，避开宿主环境对 fs.cpSync 的批量操作拦截） ---------------- */
function copyDir(src, dst) {
  if (!existsSync(src)) return 0;
  mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const d = join(dst, name);
    if (statSync(s).isDirectory()) n += copyDir(s, d);
    else { copyFileSync(s, d); n++; }
  }
  return n;
}

async function main() {
  const args = process.argv.slice(2);
  const paperIdx = args.indexOf('--paper');
  const paper = paperIdx > -1 ? args[paperIdx + 1] : 'a4';
  const pos = args.filter((a, i) => !a.startsWith('--') && !(paperIdx > -1 && i === paperIdx + 1));
  if (pos.length < 2) {
    console.error('用法: node build.mjs <content.json> <out.html> [--paper a4|cn16] [--single]');
    process.exit(2);
  }
  const [src, out] = pos;
  if (!existsSync(src)) { console.error(`找不到内容文件: ${src}`); process.exit(2); }
  ASSET_ROOT = dirname(resolve(src));   // 内联 SVG 按内容 JSON 所在目录找 images/
  const content = JSON.parse(readFileSync(src, 'utf8'));

  let res;
  try {
    res = build(content, { paper });
  } catch (e) {
    console.error(`构建失败: ${e.message}`);
    process.exit(1);
  }

  const outPath = resolve(out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, res.html, 'utf8');

  // 字体本地化：生成物旁必须有 ./fonts/（@font-face 相对路径），保证打印内嵌
  let fontWarn = '';
  try {
    const fontsSrc = join(SKILL, '_shared', 'fonts');
    const fontsDst = join(dirname(outPath), 'fonts');
    if (existsSync(fontsSrc)) {
      const n = copyDir(fontsSrc, fontsDst);
      console.log(`  字体已同步: ${fontsDst}（${n} 个文件）`);
    }
  } catch (e) {
    fontWarn = `字体目录同步失败（${e.message}）——请手工把 <skill>/_shared/fonts/ 复制到产物旁，否则打印会掉字体`;
  }
  // 图片目录（内容 JSON 引用 images/ 时）
  try {
    const imgSrc = join(dirname(resolve(src)), 'images');
    const imgDst = join(dirname(outPath), 'images');
    if (existsSync(imgSrc) && resolve(imgSrc) !== resolve(imgDst)) {
      copyDir(imgSrc, imgDst);
    }
  } catch (e) {
    fontWarn += `｜图片目录同步失败（${e.message}）`;
  }

  console.log(`OK ${outPath} · 主题 ${res.themeName} · ${res.spreadCount} 对开（含封面，共 ${res.spreadCount * 2} 页）/ 内容页 ${res.pageCount}`);
  for (const w of res.warnings) console.log(`  ⚠ ${w}`);

  // --single：字体子集化 + 图片全部内嵌为 data URI，产出真正的一个文件
  if (args.includes('--single')) {
    console.log('  内嵌资产（字体子集化 + 图片 base64）…');
    const { inlineAssets } = await import(new URL('../../../_shared/inline-fonts.mjs', import.meta.url));
    inlineAssets(outPath, { replace: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(HERE, 'build.mjs')) {
  main().catch((e) => { console.error(`构建失败: ${e.message}`); process.exit(1); });
}
