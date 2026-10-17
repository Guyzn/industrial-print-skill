# Layouts · 页面骨架库（M00–M17 · 杂志编辑风）

模版 B 的**版式锁**。每张骨架都是完整可粘贴的 `.spread` / `.page` 代码块，粘贴到模板的 `<!-- SLOT: 页面骨架占位 -->` 处，替换 `[必填]` 与示例文案即可。骨架已从定稿原型（`prototype/magazine-prototype.html`，22 页送印水准）逐块提炼，**禁止自由发挥结构**。

> ⚠️ 这些类只在 `assets/template.html` 的 `<style>` 里有定义。**模板是类名唯一来源**——不要发明新类名，缺类先在模板 `<style>` 里补，不要每页 inline 重写。

---

## Pre-flight 类名清单（每张骨架开头检查）

使用任何骨架前，先确认模板 `<style>` 里存在以下类。**遗漏 = 样式静默丢失**（图表条不显示、色块变透明、页脚错位）。

**框架类（永远在）**：`.stage` `.spread` `.spread.navy` `.page` `.page.left` `.page.right` `.page.flex-fill` `.pin-bottom` `.folio` `.folio.on-dark` `.fl-run` `.fl-num` `.bleed-img`（`.rel`）`.caption-chip`（`.fold`）

**排版类**：`.kicker`（`.muted`）`.ruled`（`.ink`）`.disp`（`.xl` `.lg` `.md` `.sm`）`.pullquote`（`.tint`）`.pq-cn` `.pq-by` `.col-title` `.ct-idx` `.ct-name` `.body-col`（`.dropcap`）`.lede` `.note`（`.mt`）`.masthead` `.mh-name` `.mh-iss`

**模块/章节类**：`.mod` `.mod-grid`（`.cols-3`）`.mod-h` `.mh-name` `.mh-t` `.mh-stat` `.sec`（`.sec-roomy` `.sec-tight`）`.sec-head` `.sec-no` `.sec-title` `.sec-cont`

**图表类**：`.chart-unit` `.bignum` `.bn-v` `.bn-k` `.donut-row` `.donut-side` `.donut-svg` `.donut-legend` `.dl-row` `.dl-dot` `.dl-label` `.dl-val` `.track` `.track-row` `.tr-head` `.tr-label` `.tr-val` `.track-bar` `.tb-fill`（`.t2` `.t3` `.t4`）`.stack-bar` `.sb-seg` `.sb-in` `.col-chart` `.ccol`（`.v` `.bar`）`.ccol-labels` `.pcol`（`.pcol-1/2/3`）`.pcol-idx` `.pcol-t` `.pcol-d` `.pcol-tags`

**表格类**：`.xtable`（`.num` 右对齐数字列 / `.tot` 合计行）

**封面/幕封类**：`.page.cov` `.cov-meta` `.cov-kicker` `.cov-title` `.cov-year` `.cov-year-svg` `.cov-sub` `.cov-stats`（`.sep`）`.cov-rule` `.cov-deco` `.cover-module` `.cm-k` `.cm-v` `.cm-tags` `.dv-num` `.dv-kicker` `.dv-title` `.dv-sub` `.kv-rule`

**目录/一览类**：`.toc`（`.compact`）`.toc-part` `.toc-row` `.tr-no` `.tr-main` `.tr-t` `.tr-d` `.tr-pg` `.meta-grid` `.mg-item` `.mg-k` `.mg-v`

**岗位档案类**：`.day` `.day-row` `.day-t` `.day-b` `.duty` `.duty-item` `.duty-no` `.duty-t` `.pathmap` `.path-cols` `.adv-band` `.adv-cell` `.adv-no` `.adv-t` `.trait` `.trait-cell` `.trait-t` `.chips` `.chip`

---

## 骨架总览

| 骨架 | 用途 | 图位 / 备注 |
|---|---|---|
| **M00** 封底 | 主色整版铺底：角标 + 编写/出品/数据来源 + 细线 | 无图无页码；与 M01 同对开 |
| **M01** 封面 | 主色整版铺底：校徽 + VOL + 衬线大标题 + 年份图形 + 副题/数据行 | 图位：右侧装饰条（`mix-blend-mode:screen`） |
| **M02** 序 | 栏目标题 + 衬线大标题 + tint 引文 + 双栏首字下沉正文 + 署名 | 无照片 |
| **M03** 序图 | 整版出血图 + 角注 chip | **删 folio**；`.caption-chip.fold` |
| **M04** 目录 | kicker + 大标题 + toc（13 行内用 compact）+ 底部引文 | 页码由 build 回填 |
| **M05** 本期速览 | 三个 bignum + 内嵌图 + 引文 | 图位：120mm 内嵌图 |
| **M06** 幕封 | 满版主色：半透明大数字 + 篇章标题/导语 | 可选 14% 透明底图；`.folio.on-dark` |
| **M07** 章首引文 | 满版主色：白色大引文 + 导读段 | 与 M06 同对开 |
| **M08** 数据页·圆环 | bignum + 导语 + donut-row（环+图例｜mod 列）+ xtable + 置底图注 | 图1 类 |
| **M09** 数据页·轨道 | 内容标题 + track 轨道图 + mod-grid + 置底引文 | 图2 类 |
| **M10** 数据页·大字报 | 内容标题 + bignum 网格（34pt）+ mod-grid + 置底引文 | 图3 类 |
| **M11** 数据页·堆叠条 | 内容标题 + stack-bar + mod-grid + 置底引文 | 图4 类 |
| **M12** 数据页·柱图 | 导语 + col-chart 柱图 + ccol-labels + mod-grid.cols-3 + 置底引文 | 图5 类 |
| **M13** 数据页·支柱色块 | 内容标题 + pcol×3 + mod-grid + 置底引文 | 图6 类 |
| **M14** 岗位一览 | xtable 岗位表 + 编辑部引文 + HOW TO READ | PART 02 开篇右页 |
| **M15** 岗位封面 | 整版出血岗位场景图 + 角注 chip | **删 folio** |
| **M16** 岗位开篇 | kicker + 岗位大标题 + 画像句 + meta-grid + 标签 + IN THIS FILE 导览 | 与 M15 同对开 |
| **M17** 岗位详情 | col-title「岗位档案」+ `.sec` 小节自由组合（lede/day/duty/pathmap/adv-band/trait/薪酬条） | 每岗位 2–4 页，build 贪心打包 |

