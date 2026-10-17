# Layouts · 页面骨架库（L00–L11）

手册的**版式锁**。每张骨架都是完整可粘贴的 `.spread` / `.page` 代码块，粘贴到模板的 `<!-- SLOT: 页面骨架占位 -->` 处，替换 `[必填]` 与示例文案即可。

> ⚠️ 这些类只在 `assets/template.html` 的 `<style>` 里有定义。**模板是类名唯一来源**——不要发明新类名，缺类请在模板 `<style>` 里补，不要每页 inline 重写。

---

## Pre-flight 类名清单（每张骨架开头检查）

使用任何骨架前，先确认模板 `<style>` 里存在以下类。**遗漏 = 样式静默丢失**（表格挤成一团、图表条不显示、页脚错位）。

**框架类（永远在）**：`.stage` `.spread` `.page` `.page.left` `.page.right` `.page.wide` `.page-head` `.ph-tag` `.ph-title` `.page-foot` `.pf-tag` `.pf-num`

**排版类**：`.h-kicker` `.h-title` `.h-sub` `.lead` `.body` `.muted` `.mono` `.hairline` `.quote` `.q-src` `.fig-note` `.tag` `.tag.on`

**组件类**：`.stat-grid` `.stat-grid.cols-4` `.stat-cell` `.st-num` `.st-unit` `.st-label` `.bar-chart` `.bar-row` `.bar-label` `.bar-track` `.bar-fill` `.bar-value` `.b-unit` `.dp-hero` `.fig-cap` `.donut-wrap` `.donut-box` `.donut` `.donut-hole` `.donut-legend` `.lg-row` `.lg-dot` `.lg-name` `.lg-val` `.tbl` `.pillar-grid` `.pillar` `.pl-title` `.pl-desc` `.pl-tags`

**第一部分数据页专属**：`.data` `.dp-kicker` `.dp-title` `.dp-note` `.dp-rule` `.dp-module`（`.no-gap`）`.data-run` `.data-run-no` `.data-run-title` `.reading-block` `.rd-item` `.rd-head` `.rd-body` `.rd-cont` `.edu-reading`

**版式类**：`.spread.cover` `.cov-back` `.cb-notes` `.cb-foot` `.cov-front` `.cv-photo` `.cv-img` `.cv-band` `.cv-logo` `.cv-year`（内联 SVG wrapper，`color: var(--cov-year)`）`.cv-badge` `.cv-title` `.cv-sub` `.cv-redline` `.cv-tagline` `.cv-stats` `.preface` `.pf-hero` `.pf-head` `.pf-body` `.pf-sign` `.toc` `.toc-part` `.toc-part-tag` `.toc-row` `.toc-nb` `.toc-t` `.toc-pg` `.spread.single` `.page.divider-p` `.dv-kicker` `.dv-num` `.dv-title` `.dv-lead` `.dv-line` `.dv-meta` `.dv-img` `.job-cover` `.jc-img` `.jc-no` `.jc-title` `.jc-sum` `.jc-meta` `.jm-label` `.jm-val` `.job-detail` `.jd-head` `.jd-no` `.jd-title` `.jd-sub` `.jd-run` `.jd-run-no` `.jd-run-title` `.job-sec` `.js-head` `.js-nb` `.js-title` `.js-body` `.js-tags` `.js-fig` `.js-progress`

---

## 骨架总览

| 骨架 | 用途 | 备注 / 图位 |
|---|---|---|
| **L00** Cover 封面+封底 | 整版宽页：左半封底 / 右半封面 | 图位：封面专业主视觉大图 |
| **L01+L02** 序+目录 | 左页序 / 右页目录 = 一个对开 | 序页图位：通栏配图（可省）；目录锚点与正文 `id` 一一对应 |
| **L03s** Part Divider 单页幕封 | accent 满版单页（`.spread.single` 待拼版） | 可选低透明纹理图 |
| **L04** Data Overview 数据总览 | 三大方向 + 总岗位数大字 | 图1 环形图 + 三卡（不配照片） |
| **L05** City Tiers 城市等级 | 四档占比 + 条形图 | 图2（不配照片） |
| **L06** Company Types 公司类型 | 五档企业规模 | 图3（不配照片） |
| **L07** Education 学历要求 | 本科/硕士 + 学历条 | 图4（不配照片） |
| **L08** Experience 工作经验 | 不限/1-3/3-5 年 + 条形图 | 图5（不配照片） |
| **L09** Skill Map 技能图谱 | 三支柱卡片 | 图7（不配照片） |
| **L10** Job Cover 岗位封面 | 岗位名 + 岗位综述 + 关键信息 | 图位：岗位场景主图 |
| **L11** Job Detail 岗位详解 | 12 段式内容页，按字符预算自动分页 | 图位：每岗位 1 张场景小图 |

