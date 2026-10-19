#!/usr/bin/env node
/**
 * build.mjs — E · 单页作品集风 构建脚本
 * 用法: node build.mjs <content.json> <out.html> [--paper a4|cn16] [--lang zh|en|bi] [--theme slug] [--single]
 *
 * 与 D 的差别：D 以「对开」（spread）为单位，E 以「单页」（sheet）为单位。
 * 一个 .sheet = 一个印刷页 = 216×303mm（A4 210×297 + 四缘 3mm 出血）。
 *
 * 零依赖，Node >= 18
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TPL = resolve(HERE, '..');            // templates/E-portfolio
const SKILL = resolve(TPL, '../..');        // skill root

/* ---------------- 纸张口径 ---------------- */
export const PAPERS = {
  a4:   { trimW: 210, trimH: 297, sheetW: 216, sheetH: 303 },
  cn16: { trimW: 216, trimH: 291, sheetW: 222, sheetH: 297 }
};

/** 页面类型与块类型：validate.mjs 共用 */
export const PAGE_TYPES = ['cover', 'contents', 'section', 'grade', 'tablepage', 'gallery', 'contact'];
export const BLOCK_TYPES = [
  'text', 'table', 'twin', 'note', 'kv', 'dash', 'dashgroups',
  'adv', 'photos', 'photo', 'bleed', 'chips', 'twocol', 'spacer'
];

/* ---------------- 基础工具 ---------------- */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const isPair = (v) => v && typeof v === 'object' && !Array.isArray(v) &&
  ('zh' in v || 'en' in v);

/**
 * 文本渲染。
 * 字符串 = 单语字面量，原样输出（不挂语言 class）——这一条是对 D 的修正：
 * D 把字符串默认当中文，lang=en 时会被 CSS 整段隐藏，英文稿会凭空消失。
 * 对象 {zh,en} 才走双语显隐；只给一侧时按单语输出。
 */
function tx(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return esc(String(v));
  if (!isPair(v)) return esc(String(v));
  const zh = String(v.zh ?? '').trim();
  const en = String(v.en ?? '').trim();
  if (zh && en) return `<span class="zh">${esc(zh)}</span><span class="bi-en">${esc(en)}</span>`;
  return esc(zh || en);
}
/** 块级文本：\n 转 <br/>（封面标题断行用） */
function tblock(v) {
  if (!isPair(v)) return tx(v);
  const br = (s) => esc(String(s ?? '').trim()).replace(/\r?\n/g, '<br/>');
  const zh = br(v.zh), en = br(v.en);
  if (zh && en) return `<span class="zh">${zh}</span><span class="bi-en">${en}</span>`;
  return zh || en;
}
/** 纯文本取值（用于 <title>、alt 等属性） */
function plain(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return String(v.en || v.zh || '');
}

/* ---------------- 颜色：派生 E 专属 token ---------------- */
function hex2rgb(h) {
  const s = String(h || '').replace('#', '');
  const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
const rgb2hex = (r) => '#' + r.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A.map((v, i) => v + (B[i] - v) * t));
}