---

## 溢出纪律（每页必守 · 用户锁定）

- 每页内容必须**完整落在 210×285 内**：正文 ≥ 9pt，表格 ≥ 8pt，图注 ≥ 7pt（印刷下限）。
- **一页一个主体**：内容不跨页自然流动。溢出先删内容 / 拆页 / 换骨架，**禁止**靠压字号硬塞。
- **页码铁律**：页面内容与底部页码（`.folio` 在 bottom:10mm）之间至少留 **12mm** 空白。放不下果断换页。
- 数据页/详情页用 `.page.flex-fill` + `.pin-bottom` 把图注或引文钉在页码上方，中间自然撑开。
- **图注与图表成组**：图注写在 `.chart-unit` 内部（图表下方），**禁止**单独 pin 到页底与页码挤在一起；M08 是唯一例外（整页图表群，`.note.pin-bottom` 单独置底）。
- 整版出血图页（M03 / M15）**删除 folio**，只留 `.caption-chip`。
- 双栏正文 `.body-col` 单页总量 ≤ 900 字；轨道 `--v` 必须与 `.tr-val` 数值一致。

## 图表纪律（用户锁定）

- **文字/版式只走主色 `--accent`**；`--chart-2/3/4` 仅限数据可视化（图表系列色、色块卡、tint 底）。
- 图表内系列色顺序：主系列 `var(--accent)`，其后依次 `.t3`（青绿）/ `.t2`（驼色）/ `.t4`（灰蓝）——**与定稿原型保持一致**，同一手册内同维度图表用色不得漂移。
- **SVG 内禁止使用 `var()` 作 presentation 属性**（`fill=`/`stroke=` 属性不吃 var），一律写 `style="fill: var(--accent);"` 内联样式形式。
- 圆环图：viewBox `0 0 42 42`、r=15.9155（周长≈100），`stroke-dasharray="占比 余量"`、首环 `stroke-dashoffset="25"`，后续环 offset 依次累减；占比 <3% 的最小可视宽度取 2.3% 并在图注中说明。
- 职责编号 `.duty-no` 偶数项自动驼色（`:nth-child(even)`）；路径图终点节点用 `--chart-3` 青绿。

---

## M00 + M01 · 封底 | 封面（一个对开 · 印刷惯例左封底右封面）

主色（`--accent`）整版铺底。所有元素绝对定位，坐标锁定，只换文字与图。封面/封底**无页码**。

```html
<section class="spread" id="sp-cover">

  <!-- 封底 M00 -->
  <div class="page left cov" data-layout="M00">
    <div class="cov-meta" style="position: absolute; left: var(--ink-outer); top: var(--ink-top);">[必填] 刊名英文 · VOL. [年份]</div>
    <div style="position: absolute; left: var(--ink-outer); right: var(--ink-fold); bottom: 24mm; font-family: 'Alibaba PuHuiTi 3', var(--font); font-weight: 400; font-size: 9pt; line-height: 2.0; color: #ffffff;">
      [必填] 编写：××编写组<br />
      [必填] 出品：××学校 · ××学院<br />
      [必填] 数据来源：××（统计期）
    </div>
    <hr class="cov-rule" style="position: absolute; left: var(--ink-outer); right: var(--ink-fold); bottom: 15mm;" />
  </div>

  <!-- 封面 M01 -->
  <div class="page right cov" data-layout="M01">
    <img src="images/logo-placeholder.svg" alt="[必填] 校名" style="position: absolute; left: var(--ink-fold); top: var(--ink-top); height: 8.5mm; width: auto;" />
    <div class="cov-meta" style="position: absolute; right: var(--ink-outer); top: var(--ink-top);">VOL. [必填] 年份</div>

    <div style="position: absolute; left: var(--ink-fold); top: 58mm;">
      <div class="cov-kicker">[必填] 英文角标，如 CAREER · HANDBOOK</div>
      <h1 class="cov-title" style="margin-top: 7mm;">[必填] 专业名称<br />[必填] 手册名称。</h1>
      <img class="cov-year-svg" src="images/cover-2026.svg" alt="[年份]" style="margin-top: 6mm;" />
    </div>

    <div style="position: absolute; left: var(--ink-fold); top: 152mm; display: flex; gap: 7mm; align-items: stretch;">
      <div style="width: 1px; background: #ffffff;"></div>
      <div style="display: flex; flex-direction: column; justify-content: center; gap: 5mm; padding: 1mm 0;">
        <div class="cov-sub">[必填] 副题一句话</div>
        <div class="cov-stats">
          <span>[必填] 数据点一</span>
          <span class="sep"></span>
          <span>[必填] 数据点二</span>
          <span class="sep"></span>
          <span>[必填] 数据点三</span>
        </div>
      </div>
    </div>

    <div class="cov-meta" style="position: absolute; left: var(--ink-fold); bottom: 18mm;">[必填] 底部一行说明</div>

    <div class="cov-deco">
      <img src="images/cover-deco-raw.png" alt="" />
    </div>
  </div>
</section>
```

- `id="sp-cover"` 是目录锚点，勿改。
- 年份是**转曲 SVG 图形**（`.cov-year-svg`，h=16.1mm）；无 SVG 时用 `.cov-year` 文字（56pt 衬线 900，颜色自动取 accent 提亮 45%）。
- 装饰条 `.cov-deco`：`mix-blend-mode:screen; opacity:.5` 是**永久约定**，换主色不换混合模式；无装饰图时整块删除。
- 无校徽时删除第一个 `<img>`；仓库内置中性**占位校徽** `images/logo-placeholder.svg`（build 自动同步）——本镜像可分享，**正式发布请换真实校徽**（白色版，置于主色底上）。

---

## M02 + M03 · 序 | 序图（一个对开）