---

## 溢出纪律（每页必守）

- 每页内容必须**完整落在 210×285 内**：正文 ≥ 9pt，底部页码带（`.page-foot` 在 bottom:10mm）上方的内容不能顶到它。
- **一页一个主体**：内容不跨页自然流动。溢出先删内容 / 拆页，**禁止**靠压字号硬塞。
- 页码带上方预留 ≥ 8mm 呼吸：`.job-sec` 或表格最后一行不要贴进页码带。
- 数据页文字 ≥ 9pt，表格字 ≥ 8pt，图注 ≥ 7.5pt（印刷下限）。
- **唯一分页约束 = 内容底部距页码分割线留白 ∈ [6,14]mm（用户锁定，最高优先级）**：
  - 每页内容（含页头/顶图/正文/图表）底面到页码分割线（`.page-foot` 上缘）的留白必须落在 **[6,14]mm** 带内。
  - 内容一页放不下时**「能放多少放多少」**，余下续排换页；**仅图表原子化放不下时整表换页**。
  - 触到留白**下限 6mm** 才启动新页（build 脚本 `WS_MIN=6`，逐行填满 → 实际落在 [6,11.1)mm 带内）；留白 >14mm 时回拉下一节首段/首行/首子标（`PULL_LEEWAY=14`）。
  - build 脚本按此流式分页，改内容时勿手算，交给 build 脚本。

---

## 第一部分数据页排版纪律（用户锁定，硬性）

> 三条必须遵守，build 脚本已按此实现：

1. **页头**：除幕封和顶部带图页外，第一部分**所有页顶部都有页头**（文字在上、分割线在下，同第二部分 `.jd-run`）。带图页标题之上的顶图 `.dp-hero-full` 本身兼作页头；纯数据页用 `.data-run`（band 首页的 `.dp-title` 兼作页头）。
2. **模块间距 12mm**：第一部分模块之间统一 `margin-top:12mm`（`.dp-module`）；页首模块（紧跟标题的那块）加 `.no-gap` 取消顶部留白。
3. **上文后图表**：所有「图解块」一律**文字在上、图表在下**堆叠，**禁止**左图右文/两栏平铺（edu 已去 `.data-2col` 改堆叠）。图表/柱状图**多色相话**：`.bar-fill` 用 `var(--bar)`（build 脚本 `segColor(i)` 按序注入不同色相，非单一 accent）。

**真实 mm 分页常量（build 脚本，已实测校准）**：`MODULE_GAP=12`、`DATA_RUN_H=19`（续页页头）、`DATA_BUDGET=262`（续页内容预算，含页头 19mm）、`DATA_BUDGET_FIRST=148`（band 首页，顶图 113.8mm）、`DATA_TITLE_H=22`、`RD_HEAD_H=7.6`、`LINE_H=5.11`、`CHARS=54`、`PULL_LEEWAY=14`（页底余量 >14mm 时回拉下一节首段/首行/首子标）；`rdItemH(t,first)=RD_HEAD_H + max(1,ceil(len/54))*LINE_H + (first?RD_FIRST_TOP:RD_ITEM_TOP)`（含块底部边距，修复 01.5 重叠的根因）。改内容时勿手算，交给 build 脚本。