/* ---------------- 主题解析（themes.md 唯一权威） ---------------- */
export function loadThemes() {
  const md = readFileSync(join(SKILL, '_shared', 'themes.md'), 'utf8');
  const themes = {};
  const headRe = /^##\s+(\d+)\.\s*\S*\s*([\u4e00-\u9fff]+)\s+([A-Za-z][A-Za-z ]*?)\s*[（(]/gm;
  let m;
  const marks = [];
  while ((m = headRe.exec(md)) !== null) marks.push({ idx: m.index, en: m[3].trim() });
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

/** E 需要的派生 token：主题里没写就按主色算，写了就用主题的 */
function withDerived(t) {
  const out = { ...t };
  out['ink'] = t['ink'] || t['fg'];
  out['steel'] = t['steel'] || t['muted'];
  out['tint'] = t['tint'] || mix(t['surface'] || '#ffffff', t['accent'] || '#1c4f8c', 0.06);
  out['accent-soft'] = t['accent-soft'] || mix(t['accent'] || '#1c4f8c', '#ffffff', 0.55);
  out['zebra'] = t['zebra'] || mix(t['surface'] || '#ffffff', t['fg'] || '#111111', 0.035);
  return out;
}

/* ---------------- 块渲染 ---------------- */
const CROP_MARKS = ['tl-h', 'tl-v', 'tr-h', 'tr-v', 'bl-h', 'bl-v', 'br-h', 'br-v']
  .map((c) => `<div class="crop ${c}"></div>`).join('');

function renderTable(spec) {
  const cols = spec.cols || [];
  const rows = spec.rows || [];
  const size = spec.size === 'xs' ? ' tbl-xs' : spec.size === 'sm' ? ' tbl-sm' : '';
  const cls = spec.cls ? ` ${spec.cls}` : '';
  const headStyle = spec.head || '';   // 'ovtbl' 等
  let h = `<table class="tbl${size}${cls}">`;
  h += '<thead><tr>';
  for (const col of cols) {
    const label = typeof col === 'string' ? col : (col.k ?? col.label ?? '');
    h += `<th>${tx(label)}</th>`;
  }
  h += '</tr></thead><tbody>';
  for (const r of rows) {
    h += '<tr>';
    r.forEach((cell, j) => {
      const isRowhead = (spec.first === 'col' && j === 0) || spec.rowhead === true;
      h += `<td${isRowhead ? ' class="rowhead"' : ''}>${tx(cell)}</td>`;
    });
    h += '</tr>';
  }
  h += '</tbody></table>';
  return h;
}

const B = {
  text(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    const cls = b.lead ? 'lead body' : 'body';
    for (const p of (b.paras || [])) h += `<p class="${cls}">${tx(p)}</p>`;
    return h;
  },

  table(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    h += renderTable(b);
    if (b.note) h += `<div class="note">${tx(b.note)}</div>`;
    return h;
  },

  twin(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    h += '<div class="twocol">';
    for (const it of (b.items || b.tables || [])) {
      h += '<div>';
      if (it.head) h += `<div class="gh">${tx(it.head)}</div>`;
      h += renderTable(it);
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  note(b) {
    let h = '<div class="note">';
    if (b.title) h += `<span class="nt">${tx(b.title)}</span> `;
    h += tx(b.text);
    h += '</div>';
    return h;
  },

  kv(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    h += '<div class="kv">';
    for (const k of (b.items || [])) {
      h += `<div class="k"><div class="n">${esc(k.n ?? k.v ?? '')}</div>` +
        (k.d ? `<div class="d">${tx(k.d)}</div>` : '') + '</div>';
    }
    h += '</div>';
    return h;
  },

  dash(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    h += `<ul class="dash${b.compact ? ' compact' : ''}">`;
    for (const li of (b.items || [])) h += `<li>${tx(li)}</li>`;
    h += '</ul>';
    return h;
  },

  dashgroups(b) {
    const cols = b.cols || 2;
    let h = `<div class="${cols === 3 ? 'threecol' : 'twocol'}">`;
    const groups = b.groups || [];
    const per = Math.ceil(groups.length / cols);
    for (let c = 0; c < cols; c++) {
      h += '<div>';
      for (const g of groups.slice(c * per, (c + 1) * per)) {
        h += `<div class="cat-head">${tx(g.head)}</div>`;
        h += `<ul class="dash${b.compact ? ' compact' : ''}" style="margin-top:1.6mm">`;
        for (const li of (g.items || [])) h += `<li>${tx(li)}</li>`;
        h += '</ul>';
      }
      h += '</div>';
    }
    h += '</div>';
    if (b.note) h += `<div class="note" style="margin-top:4mm">${tx(b.note)}</div>`;
    return h;
  },

  adv(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    for (const a of (b.items || [])) {
      h += `<div class="adv"><div class="no">${esc(a.no || '')}</div><div>` +
        `<div class="tt">${tx(a.t)}</div><p>${tx(a.p)}</p></div></div>`;
    }
    return h;
  },

  photos(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    h += `<div class="photos c${b.cols === 2 ? 2 : 3}">`;
    for (const it of (b.items || [])) {
      h += `<div class="cell"><img src="${esc(it.src)}" alt="${esc(plain(it.cap))}" />` +
        (it.cap ? `<div class="cap"><b>${tx(it.cap)}</b>${it.sub ? `<span>${tx(it.sub)}</span>` : ''}</div>` : '') +
        '</div>';
    }
    h += '</div>';
    return h;
  },

  photo(b) {
    const cap = b.cap ? `<div class="cap">${tx(b.cap)}</div>` : '';
    // fill:true = 吃掉页面剩余高度（E 的收尾手法）；否则按图片自身比例排
    if (b.fill === true) {
      return `<div class="fill-photo${b.frame === false ? ' bare' : ''}">` +
        `<img src="${esc(b.src)}" alt="${esc(plain(b.cap))}" />${cap}</div>`;
    }
    return `<div class="photo-box"><img src="${esc(b.src)}" alt="${esc(plain(b.cap))}" />${cap}</div>`;
  },

  bleed(b) {
    return `<div class="bleed-figure"><img src="${esc(b.src)}" alt="${esc(plain(b.cap))}" />` +
      (b.cap ? `<div class="cap">${tx(b.cap)}</div>` : '') + '</div>';
  },

  chips(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    h += '<div class="chips">';
    for (const it of (b.items || [])) {
      const code = typeof it === 'string' ? it : (it.code || '');
      const name = typeof it === 'string' ? '' : it.name;
      h += `<span class="chip">${esc(code)}${name ? `<span style="font-weight:400;letter-spacing:0"> · ${tx(name)}</span>` : ''}</span>`;
    }
    h += '</div>';
    return h;
  },

  twocol(b) {
    let h = '';
    if (b.head) h += `<div class="gh">${tx(b.head)}</div>`;
    h += '<div class="twocol">';
    for (const it of (b.items || [])) {
      h += '<div>';
      if (it.head) h += `<div class="gh">${tx(it.head)}</div>`;
      if (it.text) h += `<p class="mini">${tx(it.text)}</p>`;
      if (it.paras) for (const p of it.paras) h += `<p class="mini">${tx(p)}</p>`;
      h += '</div>';
    }
    h += '</div>';
    return h;
  },

  /* 竖向分配：内容撑不满时，把剩余高度放在这里，而不是留给页脚上方。
     grow 是权重（默认 1），min 是最小高度（默认 6mm）。 */
  spacer(b) {
    const grow = Number(b.grow) || 1;
    const min = b.min || '6mm';
    return `<div class="spacer" style="--grow:${grow};--min:${min}"></div>`;
  }
};

/* ---------------- 块包装 ----------------
   每个块包一层 .blk，让页面正文的 flex 只处理「块与块」的间距；
   段落留在块内部按自己的段距排，不会被当成可分配的间隙。
   托底图（photo fill）与 spacer 带 flex 增长，其余块按内容高度占位。 */
function wrap(b, html) {
  if (b.type === 'spacer') return html;
  const grow = b.type === 'photo' && b.fill === true ? ' fill' : '';
  return `<div class="blk b-${b.type}${grow}">${html}</div>`;
}

/* ---------------- 页眉 / 页脚 ---------------- */
function brandHtml(meta) {
  const nm = meta.brand || '';
  const ac = meta.brand_accent ? ` <em>${tx(meta.brand_accent)}</em>` : '';
  return `${tx(nm)}${ac}`;
}

function header(meta, page) {
  const label = page.label || page.title || '';
  return `<div class="ph"><div class="brand">${brandHtml(meta)}</div>` +
    `<div class="sec">${tx(label)}</div></div>`;
}

function footer(meta, page, n, total) {
  const mid = page.footer_mid ? tx(page.footer_mid) : '';
  return `<div class="pf"><div>${tx(meta.legal || '')}</div>` +
    `<div class="mid">${mid}</div>` +
    `<div class="num">Page ${n} / ${total}</div></div>`;
}

/** 正文容器：竖向分配策略
 *  - 显式 valign 优先（top / center / bottom / distribute）
 *  - 有托底图（photo fill）或 spacer：顶部起排，剩余高度由它们吸收，不额外分配
 *  - 没有吸收块：块数 ≥4 用 distribute（剩余高度摊进块间，不留页尾大洞）
 *                   块数 1–3 用 center（上下各留一半，比顶对齐+页尾空洞稳）
 *  这是编译期决策：静态 HTML 量不到真实高度，与其猜，不如按块数给一个确定的默认，
 *  作者随时可以用 valign 覆盖。
 */
function bodyCls(page) {
  const v = page.valign;
  if (v === 'center') return 'page-body v-center';
  if (v === 'bottom') return 'page-body v-bottom';
  if (v === 'top') return 'page-body';
  if (v === 'distribute') return 'page-body v-distribute';
  // 表页没有 blocks，用 tables 当块数；否则永远算 0，分配策略失效
  const blocks = page.blocks || page.tables || [];
  const absorbing = page.image || blocks.some((b) => (b.type === 'photo' && b.fill === true) || b.type === 'spacer');
  if (absorbing) return 'page-body';
  if (blocks.length >= 4) return 'page-body v-distribute';
  if (blocks.length > 0) return 'page-body v-center';
  return 'page-body';
}

function sheet(html, n, cls = '') {
  // 单数页 = 右页（recto），订口在左；双数页 = 左页（verso），订口在右。
  // 装订成册后只有这一种配对是对的，横幅渐变按它镜像，见 blocks.css。
  const side = n % 2 === 1 ? 'recto' : 'verso';
  return `<section class="sheet${cls ? ' ' + cls : ''}" id="p-${String(n).padStart(2, '0')}" data-page="${n}" data-side="${side}">` +
    CROP_MARKS + html + '</section>';
}

/* ---------------- 各类页面 ---------------- */
function pageCover(meta, n) {
  const c = meta.cover || {};
  const img = c.image || meta.cover_image;
  return `<section class="sheet sheet-cover${img ? ' has-img' : ''}" id="p-${String(n).padStart(2, '0')}" data-page="${n}" data-side="recto">` +
    CROP_MARKS +
    (img ? `<img class="cover-img" src="${esc(img)}" alt="" />` : '') +
    (img ? '<div class="cover-scrim"></div>' : '') +
    `<div class="cover-top"><div class="cover-brand">${brandHtml(meta)}</div>` +
    (meta.legal ? `<div class="cover-legal">${tx(meta.legal)}</div>` : '') + '</div>' +
    '<div class="cover-block">' +
    '<div class="cover-rule"></div>' +
    `<div class="cover-title">${tblock(c.title || meta.title || '')}</div>` +
    (c.sub ? `<div class="cover-sub">${tblock(c.sub)}</div>` : '') +
    (c.slogan ? `<div class="cover-slogan">${tx(c.slogan)}</div>` : '') +
    '</div>' +
    '<div class="cover-foot">' +
    `<div class="cover-kicker">${tx(c.kicker || '')}</div>` +
    (meta.url ? `<div class="cover-url">${esc(meta.url)}</div>` : '') +
    '</div></section>';
}

function pageContents(meta, page, n, total, pageMap) {
  let head = `<div class="sec-title">${tx(page.title || meta.toc_title || 'Contents')}</div>`;
  if (page.sub) head += `<div class="sec-sub">${tx(page.sub)}</div>`;
  let body = '<div class="toc-cols">';
  const groups = page.groups || [];
  const per = Math.ceil(groups.length / (page.cols || 2));
  const cols = page.cols || 2;
  for (let c = 0; c < cols; c++) {
    body += '<div>';
    for (const g of groups.slice(c * per, (c + 1) * per)) {
      body += `<div class="cat-head" style="margin-top:${c === 0 && g === groups[0] ? 0 : '3mm'}">${tx(g.head)}</div>`;
      for (const it of (g.items || [])) {
        const pg = it.ref && pageMap[it.ref] ? pageMap[it.ref] : (it.page || '');
        body += `<div class="toc-item">` +
          `<span class="no">${esc(it.no || '')}</span>` +
          `<span class="lb">${tx(it.label)}</span>` +
          `<span class="dots"></span>` +
          `<span class="pg">${esc(pg)}</span></div>`;
      }
    }
    body += '</div>';
  }
  body += '</div>';
  if (page.note) body += `<div class="note toc-note">${tx(page.note)}</div>`;
  if (page.image) body += wrap({ type: 'photo', fill: true }, B.photo({ src: page.image, cap: page.image_cap, fill: true }));
  return `<div class="inner">${header(meta, page)}<div class="page-head">${head}</div><div class="${bodyCls(page)}">${body}</div>${footer(meta, page, n, total)}</div>`;
}

function pageSection(meta, page, n, total) {
  let head = '';
  if (page.title) head += `<div class="sec-title">${tx(page.title)}</div>`;
  if (page.sub) head += `<div class="sec-sub">${tx(page.sub)}</div>`;
  if (page.lede) head += `<p class="lead">${tx(page.lede)}</p>`;
  let body = '';
  for (const b of (page.blocks || [])) {
    const fn = B[b.type];
    if (!fn) throw new Error(`未知块类型: ${b.type}（第 ${n} 页）`);
    body += wrap(b, fn(b));
  }
  return `<div class="inner">${header(meta, page)}<div class="page-head">${head}</div><div class="${bodyCls(page)}">${body}</div>${footer(meta, page, n, total)}</div>`;
}

function pageGrade(meta, page, n, total) {
  const bn = page.banner || {};
  const banner = '<div class="grade-banner">' +
    `<div class="g1">${tx(bn.code)}</div>` +
    (bn.family ? `<div class="g2">${tx(bn.family)}</div>` : '') +
    (bn.standards ? `<div class="g3">${tx(bn.standards)}</div>` : '') +
    '</div>';
  let body = '';
  for (const b of (page.blocks || [])) {
    const fn = B[b.type];
    if (!fn) throw new Error(`未知块类型: ${b.type}（第 ${n} 页）`);
    body += wrap(b, fn(b));
  }
  return `<div class="inner has-banner">${banner}<div class="${bodyCls(page)}">${body}</div>` +
    footer(meta, page, n, total) + '</div>';
}

function pageTablepage(meta, page, n, total) {
  let head = '';
  if (page.title) head += `<div class="sec-title" style="font-size:14.5pt">${tx(page.title)}</div>`;
  if (page.sub) head += `<div class="sec-sub">${tx(page.sub)}</div>`;
  let body = '';
  for (const g of (page.tables || [])) {
    // 只有 note 的条目是页脚注释，不是表
    if (g.note && !g.rows) { body += `<div class="blk"><div class="note">${tx(g.note)}</div></div>`; continue; }
    let part = '';
    if (g.head) part += `<div class="cat-head">${tx(g.head)}</div>`;
    part += renderTable({ ...g, size: g.size || 'sm' });
    body += `<div class="blk">${part}</div>`;
  }
  const single = (page.tables || []).filter((g) => g.rows).length === 1 ? ' single' : '';
  return `<div class="inner tblpage${single}">${header(meta, page)}<div class="page-head">${head}</div><div class="${bodyCls(page)}">${body}</div>${footer(meta, page, n, total)}</div>`;
}

function pageGallery(meta, page, n, total) {
  let head = '';
  if (page.title) head += `<div class="sec-title">${tx(page.title)}</div>`;
  if (page.sub) head += `<div class="sec-sub">${tx(page.sub)}</div>`;
  if (page.lede) head += `<p class="lead">${tx(page.lede)}</p>`;
  let body = `<div class="blk">${B.photos({ cols: page.cols || 3, items: page.items || [] })}</div>`;
  if (page.note) body += `<div class="blk"><div class="note">${tx(page.note)}</div></div>`;
  return `<div class="inner">${header(meta, page)}<div class="page-head">${head}</div><div class="${bodyCls(page)}">${body}</div>${footer(meta, page, n, total)}</div>`;
}

function pageContact(meta, page, n, total) {
  let head = '';
  if (page.title) head += `<div class="sec-title">${tx(page.title)}</div>`;
  if (page.sub) head += `<div class="sec-sub">${tx(page.sub)}</div>`;
  if (page.lede) head += `<p class="lead">${tx(page.lede)}</p>`;
  let body = '<div class="contact-grid">';
  for (const col of (page.columns || [])) {
    body += '<div>';
    if (col.head) body += `<div class="gh">${tx(col.head)}</div>`;
    body += '<div class="contact-list">';
    for (const r of (col.rows || [])) {
      body += `<div class="row"><span class="k">${esc(r.k)}</span><span class="v">${tx(r.v)}</span></div>`;
    }
    body += '</div></div>';
  }
  body += '</div>';
  if (page.note) body += `<div class="note toc-note">${tx(page.note)}</div>`;
  if (page.image) body += wrap({ type: 'photo', fill: true }, B.photo({ src: page.image, cap: page.image_cap, fill: true }));
  if (page.foot) {
    body += `<div class="contact-foot"><div class="big">${tx(page.foot.big)}</div>` +
      `<div style="font-family:var(--mono);font-size:8pt;color:var(--muted)">${tx(page.foot.small || '')}</div></div>`;
  }
  return `<div class="inner">${header(meta, page)}<div class="page-head">${head}</div><div class="${bodyCls(page)}">${body}</div>${footer(meta, page, n, total)}</div>`;
}

/* ---------------- 主构建 ---------------- */
export function build(content, opts = {}) {
  const themes = loadThemes();
  const themeName = opts.theme || content.meta.theme || 'steel-blue';
  const raw = themes[themeName];
  if (!raw) throw new Error(`主题不存在: ${themeName}（可用: ${Object.keys(themes).join(', ')}）`);
  const theme = withDerived(raw);

  const paperKey = opts.paper || content.meta.paper || 'a4';
  const paper = PAPERS[paperKey];
  if (!paper) throw new Error(`未知纸张: ${paperKey}（可用: a4, cn16）`);

  const meta = content.meta;
  const pages = content.pages || [];
  if (!pages.length) throw new Error('content.pages 为空');
  const total = pages.length;

  // 第一遍：id → 页码（目录自动填页用）
  const pageMap = {};
  pages.forEach((p, i) => { if (p.id) pageMap[p.id] = i + 1; });

  const warnings = [];
  const sheets = pages.map((p, i) => {
    const n = i + 1;
    switch (p.type) {
      case 'cover': return pageCover(meta, n);
      case 'contents': return sheet(pageContents(meta, p, n, total, pageMap), n, 'toc');
      case 'grade': return sheet(pageGrade(meta, p, n, total), n, 'grade');
      case 'tablepage': return sheet(pageTablepage(meta, p, n, total), n, 'dense');
      case 'gallery': return sheet(pageGallery(meta, p, n, total), n, 'gallery');
      case 'contact': return sheet(pageContact(meta, p, n, total), n, 'contact');
      case 'section': return sheet(pageSection(meta, p, n, total), n);
      default: throw new Error(`未知页面类型: ${p.type}（第 ${n} 页）`);
    }
  }).join('\n');

  // 覆盖率检查：内容页太少时提示（E 靠页数堆密度，页数不够会显得空）
  if (total < 8) warnings.push(`总页数 ${total}，偏薄——单页模版靠页数和图片撑密度`);
  pages.forEach((p, i) => {
    if (p.type === 'section' && !(p.blocks || []).some((b) => ['photos', 'photo', 'bleed', 'adv', 'kv', 'dashgroups', 'table', 'twin'].includes(b.type))) {
      warnings.push(`第 ${i + 1} 页只有文字，容易显得空——考虑加图或数字带`);
    }
  });

  const themeCss = ':root{\n' + Object.entries(theme)
    .map(([k, v]) => `  --${k}: ${v};`).join('\n') + '\n}\n';
  const paperCss = ':root{\n' +
    `  --trim-w: ${paper.trimW}mm;\n  --trim-h: ${paper.trimH}mm;\n` +
    `  --sheet-w: ${paper.sheetW}mm;\n  --sheet-h: ${paper.sheetH}mm;\n}\n`;

  const tpl = readFileSync(join(TPL, 'assets', 'template.html'), 'utf8');
  let css = readFileSync(join(TPL, 'assets', 'blocks.css'), 'utf8');
  css = css.replace(/@page\s*{\s*size:\s*[\d.]+mm\s+[\d.]+mm/, `@page { size: ${paper.sheetW}mm ${paper.sheetH}mm`);

  const html = tpl
    .replace('/*__THEME_TOKENS__*/', () => themeCss + paperCss)
    .replace('/*__BLOCKS_CSS__*/', () => css)
    .replace('__DOC_TITLE__', () => esc(plain(meta.title) || meta.doc_no || 'portfolio'))
    .replace('__LANG__', () => opts.lang || meta.lang || 'zh')
    .replace('__DOC_TYPE__', () => meta.doc || 'portfolio')
    .replace('__SHEETS__', () => sheets);

  return { html, warnings, themeName, pageCount: total, paper: paperKey };
}

/* ---------------- 目录复制 ---------------- */
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
  const take = (flag) => {
    const i = args.indexOf(flag);
    return i > -1 ? args[i + 1] : null;
  };
  const skip = new Set();
  for (const f of ['--paper', '--lang', '--theme']) {
    const i = args.indexOf(f);
    if (i > -1) { skip.add(i); skip.add(i + 1); }
  }
  const pos = args.filter((a, i) => !a.startsWith('--') && !skip.has(i));
  if (pos.length < 2) {
    console.error('用法: node build.mjs <content.json> <out.html> [--paper a4|cn16] [--lang zh|en|bi] [--theme slug] [--single]');
    process.exit(2);
  }
  const [src, out] = pos;
  if (!existsSync(src)) { console.error(`找不到内容文件: ${src}`); process.exit(2); }
  const content = JSON.parse(readFileSync(src, 'utf8'));

  let res;
  try {
    res = build(content, { paper: take('--paper'), lang: take('--lang'), theme: take('--theme') });
  } catch (e) {
    console.error(`构建失败: ${e.message}`);
    process.exit(1);
  }

  const outPath = resolve(out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, res.html, 'utf8');

  // 字体本地化：@font-face 走相对 ./fonts/，打印时才会内嵌
  try {
    const fontsSrc = join(SKILL, '_shared', 'fonts');
    if (existsSync(fontsSrc)) {
      const n = copyDir(fontsSrc, join(dirname(outPath), 'fonts'));
      console.log(`  字体已同步: ${join(dirname(outPath), 'fonts')}（${n} 个文件）`);
    }
  } catch (e) {
    console.error(`  ⚠ 字体同步失败: ${e.message}——打印会掉字体`);
  }

  // 图片目录
  try {
    const imgSrc = join(dirname(resolve(src)), 'images');
    const imgDst = join(dirname(outPath), 'images');
    if (existsSync(imgSrc) && resolve(imgSrc) !== resolve(imgDst)) copyDir(imgSrc, imgDst);
  } catch (e) {
    console.error(`  ⚠ 图片同步失败: ${e.message}`);
  }

  console.log(`OK ${outPath} · 主题 ${res.themeName} · ${res.pageCount} 页 · 纸张 ${res.paper}`);
  for (const w of res.warnings) console.log(`  ⚠ ${w}`);

  if (args.includes('--single')) {
    console.log('  内嵌资产（字体子集化 + 图片 base64）…');
    const { inlineAssets } = await import(new URL('../../../_shared/inline-fonts.mjs', import.meta.url));
    inlineAssets(outPath, { replace: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(HERE, 'build.mjs')) {
  main().catch((e) => { console.error(`构建失败: ${e.message}`); process.exit(1); });
}