```html
<section class="spread" id="sp-preface">

  <!-- 序 M02 -->
  <div class="page left" data-layout="M02">
    <div class="col-title"><span class="ct-idx">P</span><span class="ct-name">PREFACE · 序</span></div>
    <h2 class="disp lg">[必填] 序标题<br />[必填] 第二行</h2>

    <div class="pullquote tint" style="margin: 7mm 0 8mm;">
      <div class="pq-cn" style="white-space: nowrap;">[必填] 单行引文（不折行，≤19 字）</div>
      <div class="pq-by">EDITOR'S NOTE · 编者手记</div>
    </div>

    <div class="body-col dropcap">
      <p>[必填] 序正文第一段（首字自动下沉）。</p>
      <p>[必填] 第二段。行业背景与趋势。</p>
      <p>[必填] 第三段。产业生态与机会。</p>
      <p>[必填] 第四段。寄语 + 本手册使用方法。</p>
    </div>

    <div style="text-align: right; margin-top: 6mm;">
      <div style="font-family: var(--disp); font-weight: 700; font-size: 11pt;">[必填] 编写组署名</div>
      <div style="font-family: var(--mono); font-size: 8pt; letter-spacing: 0.12em; color: var(--muted); margin-top: 1.5mm;">[必填] 日期</div>
    </div>

    <div class="folio"><span class="fl-run">[必填] 手册名 · 年份</span><span class="fl-num">02</span></div>
  </div>

  <!-- 序图 M03：整版出血，无 folio -->
  <div class="page right" data-layout="M03" style="padding: 0;">
    <div class="bleed-img">
      <img src="images/preface.jpg" alt="[必填] 图注（示意图）" style="object-position: center 40%;" />
    </div>
    <div class="caption-chip fold">IMAGE · [必填] 图注（示意图）</div>
  </div>
</section>
```

- M03 在右页，角注用 `.caption-chip.fold`（贴墨区内侧）；若放左页则去掉 `.fold`。
- 序正文 4 段为宜，双栏每栏约 450 字；段落数 3–5 可调，超 5 段必溢出。

---

## M04 + M05 · 目录 | 本期速览（一个对开）

```html
<section class="spread" id="sp-toc">

  <!-- 目录 M04 -->
  <div class="page left" data-layout="M04">
    <div class="kicker">CONTENTS · 本期导览</div>
    <h2 class="disp lg" style="margin-top: 3mm;">目录</h2>
    <hr class="ruled" style="margin: 5mm 0 2mm;" />

    <div class="toc compact">
      <div class="toc-part">PART 01 · [必填] 篇章名</div>
      <div class="toc-row"><span class="tr-no">01</span><div class="tr-main"><div class="tr-t">[必填] 条目</div><div class="tr-d">[必填] 一句话</div></div><span class="tr-pg">08</span></div>
      <!-- …按内容 JSON 逐条生成；.tr-pg 由 build 回填 data-pg … -->
      <div class="toc-part">PART 02 · [必填] 篇章名</div>
      <div class="toc-row"><span class="tr-no">07</span><div class="tr-main"><div class="tr-t">[必填] 岗位一览</div><div class="tr-d">[必填] 一句话</div></div><span class="tr-pg">15</span></div>
    </div>

    <div class="pullquote" style="margin-top: 7mm;">
      <div class="pq-cn" style="font-size: 13.5pt;">[必填] 目录页底部引文</div>
      <div class="pq-by">— 本手册使用方法</div>
    </div>

    <div class="folio"><span class="fl-run">[必填] 手册名 · 年份</span><span class="fl-num">04</span></div>
  </div>

  <!-- 本期速览 M05 -->
  <div class="page right" data-layout="M05">
    <div class="kicker">AT A GLANCE · 本期速览</div>
    <h2 class="disp md" style="margin-top: 3mm;">[必填] 速览标题</h2>
    <hr class="ruled" style="margin: 5mm 0;" />

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm;">
      <div class="bignum"><div class="bn-v">[必填]</div><div class="bn-k">[必填] 指标一</div></div>
      <div class="bignum"><div class="bn-v">[必填]<small>%</small></div><div class="bn-k">[必填] 指标二</div></div>
      <div class="bignum"><div class="bn-v">[必填]</div><div class="bn-k">[必填] 指标三</div></div>
    </div>

    <div class="bleed-img rel" style="height: 120mm; margin: 8mm 0 0;">
      <img src="images/data-inline.jpg" alt="[必填] 图注（示意图）" />
    </div>
    <div style="font-family: var(--mono); font-size: 7pt; letter-spacing: 0.12em; color: var(--muted); margin-top: 1.5mm;">IMAGE · [必填] 图注（示意图）</div>

    <div class="pullquote" style="margin-top: 6mm;">
      <div class="pq-cn">[必填] 速览引文</div>
      <div class="pq-by">— 编者手记</div>
    </div>

    <div class="folio"><span class="fl-run">本期速览 · AT A GLANCE</span><span class="fl-num">05</span></div>
  </div>
</section>
```

- 目录条目总数 ≤13 行时用 `.toc.compact`（行距 2.8mm、隐藏 `.tr-d`）；≤8 行可用标准 `.toc`（带描述）。
- 速览内嵌图固定高 120mm，`.bleed-img.rel`（相对定位、不铺满页）。

---

## M06 + M07 · 幕封 | 章首引文（一个对开 · 满版主色）

```html
<section class="spread navy" id="sp-part1">

  <!-- 幕封 M06 -->
  <div class="page left" data-layout="M06">
    <div class="bleed-img"><img src="images/divider1.jpg" alt="" style="opacity: 0.14; object-position: center;" /></div>
    <div style="position: relative; height: 100%; display: flex; flex-direction: column;">
      <div class="dv-num">01</div>
      <div style="margin-top: auto;">
        <div class="dv-kicker">PART 01 · [必填] 英文</div>
        <div class="dv-title" style="margin-top: 5mm;">[必填] 篇章标题<br />[必填] 第二行</div>
        <div class="dv-sub" style="margin-top: 6mm; max-width: 120mm;">[必填] 篇章导语一句话。</div>
        <div class="kv-rule" style="margin-top: 8mm;"></div>
      </div>
    </div>
    <div class="folio on-dark"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">06</span></div>
  </div>

  <!-- 章首引文 M07 -->
  <div class="page right" data-layout="M07">
    <div style="margin-top: 34mm;">
      <div class="pullquote" style="border-color: rgba(255,255,255,0.7);">
        <div class="pq-cn" style="color: #ffffff; font-size: 21pt; line-height: 1.5;">[必填] 章首大引文<br />[必填] 第二行</div>
        <div class="pq-by" style="color: rgba(255,255,255,0.65);">— 导语 · [必填] 篇章名</div>
      </div>
      <p style="color: rgba(255,255,255,0.85); font-size: 9.5pt; line-height: 1.85; margin-top: 9mm; max-width: 130mm; text-align: justify;">
        [必填] 章首导读段（回答本章要解决的 1–2 个问题，≤120 字）。
      </p>
    </div>
    <div class="folio on-dark"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">07</span></div>
  </div>
</section>
```