**Part-1 连续流式排版（用户锁定，build 脚本 renderDataFlow）**：内容逐单元连续流动，各标题不独占一页、一个标题紧跟下一个，图表紧跟其所在阅读块**同页**渲染、不单独成页、不重复标题/描述。阅读块按「能放多少放多少」**逐行拆分**跨页续排（header 随首行首页，续页不重复小标）；**仅图表原子化放不下时整表换页**。**页数无奇数/偶数硬约束，完全由实际内容按 [6,14]mm 留白带撑出**；幕封无「必须落左页」约束（build 脚本已移除 `flushPages` 配对奇数化与岗位 `fixParity`/`splitAt` 全局奇偶调平）。真实流（智能制造 6 数据页）：P2=01.1（hero+5 readings+donut）、P3=01.4+01.5+01.6 依内容续排……

---

## L00 · Cover 封面+封底（整版宽页：左半封底 / 右半封面，印刷惯例）

版式依据 Figma 设计稿 1:1 锁定：封底主蓝色块（下缘露 mist 色带）；封面照片 MULTIPLY
混合于主蓝 + 底部白带（标语/数据行/小年份）；红色装饰线从折线起向右。所有元素绝对
定位，坐标已烘焙在模板 CSS 中，只换文字与图片。

```html
<section class="spread cover" id="sp-cover">
  <!-- 左半 = 封底 -->
  <div class="cov-back">
    <div class="cb-foot">CAREER HANDBOOK · [年份]</div>
    <div class="cb-notes">
      <p>[封底简介第一段：手册定位、面向谁、回答哪三个问题]</p>
      <p>[封底简介第二段：全书结构与使用方式]</p>
    </div>
  </div>
  <!-- 右半 = 封面 -->
  <div class="cov-front">
    <div class="cv-photo"><img class="cv-img" src="images/cover-main.jpg" alt="[专业] 主视觉" /></div>
    <div class="cv-band"></div>
    <img class="cv-logo" src="images/logo-placeholder.svg" alt="校徽" />
    <div class="cv-year" aria-hidden="true"><svg viewBox="0 0 [w] [h]" fill="currentColor">…2026 大年份路径…</svg></div>
    <div class="cv-badge"><b>[手册名，如：职业发展手册]</b><span>[英文，如：CAREER HANDBOOK]</span></div>
    <h1 class="cv-title">[专业名]</h1>
    <div class="cv-sub">[副标题，如：××学院各专业职业发展的全景引导]</div>
    <div class="cv-redline"></div>
    <div class="cv-tagline">[一句话标语]</div>
    <div class="cv-stats"><span>[数据点 1]</span><i class="sep"></i><span>[数据点 2]</span><i class="sep"></i><span>[数据点 3]</span></div>
  </div>
</section>
```

- `id="sp-cover"` 是目录锚点，勿改。封面/封底无页码。
- 封面/封底文字统一用**阿里巴巴普惠体 3.0**（`--cov-font`，6 字重已内嵌 `assets/fonts/`，
  PDF 自动子集内嵌 = 转曲）；大年份是设计稿**转曲 SVG**（内联 `.cv-year`，`fill="currentColor"`，
  颜色随 `--cov-year` 主题 token 走，矢量不糊）。
- 角标仅封底保留 `.cb-foot`（封面不设角标），与序页 `.page-foot` 同规格
  （8pt / 反白 / hairline / 顶部 10mm）；封底全部内容距左 12mm、距中线 12mm；
  封面全部内容距中线 12mm。
- 封面照片以 **MULTIPLY 混合**叠加在主蓝（`--cov-ink`）上，并按设计稿裁切（取原图右
  61%，`.cv-img` 的负偏移已烘焙，`object-fit: cover` 不变形）；**全出血图 ≥300dpi
  等效**（封面显示区 208.7×228mm ⇒ 源图 ≥4050×2700px）；无图时删除 `<img class="cv-img">`，蓝底仍在。
- 校徽 SVG 用 `<img>` 引入（白色版）；无 logo 时删除 `.cv-logo`。仓库内置中性**占位校徽** `images/logo-placeholder.svg`（build 自动同步），可分享；正式发布请放入真实校徽图（建议白色版 SVG）。
- 封面配色走 `--cov-*` 专属 token（主蓝/年份蓝/红线/mist 色带/白带文字层），随主题覆盖。
- 封底两段简介带白色方块 bullet，位置锁定在下部；不要增删段落数。