- `.spread.navy` 让两页共享主色底；幕封底图可选（opacity 0.14），无图时删 `.bleed-img`。
- PART 02 幕封（与 M14 同对开）不用 `.navy`，改为左页 inline `style="background: var(--accent); color: #ffffff;"`（见 M14）。
- 大数字 `.dv-num` 是半透明装饰（rgba 白 16%），不是内容色。

---

## M08 · 数据页 · 圆环（总量 + 结构拆分）

```html
<div class="page left flex-fill" data-layout="M08">
  <div class="col-title"><span class="ct-name">数据版 · DATA DESK · [必填] 篇章名</span></div>

  <div class="kicker" style="margin-bottom: 4mm;">01 · [必填] 小节标题</div>
  <div class="bignum">
    <div class="bn-v">[必填]<small> 个</small></div>
    <div class="bn-k">[必填] 大数字说明 · 统计期</div>
  </div>

  <p style="font-size: 9.5pt; line-height: 1.85; margin-top: 9mm; text-align: justify;">[必填] 导语段（点出结构特征）。</p>

  <div class="donut-row" style="margin-top: 10mm;">
    <div class="donut-side">
      <svg class="donut-svg" viewBox="0 0 42 42" role="img" aria-label="[必填] 圆环图说明">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#ece8df" stroke-width="5" />
        <circle cx="21" cy="21" r="15.9155" fill="none" style="stroke: var(--accent);" stroke-width="5" stroke-dasharray="[占比] [余量]" stroke-dashoffset="25" />
        <circle cx="21" cy="21" r="15.9155" fill="none" style="stroke: var(--chart-3);" stroke-width="5" stroke-dasharray="[占比] [余量]" stroke-dashoffset="[累计]" />
        <circle cx="21" cy="21" r="15.9155" fill="none" style="stroke: var(--chart-4);" stroke-width="5" stroke-dasharray="[占比] [余量]" stroke-dashoffset="[累计]" />
        <text x="21" y="20" text-anchor="middle" style="font-family: var(--disp); font-weight: 900; font-size: 6.2px; fill: var(--accent);">[必填]%</text>
        <text x="21" y="25.5" text-anchor="middle" style="font-family: var(--mono); font-size: 2.1px; letter-spacing: 0.04em; fill: var(--muted);">[必填] 环心注</text>
      </svg>
      <div class="donut-legend">
        <div class="dl-row"><span class="dl-dot" style="background: var(--accent);"></span><span class="dl-label">[必填] 系列一</span><span class="dl-val">[必填] 值 · 占比</span></div>
        <div class="dl-row"><span class="dl-dot" style="background: var(--chart-3);"></span><span class="dl-label">[必填] 系列二</span><span class="dl-val">[必填] 值 · 占比</span></div>
        <div class="dl-row"><span class="dl-dot" style="background: var(--chart-4);"></span><span class="dl-label">[必填] 系列三</span><span class="dl-val">[必填] 值 · 占比</span></div>
      </div>
    </div>

    <div style="flex: 1;">
      <div class="mod">
        <div class="mod-h"><span class="mh-name">[必填] 系列一名</span><span class="mh-stat">[必填] 占比 · 数量</span></div>
        <p>[必填] 该系列解读（适合谁 / 门槛 / 去向）。</p>
      </div>
      <div class="mod">…系列二…</div>
      <div class="mod">…系列三…</div>
    </div>
  </div>

  <table class="xtable" style="margin-top: 10mm;">
    <tr><th>[必填] 维度</th><th class="num">数量</th><th class="num">占比</th></tr>
    <tr><td>[必填]</td><td class="num">[必填]</td><td class="num">[必填]</td></tr>
    <tr class="tot"><td>合计</td><td class="num">[必填]</td><td class="num">100%</td></tr>
  </table>

  <div class="note pin-bottom">图 1 · [必填] 数据来源 / 口径 / 刻度说明。</div>
  <div class="folio"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">08</span></div>
</div>
```

- M08 是唯一允许 `.note.pin-bottom` 单独置底的骨架（整页都是图表群，图注即页脚注）。
- 系列数 2–4 个；超过 4 个拆两页或改 M09 轨道图。

---

## M09 · 数据页 · 轨道（分级占比）

```html
<div class="page right flex-fill" data-layout="M09">
  <div class="col-title"><span class="ct-name">数据版 · DATA DESK · [必填] 篇章名</span></div>
  <div class="kicker" style="margin-bottom: 4mm;">02 · [必填] 小节标题</div>
  <h3 class="disp md">[必填] 内容标题<br />[必填] 第二行</h3>

  <div class="chart-unit" style="margin-top: 10mm;">
    <div class="track">
      <div class="track-row"><div class="tr-head"><span class="tr-label">[必填] 条目一</span><span class="tr-val">[必填] 值 · 占比</span></div><div class="track-bar"><div class="tb-fill" style="--v: 100%;"></div></div></div>
      <div class="track-row"><div class="tr-head"><span class="tr-label">[必填] 条目二</span><span class="tr-val">[必填] 值 · 占比</span></div><div class="track-bar"><div class="tb-fill t3" style="--v: 79%;"></div></div></div>
      <div class="track-row"><div class="tr-head"><span class="tr-label">[必填] 条目三</span><span class="tr-val">[必填] 值 · 占比</span></div><div class="track-bar"><div class="tb-fill t2" style="--v: 9%;"></div></div></div>
      <div class="track-row"><div class="tr-head"><span class="tr-label">[必填] 条目四</span><span class="tr-val">[必填] 值 · 占比</span></div><div class="track-bar"><div class="tb-fill t4" style="--v: 8%;"></div></div></div>
    </div>
    <div class="note" style="margin-top: 3mm;">图 2 · [必填] 图表说明（含满刻度口径）。</div>
  </div>

  <p style="font-size: 9.5pt; line-height: 1.85; margin-top: 8mm; text-align: justify;">[必填] 解读段。</p>

  <div class="mod-grid" style="margin-top: 7mm;">
    <div class="mod"><div class="mod-h"><span class="mh-name">[必填] 条目一</span><span class="mh-stat">[必填] 占比</span></div><p>[必填] 解读。</p></div>
    <div class="mod">…</div>
  </div>

  <div class="pullquote pin-bottom">
    <div class="pq-cn" style="font-size: 13pt;">[必填] 页面置底引文（行动建议）。</div>
  </div>

  <div class="folio"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">09</span></div>
</div>
```

- 轨道以最大值为满刻度（`--v: 100%`），其余按相对比例；系列色序 accent → t3 → t2 → t4。
- 条目 3–5 个；mod-grid 模块数与轨道条目一一对应。

---

## M10 · 数据页 · 大字报（多维占比并列）

```html
<div class="page left flex-fill" data-layout="M10">
  <div class="col-title"><span class="ct-name">数据版 · DATA DESK · [必填] 篇章名</span></div>
  <div class="kicker" style="margin-bottom: 4mm;">03 · [必填] 小节标题</div>
  <h3 class="disp md">[必填] 内容标题<br />[必填] 第二行</h3>

  <div class="chart-unit" style="margin-top: 9mm;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 9mm;">
      <div class="bignum"><div class="bn-v" style="font-size: 34pt;">[必填]<small>%</small></div><div class="bn-k">[必填] 维度一 · 数量</div></div>
      <div class="bignum"><div class="bn-v" style="font-size: 34pt;">[必填]<small>%</small></div><div class="bn-k">[必填] 维度二 · 数量</div></div>
      <div class="bignum"><div class="bn-v" style="font-size: 34pt;">[必填]<small>%</small></div><div class="bn-k">[必填] 维度三 · 数量</div></div>
      <div class="bignum"><div class="bn-v" style="font-size: 34pt;">[必填]<small>%</small></div><div class="bn-k">[必填] 维度四 · 数量</div></div>
    </div>
    <div class="note" style="margin-top: 2.5mm;">图 3 · [必填] 图表说明（含未列出口径）。</div>
  </div>

  <p style="margin-top: 7mm; font-size: 9.5pt; line-height: 1.9;">[必填] 总述段。</p>

  <div class="mod-grid" style="margin-top: 6mm; row-gap: 5.5mm;">
    <div class="mod"><div class="mod-h"><span class="mh-name">[必填] 维度一</span><span class="mh-stat">[必填] 特征</span></div><p>[必填] 解读。</p></div>
    <div class="mod">…</div>
  </div>

  <div class="pullquote pin-bottom">
    <div class="pq-cn" style="font-size: 13.5pt;">[必填] 数据解读引文</div>
    <div class="pq-by">— 数据解读 · [必填] 维度</div>
  </div>

  <div class="folio"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">10</span></div>
</div>
```

- 大字报数字一律 34pt（inline 覆盖 `.bn-v` 默认 44pt），2×2 网格 4 个为佳。
- mod-grid 与大字报维度一一对应。

---

## M11 · 数据页 · 堆叠条（二值/有无口径）

```html
<div class="page right flex-fill" data-layout="M11">
  <div class="col-title"><span class="ct-name">数据版 · DATA DESK · [必填] 篇章名</span></div>
  <div class="kicker" style="margin-bottom: 4mm;">04 · [必填] 小节标题</div>
  <h3 class="disp md">[必填] 内容标题<br />[必填] 第二行</h3>

  <div class="chart-unit" style="margin-top: 10mm;">
    <div class="stack-bar" aria-label="[必填] 堆叠图说明">
      <div class="sb-seg" style="--w: 47%; background: var(--accent);"><span class="sb-in">[必填] 主段 47%</span></div>
      <div class="sb-seg" style="--w: 2.1%; background: var(--chart-3);"></div>
      <div class="sb-seg" style="--w: 50.9%; background: var(--surface); border: 0.5pt solid var(--border); border-left: none;"><span class="sb-in" style="color: var(--muted);">[必填] 未注明段说明</span></div>
    </div>
    <div class="note mt">图 4 · [必填] 图表说明（各段数量与占比）。</div>
  </div>

  <div class="mod-grid" style="margin-top: 9mm;">
    <div class="mod"><div class="mod-h"><span class="mh-t">[必填] 段一解读标题</span><span class="mh-stat">[必填] 占比 · 数量</span></div><p>[必填] 解读。</p></div>
    <div class="mod"><div class="mod-h"><span class="mh-t">[必填] 段二解读标题</span><span class="mh-stat">[必填] 占比 · 数量</span></div><p>[必填] 解读。</p></div>
  </div>

  <div class="pullquote pin-bottom">
    <div class="pq-cn" style="font-size: 13pt;">[必填] 数据解读引文</div>
    <div class="pq-by">— 数据解读 · [必填] 维度</div>
  </div>

  <div class="folio"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">11</span></div>
</div>
```

- 「未注明/其他」段用 surface 底 + 发丝边框 + muted 字，不占用图表色。
- 窄段（<4%）不写字，只在图注中交代数值。

---

## M12 · 数据页 · 柱图（区间分布）

```html
<div class="page left flex-fill" data-layout="M12">
  <div class="col-title"><span class="ct-name">数据版 · DATA DESK · [必填] 篇章名</span></div>
  <div class="kicker" style="margin-bottom: 4mm;">05 · [必填] 小节标题</div>
  <h3 class="disp md">[必填] 内容标题<br />[必填] 第二行</h3>

  <p style="margin-top: 7mm; font-size: 9.5pt; line-height: 1.9;">[必填] 导语段（先给结论）。</p>

  <div class="chart-unit" style="margin-top: 8mm;">
    <div class="col-chart">
      <div class="ccol"><span class="v">17.1%</span><div class="bar" style="height: 50.8%; background: var(--chart-3);"></div></div>
      <div class="ccol"><span class="v">26.8%</span><div class="bar" style="height: 79.5%; background: var(--chart-2);"></div></div>
      <div class="ccol"><span class="v"><strong>33.7%</strong></span><div class="bar" style="height: 100%;"></div></div>
      <div class="ccol"><span class="v">22.4%</span><div class="bar" style="height: 66.7%; background: var(--chart-4);"></div></div>
    </div>
    <div class="ccol-labels">
      <span>[必填] 区间一<em>[必填] 数量 · 注</em></span>
      <span>[必填] 区间二<em>[必填] 数量 · 注</em></span>
      <span>[必填] 区间三<em>[必填] 数量 · 注</em></span>
      <span>[必填] 其余<em>[必填] 说明</em></span>
    </div>
    <div class="note" style="margin-top: 3mm;">图 5 · [必填] 图表说明（峰值柱 = 主色）。</div>
  </div>

  <div class="mod-grid cols-3" style="margin-top: 8mm;">
    <div class="mod"><div class="mod-h"><span class="mh-name">[必填] 阶段一</span><span class="mh-stat">[必填] 占比</span></div><p>[必填] 解读。</p></div>
    <div class="mod">…</div>
    <div class="mod">…</div>
  </div>

  <blockquote class="pullquote pin-bottom">
    <p>[必填] 页面置底引文。</p>
  </blockquote>

  <div class="folio"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">12</span></div>
</div>
```