---

## L01+L02 · 序+目录（左页序 / 右页目录 = 一个对开）

```html
<section class="spread" id="sp-preface">
  <div class="page left" data-layout="L01" id="preface-1">
    <div class="preface">
      <div class="page-head"><span class="ph-tag">序 · PREFACE</span><span class="ph-title">职业发展手册</span></div>
      <figure class="pf-hero">
        <img src="images/02-preface.jpg" alt="[序页配图说明]" />
        <figcaption class="fig-note">[图注与图源，如：Wikimedia Commons（CC BY-SA）]</figcaption>
      </figure>
      <div class="pf-head">
        <div class="h-kicker">序</div>
        <h2 class="h-title">致正在规划职业道路的你</h2>
      </div>
      <div class="pf-body">
        <p>[序言节选，3–4 段，须控制在本页容量内]</p>
      </div>
      <div class="pf-sign">[编写署名与日期]</div>
    </div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">[页码]</span></div>
  </div>

  <div class="page right" data-layout="L02" id="sp-toc">
    <div class="toc">
      <div class="page-head"><span class="ph-tag">目录 · CONTENTS</span><span class="ph-title">职业发展手册</span></div>
      <div class="h-kicker">目录</div>
      <h2 class="h-title">Contents</h2>
      <div class="toc-part">
        <div class="toc-part-tag">第一部分</div>
        <a class="toc-row" href="#sp-data-1">
          <span class="toc-nb">01.1</span>
          <span class="toc-t">[小节名]<small>[小节概述]</small></span>
          <span class="toc-pg">[页码]</span>
        </a>
      </div>
      <div class="toc-part">
        <div class="toc-part-tag">第二部分</div>
        <a class="toc-row" href="#sp-job-1"><span class="toc-nb">02.1</span><span class="toc-t">[岗位名]</span><span class="toc-pg">[页码]</span></a>
      </div>
    </div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">[页码]</span></div>
  </div>
</section>
```

- 序页图位：`.pf-hero` 通栏顶部配图（高 62mm，≥200dpi 等效）。**无图时整个 `<figure>` 删掉**（`:not(:has(img))` 兜底隐藏）。
- 序言必须放进**一个左页**：图 + 3–4 段节选为限；长序言只节选，全文不进手册。
- **目录锚点必须与正文 `<section>` / `.page` 的 `id` 一一对应**——校验脚本会查；`.toc-pg` 页码须与正文 `.pf-num` 一致。

---

## L03s · Part Divider 单页幕封（accent 满版单页，待拼版）

```html
<section class="spread single" id="sp-part1">
  <div class="page left divider-p" data-layout="L03s" id="sp-part1-page">
    <div class="dv-geo"></div>     <!-- 瑞士几何：出血大圆环（同心小圆） -->
    <div class="dv-cross"></div>   <!-- 瑞士几何：细十字准线 -->
    <div class="dv-kicker">第一部分 · PART ONE</div>
    <div class="dv-num">01</div>
    <h2 class="dv-title">就业市场现状与<br />岗位需求分析</h2>
    <p class="dv-lead">[幕封导语，一句话概括本部分]</p>
    <div class="dv-line"></div>
    <div class="dv-meta">职业发展手册 · [专业名]</div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">01</span></div>
  </div>
</section>
```

- 幕封是 accent 满版**单页**，**计入页码且显示反白页码**（`.page-foot` 反白变体，与正文页同规格：左页外缘左下）。
- `.dv-geo`（出血大圆环）与 `.dv-cross`（十字准线）为固定瑞士几何装饰，纯白 hairline、低透明，不喧宾夺主；两元素必须有。
- `.spread.single` 表示右半待拼版（屏幕显示折线虚线提示，打印自动隐藏）。
- 第二部分幕封：`id="sp-part2"`，`.dv-kicker` 写「第二部分 · PART TWO」，`.dv-num` 写 `02`。
- 可选图位：`<img class="dv-img">` 全出血但 **opacity 0.14**（低饱和纹理，不抢字）；无图不放。
- 全量拼版时，幕封仍独占单页（其后的内容页从下一对开开始两两配对）。

---

## L04 · Data Overview 数据总览（图1 岗位分布环形图）

> 样板 band 模式（Figma 1312:2927「第一部分」）：满版出血顶图 + 16pt/700 深蓝标题（`--cov-ink`）+ 10pt 数据来源 + 全宽发丝线 `.dp-rule` + 3 个阅读块（3×3mm 铜色方块 `--marker` + 11pt/600 铜色小标题 + 10pt 正文）+ 图表（置于文本下方，不被灰块尺寸局限）。band 模式 `layout` 追加 `band`，build 脚本自动插入 `.dp-rule` 并把 `reading` 排到图表之前。

```html
<section class="spread" id="sp-data-1">
  <div class="page left" data-layout="L04 band" id="data-overview">
    <div class="data">
      <img class="dp-hero-full" src="images/data-hero.jpg" alt="[满版顶图说明]" />
      <h2 class="dp-title">01.1 行业整体招聘数据概览</h2>
      <p class="dp-note">[数据来源与统计说明]</p>
      <div class="dp-rule"></div>

      <div class="reading-block">
        <div class="rd-item"><h3 class="rd-head">[小标题]</h3><p class="rd-body">[解读段落]</p></div>
        <!-- 每块：3×3mm --marker 方块（.rd-head::before）+ 11pt/600 铜色标题 + 10pt 正文 -->
      </div>

      <div class="fig-cap">图1 · 新能源汽车工程专业岗位分布图</div>
      <div class="donut-wrap">
        <div class="donut-box">
          <div class="donut" style="background: conic-gradient(
            color-mix(in oklab, var(--accent) 100%, #fff) 0deg 214.45deg,
            color-mix(in oklab, var(--accent) 76%, #fff) 214.45deg 315.11deg,
            color-mix(in oklab, var(--accent) 56%, #fff) 315.11deg 333.72deg,
            color-mix(in oklab, var(--accent) 40%, #fff) 333.72deg 347.83deg,
            color-mix(in oklab, var(--accent) 27%, #fff) 347.83deg 355.79deg,
            color-mix(in oklab, var(--accent) 17%, #fff) 355.79deg 359.24deg,
            color-mix(in oklab, var(--accent) 9%, #fff) 359.24deg 360deg);"></div>
          <div class="donut-hole"><b>7,731</b><span>岗位总量</span></div>
        </div>
        <div class="donut-legend">
          <div class="lg-row"><span class="lg-dot" style="background:color-mix(in oklab, var(--accent) 100%, #fff)"></span><span class="lg-name">质量监督</span><span class="lg-val">4,605 · 59.57%</span></div>
          <!-- 每段一行：lg-dot 色 = 该段 conic 色；lg-val = 数量 · 占比 -->
        </div>
      </div>
    </div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">[页码]</span></div>
  </div>
</section>
```

**环形图纪律（多段空心饼图）**：
- 每段角度 = 占比 × 3.6°，**累加**生成 conic-gradient 色标，由 build 脚本从 `segs` 数据自动计算，禁止肉眼估。
- 段色 = accent 明度梯度（color-mix 100/76/56/40/27/17/9%），同色族低饱和，印刷安全；最多 7 段。
- 空心结构：`.donut` 用 mask 挖空（环宽 ≈ 20mm 半径的 39%），中心 `.donut-hole` 放总数 + 单位。
- 图例每段一行：色点与 conic 段色一一对应，数值 = `数量 · 占比%`，缺一不可。
- 可选 `.dp-hero` 通栏插图（16:9，内容宽，页眉之下标题之上）；解读文字直接排 `.body`，**不加「解读」小标题**。

---

## L05 · City Tiers 城市等级（图2 · 不配照片）