- 峰值柱用主色（默认 `.bar`），其余柱按色序 chart-3 / chart-2 / chart-4；柱高与占比等比（峰值 = 100%）。
- 柱数 3–5；`.ccol-labels` 与柱一一对应，`em` 行放数量+注释。

---

## M13 · 数据页 · 支柱色块（能力结构）

```html
<div class="page right flex-fill" data-layout="M13">
  <div class="col-title"><span class="ct-name">数据版 · DATA DESK · [必填] 篇章名</span></div>
  <div class="kicker" style="margin-bottom: 4mm;">06 · [必填] 小节标题</div>
  <h3 class="disp md">[必填] 内容标题</h3>
  <p style="font-size: 9.5pt; line-height: 1.9; margin-top: 4mm; text-align: justify;">[必填] 导语段（三大支柱的关系）。</p>

  <div class="chart-unit" style="margin-top: 8mm;">
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm;">
      <div class="pcol pcol-1">
        <div class="pcol-idx">PILLAR 01 · [必填] 定位</div>
        <div class="pcol-t">[必填] 支柱一</div>
        <div class="pcol-d">[必填] 支柱说明。</div>
        <div class="pcol-tags"><span>[必填]</span><span>[必填]</span><span>[必填]</span></div>
      </div>
      <div class="pcol pcol-2">…支柱二…</div>
      <div class="pcol pcol-3">…支柱三…</div>
    </div>
    <div class="note" style="margin-top: 2.5mm;">图 6 · [必填] 图表说明（聚类口径）。</div>
  </div>

  <div class="mod-grid" style="margin-top: 9mm;">
    <div class="mod"><div class="mod-h"><span class="mh-t">[必填] 建议一标题</span><span class="mh-stat">[必填] 注</span></div><p>[必填] 正文。</p></div>
    <div class="mod"><div class="mod-h"><span class="mh-t">[必填] 建议二标题</span><span class="mh-stat">[必填] 注</span></div><p>[必填] 正文。</p></div>
  </div>

  <div class="pullquote pin-bottom">
    <div class="pq-cn" style="font-size: 14.5pt;">[必填] 数据解读引文</div>
    <div class="pq-by">— 数据解读 · [必填] 维度</div>
  </div>

  <div class="folio"><span class="fl-run">PART 01 · [必填] 篇章名</span><span class="fl-num">13</span></div>
</div>
```

- 支柱固定 3 个（pcol-1 主色 / pcol-2 青绿 / pcol-3 驼色）；每柱标签 2–4 个。
- 本骨架是 PART 01 收尾页，置底引文收束整个数据篇。

---

## M06（PART 02 变体）+ M14 · 幕封二 | 岗位一览（一个对开）

PART 02 幕封不用 `.spread.navy`，左页 inline 主色底，右页 M14 白底一览表。

```html
<section class="spread" id="sp-part2">

  <!-- 幕封 M06 · PART 02 变体 -->
  <div class="page left" data-layout="M06" style="background: var(--accent); color: #ffffff;">
    <div style="position: relative; height: 100%; display: flex; flex-direction: column;">
      <div class="dv-num">02</div>
      <div style="margin-top: auto;">
        <div class="dv-kicker">PART 02 · JOB FILE</div>
        <div class="dv-title" style="margin-top: 5mm;">[必填] 篇章标题<br />[必填] 第二行</div>
        <div class="dv-sub" style="margin-top: 6mm; max-width: 120mm;">[必填] 篇章导语一句话。</div>
        <div class="kv-rule" style="margin-top: 8mm;"></div>
      </div>
    </div>
    <div class="folio on-dark"><span class="fl-run">PART 02 · [必填] 篇章名</span><span class="fl-num">14</span></div>
  </div>

  <!-- 岗位一览 M14 -->
  <div class="page right" data-layout="M14">
    <div class="col-title"><span class="ct-idx">07</span><span class="ct-name">[必填] 一览表标题</span></div>

    <table class="xtable">
      <tr><th>岗位</th><th>方向</th><th class="num">详解</th></tr>
      <tr><td><b>[必填] 岗位一</b></td><td>[必填] 方向</td><td class="num">P.16</td></tr>
      <tr><td>[必填] 岗位二</td><td>[必填] 方向</td><td class="num">—</td></tr>
      <!-- …每岗位一行；本期详解的岗位加 <b> + 页码，其余 — … -->
    </table>

    <div class="pullquote" style="margin-top: 9mm;">
      <div class="pq-cn" style="font-size: 13.5pt;">[必填] 编辑部说明引文</div>
      <div class="pq-by">— 编辑部说明</div>
    </div>

    <div style="margin-top: 9mm; border-top: 1px solid var(--border); padding-top: 3mm;">
      <div style="font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.14em; color: var(--muted);">HOW TO READ · 阅读指南</div>
      <p style="font-size: 9pt; line-height: 1.8; margin-top: 2mm; text-align: justify;">[必填] 十二段式阅读指南（可顺序读，也可按问题翻查）。</p>
    </div>

    <div class="folio"><span class="fl-run">PART 02 · [必填] 篇章名</span><span class="fl-num">15</span></div>
  </div>
</section>
```

- 详解页码列由 build 回填实际页码。

---

## M15 + M16 · 岗位封面 | 岗位开篇（一个对开 · 每岗位重复）