```html
<section class="spread" id="sp-data-2">
  <div class="page left" data-layout="L05" id="data-city">
    <div class="data">
      <div class="page-head"><span class="ph-tag">一 · 就业市场现状</span><span class="ph-title">职业发展手册</span></div>
      <div class="dp-kicker">02 · 城市等级</div>
      <h2 class="dp-title">岗位主要分布在<br />二线与新一线城市</h2>
      <p class="dp-note">[数据来源与统计说明]</p>

      <div class="bar-chart" style="--max:50.95">
        <div class="bar-row">
          <span class="bar-label">二线<small>3,959 个</small></span>
          <div class="bar-track"><div class="bar-fill" style="--v:50.95"></div></div>
          <span class="bar-value">50.95<b class="b-unit">%</b></span>
        </div>
        <div class="bar-row">
          <span class="bar-label">新一线<small>3,128 个</small></span>
          <div class="bar-track"><div class="bar-fill" style="--v:40.46"></div></div>
          <span class="bar-value">40.46<b class="b-unit">%</b></span>
        </div>
        <div class="bar-row">
          <span class="bar-label">三线及以下<small>343 个</small></span>
          <div class="bar-track"><div class="bar-fill" style="--v:4.44"></div></div>
          <span class="bar-value">4.44<b class="b-unit">%</b></span>
        </div>
        <div class="bar-row">
          <span class="bar-label">一线<small>321 个</small></span>
          <div class="bar-track"><div class="bar-fill" style="--v:4.15"></div></div>
          <span class="bar-value">4.15<b class="b-unit">%</b></span>
        </div>
      </div>
    </div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">[页码]</span></div>
  </div>
</section>
```

**条形图纪律**：
- 容器声明一次 `--max`（所有条共用一个基线）；每根条内联 `--v` = 真实数值。
- 条宽 `calc(var(--v)/var(--max)*100%)`，**由数据计算，禁止 magic number**（`--v/--max` 必须是纯数字，单位「% / 万个」只放在 `.bar-value` 文本里）。
- 每个数据点必须同时有**类别标签**（`.bar-label`）和**数值标签**（`.bar-value`，在条外独立元素，不藏在条内）。
- **多色相**：每根条内联 `--bar`（如 `--bar:var(--c1)` / `var(--c2)` / `var(--c3)`，build 脚本 `segColor(i)` 自动按序注入），`.bar-fill` 背景用 `var(--bar)`——同一图表内多色相区分，非单一 accent。

---

## L06 · Company Types 公司类型（图3 · 不配照片）

结构同 L05，换数据。按数据量排序（大到小），图表用左侧条形图或 stat-grid：

```html
      <div class="stat-grid cols-4" style="margin-top:7mm">
        <div class="stat-cell"><div class="st-num">25.97<b>%</b></div><div class="st-label">中型企业 · 1,993</div></div>
        <div class="stat-cell"><div class="st-num">24.68<b>%</b></div><div class="st-label">小型企业 · 1,894</div></div>
        <div class="stat-cell"><div class="st-num">19.74<b>%</b></div><div class="st-label">大型企业 · 1,515</div></div>
        <div class="stat-cell"><div class="st-num">8.08<b>%</b></div><div class="st-label">超大型企业 · 620</div></div>
      </div>
```

- 超过 4 档的数据用 `.bar-chart`（L05 模式），≤4 档且无对比意图可用 `.stat-grid cols-4`。
- 若要体现「超大型 ≠ 大型」层级，把剩余未达 100% 的差值在 `.dp-note` 注明（如「其余未分类」）。

---

## L07 · Education 学历要求（图4 · 不配照片）

> 用户锁定：**上文后图表，堆叠**（禁左图右文/两栏平铺）。文字块用 `.edu-reading`，图表在文字下方。

```html
      <div class="dp-module no-gap">
        <div class="reading-block edu-reading">
          <div class="rd-item"><p class="rd-body">[学历解读段落：本科为主、硕士及以上的场景化要求，直接排，无「解读」小标题]</p></div>
        </div>
      </div>
      <div class="dp-module">
        <div class="bar-chart" style="--max:47.05">
          <div class="bar-row">
            <span class="bar-label">本科</span>
            <div class="bar-track"><div class="bar-fill" style="--bar:var(--c1);--v:47.05"></div></div>
            <span class="bar-value">47.05<b class="b-unit">%</b></span>
          </div>
          <div class="bar-row">
            <span class="bar-label">硕士及以上</span>
            <div class="bar-track"><div class="bar-fill" style="--bar:var(--c3);--v:2.14"></div></div>
            <span class="bar-value">≈2<b class="b-unit">%</b></span>
          </div>
        </div>
      </div>
```

---

## L08 · Experience 工作经验（图5 · 不配照片）

结构同 L05，数据：

| 档位 | 数值 |
|---|---|
| 3–5 年 | 33.67% · 2,558 |
| 1–3 年 | 26.77% · 2,034 |
| 不限 | 17.11% · 1,299 |

```html
      <div class="bar-chart" style="--max:33.67">
        <div class="bar-row">
          <span class="bar-label">3–5 年<small>2,558 个</small></span>
          <div class="bar-track"><div class="bar-fill" style="--v:33.67"></div></div>
          <span class="bar-value">33.67<b class="b-unit">%</b></span>
        </div>
        <div class="bar-row">
          <span class="bar-label">1–3 年<small>2,034 个</small></span>
          <div class="bar-track"><div class="bar-fill" style="--v:26.77"></div></div>
          <span class="bar-value">26.77<b class="b-unit">%</b></span>
        </div>
        <div class="bar-row">
          <span class="bar-label">不限<small>1,299 个</small></span>
          <div class="bar-track"><div class="bar-fill" style="--v:17.11"></div></div>
          <span class="bar-value">17.11<b class="b-unit">%</b></span>
        </div>
      </div>
```

---

## L09 · Skill Map 技能图谱（图7 · 不配照片）

```html
<section class="spread" id="sp-data-7">
  <div class="page wide" data-layout="L09" id="data-skill">
    <div class="data">
      <div class="page-head"><span class="ph-tag">一 · 就业市场现状</span><span class="ph-title">职业发展手册</span></div>
      <div class="dp-kicker">06 · 核心技能需求分析</div>
      <h2 class="dp-title">三大能力支柱</h2>

      <div class="pillar-grid">
        <div class="pillar">
          <div class="pl-title">专业技术</div>
          <div class="pl-desc">[支柱说明]</div>
          <div class="pl-tags">
            <span class="tag">[技能1]</span><span class="tag">[技能2]</span><span class="tag">[技能3]</span>
          </div>
        </div>
        <div class="pillar">
          <div class="pl-title">软件工具</div>
          <div class="pl-desc">[支柱说明]</div>
          <div class="pl-tags">
            <span class="tag">[软件1]</span><span class="tag">[软件2]</span>
          </div>
        </div>
        <div class="pillar">
          <div class="pl-title">综合素养</div>
          <div class="pl-desc">[支柱说明]</div>
          <div class="pl-tags">
            <span class="tag">[素养1]</span><span class="tag">[素养2]</span><span class="tag">[素养3]</span>
          </div>
        </div>
      </div>
    </div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">[页码]</span></div>
  </div>
</section>
```

---

## L10 · Job Cover 岗位封面

```html
<section class="spread" id="sp-job-1">
  <div class="page left" data-layout="L10" id="job-1-cover">
    <div class="job-cover">
      <img class="jc-img" src="images/04-job-1.jpg" alt="[岗位名] 场景" />
      <div class="page-head" style="position:relative"><span class="ph-tag">二 · 主要就业岗位详解</span><span class="ph-title">职业发展手册</span></div>
      <div class="jc-no">02.1 · JOB PROFILE</div>
      <h2 class="jc-title">[岗位名，如：新能源汽车设计工程师]</h2>
      <p class="jc-sum">[岗位综述：一句话定位这个岗位]</p>

      <div class="jc-meta">
        <div><div class="jm-label">准入门槛</div><div class="jm-val">[学历要求]</div></div>
        <div><div class="jm-label">核心方向</div><div class="jm-val">[方向1] / [方向2]</div></div>
        <div><div class="jm-label">热门度</div><div class="jm-val">[数据]</div></div>
        <div><div class="jm-label">职业路径</div><div class="jm-val">[起点 → 进阶]</div></div>
      </div>
    </div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">[页码]</span></div>
  </div>
</section>
```