```html
<section class="spread" id="sp-job-1">

  <!-- 岗位封面 M15：整版出血，无 folio -->
  <div class="page left" data-layout="M15" style="padding: 0;">
    <div class="bleed-img">
      <img src="images/job1.jpg" alt="[必填] 图注（示意图）" style="height: 108%; object-position: center top;" />
    </div>
    <div class="caption-chip">IMAGE · [必填] 图注（示意图）</div>
  </div>

  <!-- 岗位开篇 M16 -->
  <div class="page right" data-layout="M16">
    <div class="kicker">JOB FILE · [必填] 编号 · [必填] 方向</div>
    <h3 class="disp lg" style="margin-top: 4mm;">[必填] 岗位名<br />[必填] 第二行</h3>
    <p style="font-family: var(--disp); font-weight: 700; font-size: 12pt; color: var(--muted); margin-top: 3mm; line-height: 1.4;">[必填] 一句话岗位画像</p>
    <hr class="ruled" style="margin: 6mm 0;" />

    <p style="font-size: 10pt; line-height: 1.9; text-align: justify;">[必填] 岗位综述一段（≤90 字）。</p>

    <div class="meta-grid" style="margin-top: 8mm;">
      <div class="mg-item"><div class="mg-k">准入门槛</div><div class="mg-v">[必填]</div></div>
      <div class="mg-item"><div class="mg-k">核心方向</div><div class="mg-v">[必填]</div></div>
      <div class="mg-item"><div class="mg-k">热门度</div><div class="mg-v">[必填]</div></div>
      <div class="mg-item"><div class="mg-k">职业路径</div><div class="mg-v">[必填]</div></div>
    </div>

    <div class="cm-tags" style="margin-top: 8mm;">
      <span>[必填] 标签</span><span>[必填] 标签</span><span>[必填] 标签</span><span>[必填] 标签</span>
    </div>

    <div style="margin-top: 9mm; border-top: 2px solid var(--fg); padding-top: 3.5mm;">
      <div style="font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.14em; color: var(--muted);">IN THIS FILE · 本岗导览</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2.2mm 8mm; margin-top: 3.5mm;">
        <!-- 12 条，两列交错：左列 01–06，右列 07–12；页码由 build 回填 -->
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 8.5pt;"><span><span style="font-family: var(--mono); color: var(--accent); font-weight: 700; margin-right: 2mm;">01</span>岗位综述</span><span style="font-family: var(--mono); color: var(--muted);">P.18</span></div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 8.5pt;"><span><span style="font-family: var(--mono); color: var(--accent); font-weight: 700; margin-right: 2mm;">07</span>职业发展路径</span><span style="font-family: var(--mono); color: var(--muted);">P.20</span></div>
        <!-- …02/08、03/09、04/10、05/11、06/12 … -->
      </div>
    </div>

    <div class="folio"><span class="fl-run">JOB FILE · [必填] 岗位名</span><span class="fl-num">17</span></div>
  </div>
</section>
```

- M15 图片有水印时用 `height:108%; object-position:center top` 裁底 8%。
- IN THIS FILE 导览固定 12 条（对应十二段），页码由 build 按实际分页回填。

---

## M17 · 岗位详情（每岗位 2–4 页 · `.sec` 小节自由组合）

十二段小节按固定序号 01–12，build 按内容量贪心打包成页（每页 2–4 个小节）。页级容器：

```html
<div class="page left flex-fill" data-layout="M17">
  <div class="col-title"><span class="ct-name">岗位档案 · JOB FILE · PART 02 岗位详解</span></div>

  <!-- 小节块：按需选 2–4 个堆叠；最后一个小节加 style="margin-bottom: 0;" -->
  <div class="sec">…</div>
  <div class="sec" style="margin-bottom: 0;">…</div>

  <div class="folio"><span class="fl-run">JOB FILE · [必填] 岗位名</span><span class="fl-num">18</span></div>
</div>
```

- 页级节奏类：默认 `.sec` 间距 12mm；内容少时用 `.sec-roomy`（17mm），内容多时用 `.sec-tight`（9mm）——**一页只用一种**。
- 跨页续接的小节（如职责 05–06 续排）省略 `.sec-head`，直接排组件，靠 `.sec-no` 序列自明。

### 小节 01 岗位综述（lede 首字下沉）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">01</span><span class="sec-title">岗位综述</span></div>
  <p class="lede">[必填] 综述段（首字自动下沉，≤180 字）。</p>
</div>
```

### 小节 02 一天（day 色块表格）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">02</span><span class="sec-title">[必填] 岗位名的一天</span></div>
  <div class="day">
    <div class="day-row"><div class="day-t">早晨</div><div class="day-b">[必填] 内容。</div></div>
    <div class="day-row"><div class="day-t">上午</div><div class="day-b">[必填] 内容。</div></div>
    <div class="day-row"><div class="day-t">中午</div><div class="day-b">[必填] 内容。</div></div>
    <div class="day-row"><div class="day-t">下午</div><div class="day-b">[必填] 内容。</div></div>
    <div class="day-row"><div class="day-t">傍晚</div><div class="day-b">[必填] 内容。</div></div>
  </div>
</div>
```

### 小节 03 工作职责（duty 编号网格，可跨页续排）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">03</span><span class="sec-title">工作职责</span></div>
  <div class="duty">
    <div class="duty-item"><div class="duty-no">01</div><div class="duty-t">[必填] 职责名</div><p>[必填] 说明。</p></div>
    <div class="duty-item"><div class="duty-no">02</div><div class="duty-t">[必填] 职责名</div><p>[必填] 说明。</p></div>
    <!-- …4–6 条；偶数序号自动驼色；跨页时续页直接放 .duty 网格、省略 sec-head … -->
  </div>
</div>
```

### 小节 04 行业前景 / 小节 12 学习规划（lede 长段落，同 01 结构）

### 小节 05 岗位生活（mod-grid 四格）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">05</span><span class="sec-title">[必填] 岗位名的生活</span></div>
  <div class="mod-grid">
    <div class="mod"><div class="mod-h"><span class="mh-name">[必填] 切面一</span><span class="mh-stat">[必填] 注</span></div><p>[必填] 说明。</p></div>
    <div class="mod">…</div>
    <div class="mod">…</div>
    <div class="mod">…</div>
  </div>
</div>
```

### 小节 06 薪酬待遇（大数字横排 + 图注成组）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">06</span><span class="sec-title">薪酬待遇</span></div>
  <p>[必填] 总述段。</p>
  <div class="chart-unit" style="display: flex; gap: 14mm; margin-top: 4mm; border-top: 2px solid var(--fg); padding-top: 4mm;">
    <div>
      <div style="font-family: var(--disp); font-weight: 900; font-size: 30pt; color: var(--accent); line-height: 1.05;">[必填] 6–15k</div>
      <div style="font-size: 8.5pt; margin-top: 1.5mm;">[必填] 起薪区间说明</div>
    </div>
    <div>
      <div style="font-family: var(--disp); font-weight: 900; font-size: 30pt; color: var(--chart-3); line-height: 1.05;">[必填] 40%</div>
      <div style="font-size: 8.5pt; margin-top: 1.5mm;">[必填] 涨幅说明</div>
    </div>
    <div class="note" style="align-self: end; flex: 1;">注：[必填] 数据来源与浮动说明。</div>
  </div>
</div>
```

### 小节 07 职业发展路径（pathmap SVG + 四栏说明）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">07</span><span class="sec-title">职业发展路径</span></div>
  <div class="pathmap">
    <svg viewBox="0 0 744 132" role="img" aria-label="[必填] 路径图说明">
      <path d="M 60 108 L 246 84 L 432 56 L 618 24" fill="none" style="stroke: var(--accent);" stroke-width="2.5"/>
      <circle cx="60" cy="108" r="6.5" style="fill: var(--accent);"/>
      <circle cx="246" cy="84" r="6.5" style="fill: var(--accent);"/>
      <circle cx="432" cy="56" r="6.5" style="fill: var(--accent);"/>
      <circle cx="618" cy="24" r="8" style="fill: var(--chart-3);"/>
      <circle cx="618" cy="24" r="13" fill="none" style="stroke: var(--chart-3);" stroke-width="1"/>
      <text x="60" y="128" style="font-family: var(--mono); fill: var(--muted);" font-size="11" letter-spacing="1">[必填] 1–3 年</text>
      <text x="246" y="104" style="font-family: var(--mono); fill: var(--muted);" font-size="11" letter-spacing="1">[必填] 3–5 年</text>
      <text x="432" y="76" style="font-family: var(--mono); fill: var(--muted);" font-size="11" letter-spacing="1">[必填] 5–10 年</text>
      <text x="618" y="52" style="font-family: var(--mono); fill: var(--muted);" font-size="11" letter-spacing="1">[必填] 10 年+</text>
      <text x="60" y="94" style="font-family: var(--disp); font-weight: 700; fill: var(--fg);" font-size="16">[必填] 阶段一</text>
      <text x="246" y="70" style="font-family: var(--disp); font-weight: 700; fill: var(--fg);" font-size="16">[必填] 阶段二</text>
      <text x="432" y="42" style="font-family: var(--disp); font-weight: 700; fill: var(--fg);" font-size="16">[必填] 阶段三</text>
      <text x="640" y="29" style="font-family: var(--disp); font-weight: 700; fill: var(--chart-3);" font-size="16">[必填] 阶段四</text>
    </svg>
    <div class="path-cols">
      <p>[必填] 阶段一说明。</p>
      <p>[必填] 阶段二说明。</p>
      <p>[必填] 阶段三说明。</p>
      <p>[必填] 阶段四说明。</p>
    </div>
  </div>
</div>
```

- 路径固定 4 阶段；终点节点+终段标题用青绿 `--chart-3`，其余节点主色。
- SVG 坐标系与节点排布已锁定，只换文字；增减阶段需整体重排坐标（回原型调试）。

### 小节 08 准入门槛（mod-grid 两格，同 05 结构）

### 小节 09 专业优势（adv-band 四格色带）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">09</span><span class="sec-title">专业优势</span></div>
  <p style="margin-bottom: 4mm;">[必填] 引入句。</p>
  <div class="adv-band">
    <div class="adv-cell"><div class="adv-no">ADV. 01</div><div class="adv-t">[必填] 优势</div><p>[必填] 说明。</p></div>
    <div class="adv-cell"><div class="adv-no">ADV. 02</div><div class="adv-t">[必填] 优势</div><p>[必填] 说明。</p></div>
    <div class="adv-cell"><div class="adv-no">ADV. 03</div><div class="adv-t">[必填] 优势</div><p>[必填] 说明。</p></div>
    <div class="adv-cell"><div class="adv-no">ADV. 04</div><div class="adv-t">[必填] 优势</div><p>[必填] 说明。</p></div>
  </div>
</div>
```

- adv-band 固定 4 格、驼色系（`--chart-2`），是数据辅色用于非图表组件的**唯一特例**（用户锁定）。

### 小节 10 什么样的人更适合（trait 六格色块卡）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">10</span><span class="sec-title">什么样的人更适合</span></div>
  <div class="trait">
    <div class="trait-cell"><div class="trait-t">[必填] 特质</div><p>[必填] 说明。</p></div>
    <!-- 6 格；奇数格主色系、偶数格青绿系（:nth-child 自动交替） -->
  </div>
</div>
```

### 小节 11 了解行业及岗位（mod-grid.cols-3 三格）

```html
<div class="sec">
  <div class="sec-head"><span class="sec-no">11</span><span class="sec-title">了解行业及岗位</span></div>
  <div class="mod-grid cols-3">
    <div class="mod"><div class="mod-h"><span class="mh-name">[必填] 渠道一</span></div><p>[必填] 说明。</p></div>
    <div class="mod"><div class="mod-h"><span class="mh-name">[必填] 渠道二</span></div><p>[必填] 说明。</p></div>
    <div class="mod"><div class="mod-h"><span class="mh-name">[必填] 渠道三</span></div><p>[必填] 说明。</p></div>
  </div>
</div>
```

### 页底可选：下期预告（最后一个岗位详情页）

```html
<div class="pin-bottom" style="border-top: 2px solid var(--fg); padding-top: 3mm;">
  <div style="font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.14em; color: var(--muted);">NEXT ISSUE · 下期预告</div>
  <p style="font-size: 9pt; line-height: 1.8; margin-top: 2mm;">[必填] 岗位档案 [编号] · [下一岗位名]——[一句话预告]。</p>
</div>
```

---

## 对开配对规则（build 脚本按此执行）

1. 封面 M00|M01 → 序 M02|M03 → 目录 M04|M05 → PART 01 幕封 M06|M07 → **PART 01 数据页两两配对**（M08–M13 按内容 JSON 的 chart 类型选择，左页接偶数页码）→ PART 02 幕封 M06|M14 → 每岗位 M15|M16 开篇对开 → M17 详情页两两成对。
2. M17 详情页数为奇数时，末页右页补 **closing 页**（下期预告 / 结语引文，白底 + `.pullquote.tint`）。
3. 页码铁律（12mm）、图注成组、出血页删 folio 三条在配对后逐页复查——validate 脚本自动检查。