- 图位：`.jc-img` 岗位场景主图（右侧 62% 高度，opacity 0.16 低饱和纹理）。图空则整行删掉。

---

## L11 · Job Detail 岗位详解（12 段式）

**12 段分页规则**：一个岗位详解约 2–3 页，每页放 3–4 段（`data-layout="L11"`），段序必须连续、每页从当前段数起。左/右页交替，页码连续。

**第 1 页（段 01–04：岗位综述 / 一天 / 工作职责 / 行业前景）**：

```html
<section class="spread" id="sp-job-1-detail">
  <div class="page left" data-layout="L11" id="job-1-p1">
    <div class="job-detail">
      <div class="page-head"><span class="ph-tag">二 · 主要就业岗位详解</span><span class="ph-title">职业发展手册</span></div>
      <div class="jd-head">
        <div class="jd-no">02.1 · 新能源汽车设计工程师</div>
        <h2 class="jd-title">岗位综述</h2>
      </div>

      <div class="job-sec">
        <div class="js-head"><span class="js-nb">01</span><span class="js-title">岗位综述</span></div>
        <div class="js-body"><p>[岗位综述正文]</p></div>
      </div>

      <div class="job-sec">
        <div class="js-head"><span class="js-nb">02</span><span class="js-title">新能源汽车设计工程师的一天</span></div>
        <div class="js-body"><p>[一天的工作流程描述]</p></div>
      </div>

      <div class="job-sec">
        <div class="js-head"><span class="js-nb">03</span><span class="js-title">工作职责</span></div>
        <div class="js-body"><p>[主要工作职责]</p></div>
      </div>

      <div class="job-sec">
        <div class="js-head"><span class="js-nb">04</span><span class="js-title">行业前景</span></div>
        <div class="js-body"><p>[行业前景分析]</p></div>
      </div>
    </div>
    <div class="page-foot"><span class="pf-tag">职业发展手册</span><span class="pf-num">[页码]</span></div>
  </div>
</section>
```

**第 2 页（段 05–08）**：同结构，`js-nb` 写 `05`–`08`。`05 生活状态` 建议配 1 张岗位场景小图：

```html
      <div class="job-sec">
        <div class="js-head"><span class="js-nb">05</span><span class="js-title">设计师的生活</span></div>
        <div class="js-body"><p>[生活状态描述]</p></div>
        <figure class="js-fig">
          <img src="images/05-job-1-scene.jpg" alt="[场景] 工作现场" />
          <figcaption class="fig-note">[图注]</figcaption>
        </figure>
      </div>
```

**第 3 页（段 09–12）**：`09 专业优势 / 10 什么样的人适合 / 11 如何了解行业与岗位 / 12 学习规划建议`。其中 `06 薪酬待遇` 用表格：

```html
      <div class="job-sec">
        <div class="js-head"><span class="js-nb">06</span><span class="js-title">薪酬待遇</span></div>
        <table class="tbl">
          <tr><th>职级</th><th>月薪范围</th><th>说明</th></tr>
          <tr><td>[职级1]</td><td class="num">[月薪]</td><td>[说明]</td></tr>
          <tr><td>[职级2]</td><td class="num">[月薪]</td><td>[说明]</td></tr>
        </table>
      </div>
```

**图位（L11）**：`.js-fig`（每岗位 1 张场景小图）。`figure:not(:has(img))` 自动隐藏，图空直接删 `<figure>`。

---

## 粘贴规范（写完自检）

- 每页 `.page` 必须带 `data-layout="Lxx"`（校验脚本查）。
- 每个 `.spread` 必须带 `id="sp-*"`（目录锚点），内页 `.page` 尽量带 `id`。
- 页码 `.pf-num` 全局连续；目录 `.toc-pg` 与之对应。
- 图表所有 `--v` / `--max` / conic-gradient 角度由数据计算。
- 图片相对路径 `images/{页码}-{语义}.{ext}`，不热链。
