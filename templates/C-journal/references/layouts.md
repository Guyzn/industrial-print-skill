# Layouts · 页面骨架库（X00–X18 · 东方学报风）

模版 C 的**版式锁**。每张骨架都是完整可粘贴的 `.spread` / `.page` 代码块，粘贴到模板的 `<!-- SLOT: 页面骨架占位 -->` 处，替换 `[必填]` 与示例文案即可。骨架已从定稿原型（`prototype/journal-prototype.html`，20 页送印水准）逐块提炼，**禁止自由发挥结构**。

> ⚠️ 这些类只在 `assets/template.html` 的 `<style>` 里有定义。**模板是类名唯一来源**——不要发明新类名，缺类先在模板 `<style>` 里补，不要每页 inline 重写。
>
> ⚠️ **数据真实性铁律**：正文全部数值必须来自内容源文档（`/tmp/docx-full.txt` 或同源 docx）。**文档里没有的数值不得编造**；缺失时写定性描述或删去数字，不补造。

---

## Pre-flight 类名清单（每张骨架开头检查）

使用任何骨架前，先确认模板 `<style>` 里存在以下类。**遗漏 = 样式静默丢失**（文武线不出、印章透明、页码错位、竖排目录塌陷）。

**框架类（永远在）**：`.stage` `.spread` `.page` `.page.left` `.page.right` `.page.flex-fill` `.pin-bottom` `.folio` `.wenwu`（`.thin`）`.seal` `.vt`

**排版类**：`.col-title` `.ct-cn` `.body-text`（`.no-indent`）`.dnum` `.note` `.pull` `.pull-src` `.figcap` `.caption-chip` `.img-bleed`

**封面/封底类**：`.cov-frame` `.cov-vtitle` `.cov-vsub` `.cov-seal` `.cov-logo` `.cov-meta` `.cov-strip` `.bc-center` `.bc-foot`

**序/目录类**：`.pf-head` `.pf-sign` `.toc-title` `.toc-part` `.toc-row` `.vtoc` `.vt-part` `.vt-entry` `.glance-strip` `.gs-h` `.gs-row`

**幕封/引文类**：`.dv-watermark` `.dv-vt` `.dv-sum` `.dv-seal` `.q-mark` `.q-body`

**数据页类**：`.hero-num` `.stat-row`（`.top`）`.mod` `.mod-h` `.mod-grid` `.hbar-row`（`.hl` `.ht` `.hf` `.hv`）`.chart-unit` `.donut-row` `.donut-svg` `.donut-legend` `.dl-row` `.dl-dot` `.dl-label` `.dl-val` `.col-chart` `.ccol`（`.acc`）`.ccol-labels` `.firm-grid` `.firm-cell`（`.acc`）`.ladder` `.lad-r`

**岗位档案类**：`.job-band`（`.jb-no` `.jb-title` `.jb-sub`）`.jsec` `.jm-h`（`.jm-no` `.jm-name` `.jm-en`）`.lede` `.day-tab` `.day-row`（`.dt` `.dc`）`.sitem`（`.si-t` `.si-d`）`.slist` `.ditem`（`.dno` `.dt2`）`.sal`（`.sal-c`）`.pway`（`.pw-r` `.pw-t` `.pw-seq` `.pw-step` `.pw-arrow`）

**目录页纵向布局钩子**：`.page[data-layout="X04"]` `.page[data-layout="X05"]`（flex 纵向 + `.vtoc` 贴底）

---

## 骨架总览

| 骨架 | 用途 | 页码 / 备注 |
|---|---|---|
| **X00** 封底 | 居中朱砂印 + 书名 + 底部编写/出品/数据来源 | 00，无 folio；与 X01 同对开 |
| **X01** 封面 | 文武双框 + 校徽 + 竖排大标题 + 干支印 + 年份/副题/数据条 | 01，无 folio |
| **X02** 序 | 卷首栏目标题 + 大字「序」 + 印章 + 文武线 + 四段正文 + 署名 | 02 |
| **X03** 序图 | 整版出血图 + 角注 chip | 03，**删 folio** |
| **X04** 目录·上篇 | 竖排目录 `.vtoc`（自适应 :has）+ 底部口径说明 | 04，页码 build 回填 |
| **X05** 目录·下篇 | 竖排目录 + 贴底速览条 `.glance-strip`（3 行大字） | 05，页码 build 回填 |
| **X06** 幕封 | 水印大字 + 竖排篇章标题 + 章印 + 篇章导语 | 06 |
| **X07** 引文 | 编者按栏目标题 + 朱砂引号大引文 + 页底说明 | 07 |
| **X08** 数据·总量条图 | hero-num 总量 + 结论 + 条图 stat-row + 解读段 | 08 |
| **X09** 数据·城市圆环 | 内容标题 + donut 圆环（环+图例）+ mod-grid 四格 | 09 |
| **X10** 数据·企业大字格 | firm-grid 2×2 大字格（朱砂 acc 一格）+ 解读段 | 10 |
| **X11** 数据·学历细条 | hero-num + hbar 细条图（最高档 acc 满宽）+ 解读段 | 11 |
| **X12** 数据·经验柱图 | col-chart 三柱（峰值 acc 满高）+ 柱下标签 + 解读段 | 12 |
| **X13** 数据·技能阶梯 | ladder 三阶（其一→其三逐级右移）+ 解读段 | 13 |
| **X15** 岗位封面 | 整版出血岗位图 + 底部墨带 job-band + 角注 chip | 14，**删 folio**；与 X17a 同对开 |
| **X17a** 岗位详解一 | 壹综述(首字下沉) · 贰一天(day-tab) · 叁职责(ditem 序数) | 15 |
| **X17b** 岗位详解二 | 肆前景(slist) · 伍生活(slist) · 陆薪酬(sal 三档) | 16 |
| **X17c** 岗位详解三 | 柒路径(pway 分轨链) · 捌门槛(ditem) · 玖优势(slist) | 17 |
| **X17d** 岗位详解四 | 拾特质(ditem) · 拾壹渠道(slist) | 18 |
| **X18** 结语 | 终字水印 + 竖排寄语 + 其壹印 + 拾贰学习规划 + 结语引文 + 下篇预告 | 19 |

页码连续无跳页：00,01 / 02,03 / 04,05 / 06,07 / 08,09 / 10,11 / 12,13 / 14,15 / 16,17 / 18,19。X03 / X15 是出血页**无 folio**，其物理页码仍占位（X03=03、X15=14）。

---

## 溢出纪律（每页必守 · 用户锁定）

- 每页内容必须**完整落在 210×285 内**：正文 ≥ 9pt，表格 ≥ 8pt，图注 ≥ 7pt（印刷下限）。
- **一页一个主体**：内容不跨页自然流动。溢出先删内容 / 拆页 / 换骨架，**禁止**靠压字号硬塞。
- **页码铁律**：`.folio` 定位在 bottom:10mm，页面内容到页码线之间至少留 **12mm** 空白（已含在 `--ink-bottom:26mm` 底距内）。放不下果断换页。
- 目录页（X04/X05）用模板预设的 flex 纵向钩子：`.vtoc` 贴右下，注释/速览贴底，中间自然撑开。
- **图注与图表成组**：`.figcap` 写在图表容器（`.chart-unit`）内部，**禁止**单独 pin 到页底与页码挤在一起。
- 整版出血图页（X03 / X15）**删除 folio**，只留 `.caption-chip`。
- 序正文固定 4 段为宜（3–5 段可调，超 5 段必溢出）；十二段式每段小标题固定（壹→拾贰），段内条目 2–4 条。

## 图表纪律（用户锁定）

- **朱砂 `--seal` 是唯一点缀色**，只用于：印章 `.seal`、序号 `.jm-no`/`.dno`/`.lad-no`、高亮条/柱 `.acc`、图内强调弧段、极小记号。正文与版式框架一律走墨色 `--ink`/`--ink-2`/`--muted`。
- 图表内强调项一律 `.acc`（朱砂），普通项墨色，弱项 `--muted`——**与定稿原型保持一致**，同一手册内同维度图表用色不得漂移。
- **SVG 内禁止使用 `var()` 作 presentation 属性**（`fill=`/`stroke=` 属性不吃 var），一律写 `style="fill: var(--seal);"` 内联样式形式。
- 圆环图：viewBox `0 0 42 42`、r=15.9155（周长≈100），`stroke-dasharray="占比 余量"`、首环 `stroke-dashoffset="25"`，后续环 offset 依次累减；占比 <3% 的最小可视宽度取 2.3% 并在图注中说明。三环色序：seal → ink → muted。
- 条图 `.hbar-row`：最高档 `style="width:100%"` 且 `.hf.acc`（朱砂），其余按占比等比、墨色。
- 柱图 `.col-chart`：峰值柱 `.ccol.acc`（height:100%），其余按占比等比。
- **竖排目录自适应锁死**：`.vtoc` 条目 ≥8（含 07 一览）自动收紧列距/字距/字号（模板 `:has` 已内置），**不要手动加字号覆盖**。目录页码 `.ve-pg` 由 build 回填 `data-pg`，写死页码会验失败。

---

## X00 + X01 · 封底 | 封面（一个对开 · 印刷惯例左封底右封面）

宣纸底、墨色字。所有元素绝对定位，坐标锁定，只换文字与图。封面/封底**无页码**。

```html
<section class="spread" id="sp-cover">

  <!-- 封底 X00 -->
  <div class="page left" data-layout="X00">
    <div class="bc-center">
      <span class="seal">[必填] 印章字</span>
      <div class="nm">[必填] 职业发展手册</div>
    </div>
    <div class="bc-foot">
      [必填] 编写 · ××专业编写组<br />
      [必填] 出品 · ××学校 · ××学院<br />
      [必填] 数据来源 · ××（统计期）<br />
      <span style="font-family:var(--mono);letter-spacing:.2em">[必填] CAREER HANDBOOK · VOL. [年份]</span>
    </div>
  </div>

  <!-- 封面 X01 -->
  <div class="page right" data-layout="X01" style="padding:0">
    <div class="cov-frame"></div>
    <div class="cov-logo"><img src="images/logo-placeholder.svg" alt="[必填] 学校标识"></div>
    <div class="vt cov-vtitle">[必填] 职业发展手册</div>
    <div class="vt cov-vsub">[必填] 专业名称</div>
    <span class="seal cov-seal">[必填] 干支</span>
    <div class="cov-meta">
      <div class="yr">[必填] VOL. 2026 · 第壹辑</div>
      <div class="ttl">[必填] 副题一句话</div>
    </div>
    <div class="cov-strip">
      <span class="cs"><b>[必填] 数据一</b>[必填] 注一</span>
      <span class="cs"><b>[必填] 数据二</b>[必填] 注二</span>
      <span class="cs"><b>[必填] 数据三</b>[必填] 注三</span>
    </div>
  </div>
</section>
```

- `id="sp-cover"` 是目录锚点，勿改。
- X01 必须 `style="padding:0"`（整页出血到边框），其余页面保留模板默认 padding。
- `.cov-frame` 文武双框由 CSS 生成（`.cov-frame::after` 是内层粗线），只留一个空 div。
- 校徽必须是**墨色单色**（彩色 logo 需先转单色再入库）；无校徽时删 `.cov-logo`。仓库内置中性**占位校徽** `images/logo-placeholder.svg`（build 自动同步）——本镜像可分享，**正式发布请换真实墨色单色校徽**。
- 竖排标题 `.cov-vtitle` 是封面唯一大元素（40pt 宋体竖排），字串≤7 字不折行；`.cov-vsub` 竖排小副题，右移 22mm 避让。
- 封面/封底数据必须来自内容源文档，无数据时删对应 `.cs` / 行。

---

## X02 + X03 · 序 | 序图（一个对开）

```html
<section class="spread" id="sp-preface">

  <!-- 序 X02 -->
  <div class="page left" data-layout="X02">
    <div class="col-title"><span class="ct-cn">卷首</span><span>PREFACE</span></div>
    <div class="pf-head">
      <span class="zi">序</span>
      <span class="seal">[必填] 卷首</span>
      <div class="side">
        <div class="a">PREFACE · [必填] 年份</div>
        <div class="b">[必填] 专业名称</div>
      </div>
    </div>
    <div class="wenwu" style="margin-bottom:8mm"></div>
    <div class="body-text">
      <p>[必填] 序正文第一段。</p>
      <p>[必填] 序正文第二段。行业背景与趋势。</p>
      <p>[必填] 序正文第三段。技术 / 政策 / 产业层面。</p>
      <p>[必填] 序正文第四段。寄语 + 本手册使用方法。</p>
    </div>
    <div class="pf-sign">
      <div class="who">[必填] 编写组署名<span class="seal">[必填] 编写</span></div>
      <div class="when">[必填] 署名 · 日期</div>
    </div>
    <div class="folio">— <b>02</b> —</div>
  </div>

  <!-- 序图 X03：整版出血，无 folio -->
  <div class="page right" data-layout="X03" style="padding:0">
    <img class="img-bleed" src="images/preface.jpg" alt="[必填] 图注（示意图）">
    <div class="caption-chip" style="left:12mm;bottom:12mm"><b>FIG. 01 · [必填] 卷首图</b>[必填] 图注（示意图）</div>
  </div>
</section>
```

- X03 在右页，角注用 `left:12mm;bottom:12mm` 贴墨区内下角；若换到左页则改为 `right:12mm;bottom:12mm`。
- 序正文 4 段为宜（3–5 段可调），首段不设首字下沉（学报序体平铺，首字下沉只留给十二段式「壹 综述」的 `.lede`）。
- `.pf-sign` 已 `margin-top:auto` 贴底；署名行内印章 `.seal` 与名字同行。

---

## X04 + X05 · 目录·上篇 | 目录·下篇（一个对开 · 竖排目录）

两页结构一致：栏目标题 + 居中「目 录」+ 文武线 + 竖排目录 `.vtoc` + 贴底注释/速览。**目录页页码 `.ve-pg` 由 build 按实际分页回填 `data-pg`，写死会验失败。**

```html
<section class="spread" id="sp-toc">

  <!-- 目录·上篇 X04 -->
  <div class="page left" data-layout="X04">
    <div class="col-title"><span class="ct-cn">目录</span><span>CONTENTS · 上篇</span></div>
    <div class="toc-title">目 录</div>
    <div class="wenwu" style="margin-bottom:7mm"></div>
    <div class="vtoc">
      <div class="vt-part">
        <span class="vp-name">[必填] 上篇</span>
        <span class="seal">[必填] 壹</span>
        <span class="vp-en">[必填] PART 01 · DATA</span>
      </div>
      <!-- 上篇每章一条；.ve-pg 页码由 build 回填 data-pg -->
      <div class="vt-entry"><span class="ve-no">01</span><span class="ve-tt">[必填] 章名</span><span class="ve-pg" data-pg="08">08</span></div>
      <div class="vt-entry"><span class="ve-no">02</span><span class="ve-tt">[必填] 章名</span><span class="ve-pg" data-pg="09">09</span></div>
    </div>
    <div class="pin-bottom">
      <div class="note">[必填] 上篇数据口径说明。</div>
    </div>
    <div class="folio">— <b>04</b> —</div>
  </div>

  <!-- 目录·下篇 X05 -->
  <div class="page right" data-layout="X05">
    <div class="col-title"><span class="ct-cn">目录</span><span>CONTENTS · 下篇</span></div>
    <div class="toc-title">目 录</div>
    <div class="wenwu" style="margin-bottom:7mm"></div>
    <div class="vtoc">
      <div class="vt-part">
        <span class="vp-name">[必填] 下篇</span>
        <span class="seal">[必填] 贰</span>
        <span class="vp-en">[必填] PART 02 · JOBS</span>
      </div>
      <div class="vt-entry"><span class="ve-no">07</span><span class="ve-tt">[必填] 主要就业岗位一览</span><span class="ve-pg" data-pg="14">14</span></div>
      <div class="vt-entry"><span class="ve-no">08</span><span class="ve-tt">[必填] 岗位一</span><span class="ve-pg" data-pg="15">15</span></div>
    </div>
    <div class="glance-strip">
      <div class="gs-h"><span class="t">[必填] 本期速览</span><span class="e">[必填] AT A GLANCE · 年份</span></div>
      <div class="gs-row"><span class="gn">[必填] 数<small>[必填] 单位</small></span><span class="gd">[必填] 说明。</span></div>
      <div class="gs-row"><span class="gn">[必填] 数<small>[必填] 单位</small></span><span class="gd">[必填] 说明。</span></div>
      <div class="gs-row"><span class="gn">[必填] 数<small>[必填] 单位</small></span><span class="gd">[必填] 说明。</span></div>
    </div>
    <div class="folio">— <b>05</b> —</div>
  </div>
</section>
```

- `.vtoc` 竖排条目高度固定 120mm；条目顺序是**从左到右横读**（`row-reverse` 保证首条贴装订侧），追加条目直接往后加 `.vt-entry`。
- `.ve-pg` 内初始写的是示例页码，build 按分页结果整体回填；条目**总数必须与 `:has` 阈值一致**：≤7 条用默认字距，≥8 条（含 07 一览）自动收紧，**不要手动改字号**。
- X04 贴底是 `.pin-bottom` 的口径说明（上篇数据页多，说明口径即可）；X05 贴底是 `.glance-strip` 速览条（3 行大字，每行 `.gn` 大字 + `.gd` 说明）。
- 速览数字必须来自内容源文档。

---

## X06 + X07 · 幕封 | 引文（一个对开）

```html
<section class="spread" id="sp-divider-1">

  <!-- 幕封 X06 -->
  <div class="page left" data-layout="X06">
    <div class="dv-watermark">[必填] 壹</div>
    <div class="vt dv-vt"><span class="pt-tag">[必填] 上篇</span>[必填] 篇章标题</div>
    <span class="seal dv-seal">[必填] 上篇</span>
    <div class="dv-sum">
      <div class="lab">[必填] PART 01 · 本篇概要</div>
      <div class="tx">[必填] 篇章导语一段。</div>
    </div>
    <div class="folio">— <b>06</b> —</div>
  </div>

  <!-- 引文 X07 -->
  <div class="page right" data-layout="X07">
    <div class="col-title"><span class="ct-cn">[必填] 编者按</span><span>[必填] EDITOR'S NOTE</span></div>
    <div style="margin-top:38mm">
      <div class="q-mark">「</div>
      <div class="q-body">[必填] 大引文第一行，<br />[必填] 大引文第二行。</div>
      <div class="pull-src">—— [必填] 引文出处</div>
    </div>
    <div class="pin-bottom note" style="border-top:.5pt solid var(--border);padding-top:3mm">
      [必填] 页底说明一段。
    </div>
    <div class="folio">— <b>07</b> —</div>
  </div>
</section>
```

- `.dv-watermark` 是 230pt 半透明装饰字（墨色 5.5%），右下出血，不是内容色。
- X06 竖排篇章标题 `.dv-vt` 34pt，`.pt-tag` 是朱砂小标签（上篇/下篇）；印章 `.dv-seal` 右上。
- X07 引文用朱砂「」引号（80pt `.q-mark`）+ 24pt 宋体大引文两行；引文内容必须来自内容源文档，勿编造出处。
- 篇章导语一段 ≤120 字。

---

## X08 + X09 · 数据页 条图 | 圆环（一个对开 · 上篇 01/02）

上篇六数据页（X08–X13）结构同族：栏目标题（上篇·数据 + 序号 EN）+ 小节标题 + hero/内容标题 + 结论 `.sitem` + 图表 `.chart-unit` + 解读 `.body-text.no-indent` + folio。每页一个图表主体。

```html
<section class="spread" id="sp-data-1">

  <!-- 数据页 X08 总量·条图 -->
  <div class="page left" data-layout="X08">
    <div class="col-title"><span class="ct-cn">上篇 · 数据</span><span>01 · [必填] EN</span></div>
    <div style="margin-bottom:6mm">
      <div class="note" style="margin-bottom:2mm">[必填] 小节标题</div>
      <div class="hero-num">[必填]<small> 个岗位</small></div>
    </div>
    <div class="sitem" style="margin-bottom:6mm">
      <div><div class="si-t">[必填] 结论一句话</div><div class="si-d">[必填] 补充说明。</div></div>
    </div>
    <div class="chart-unit">
      <div class="stat-row top" style="border-top:1.6px solid var(--ink)">
        <span class="sn">[必填] 数<small>[必填] 单位</small></span>
        <span class="st">[必填] 方向</span>
        <span class="sd">[必填] 数量 · 细分</span>
        <span class="bar" style="width:[必填]%"></span>
      </div>
      <div class="stat-row">
        <span class="sn">[必填] 数<small>[必填] 单位</small></span>
        <span class="st">[必填] 方向</span>
        <span class="sd">[必填] 数量 · 细分</span>
        <span class="bar" style="width:[必填]%"></span>
      </div>
      <div class="figcap">图 1-1 · [必填] 图表说明；条长按占比等比绘制，朱砂条为本期占比最高项。</div>
    </div>
    <div class="body-text no-indent">
      <p>[必填] 解读段一。</p>
      <p><mark>[必填] 高亮结论</mark>[必填] 展开。</p>
    </div>
    <div class="folio">— <b>08</b> —</div>
  </div>

  <!-- 数据页 X09 城市·圆环 -->
  <div class="page right" data-layout="X09">
    <div class="col-title"><span class="ct-cn">上篇 · 数据</span><span>02 · [必填] EN</span></div>
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">[必填] 小节标题</div>
      <div style="font-family:var(--disp);font-size:16pt;font-weight:700;line-height:1.4">[必填] 内容标题<br />[必填] 第二行</div>
    </div>
    <div class="sitem" style="margin-bottom:5mm">
      <div><div class="si-t">[必填] 结论一句话</div><div class="si-d">[必填] 补充说明。</div></div>
    </div>
    <div class="chart-unit">
      <div class="donut-row">
        <svg class="donut-svg" viewBox="0 0 42 42" role="img" aria-label="[必填] 圆环图说明">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--border)" stroke-width="4.2" />
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--seal)" stroke-width="4.2" stroke-dasharray="[必填] 占比 [必填] 余量" stroke-dashoffset="25" />
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--ink)" stroke-width="4.2" stroke-dasharray="[必填] 占比 [必填] 余量" stroke-dashoffset="[必填] 累计" />
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--muted)" stroke-width="4.2" stroke-dasharray="[必填] 占比 [必填] 余量" stroke-dashoffset="[必填] 累计" />
          <text x="21" y="19.5" text-anchor="middle" style="font-family:var(--disp);font-weight:700;font-size:6px;fill:var(--ink)">[必填]%</text>
          <text x="21" y="24" text-anchor="middle" style="font-family:var(--mono);font-size:2px;letter-spacing:.05em;fill:var(--muted)">[必填] 环心注</text>
        </svg>
        <div class="donut-legend">
          <div class="dl-row"><span class="dl-dot" style="background:var(--seal)"></span><span class="dl-label">[必填] 系列一</span><span class="dl-val">[必填] 占比 · 数量</span></div>
          <div class="dl-row"><span class="dl-dot" style="background:var(--ink)"></span><span class="dl-label">[必填] 系列二</span><span class="dl-val">[必填] 占比 · 数量</span></div>
          <div class="dl-row"><span class="dl-dot" style="background:var(--muted)"></span><span class="dl-label">[必填] 系列三</span><span class="dl-val">[必填] 占比 · 数量</span></div>
        </div>
      </div>
      <div class="figcap">图 1-2 · [必填] 图表说明；圆环按占比等比绘制，朱砂弧段为占比最高项。</div>
    </div>
    <div class="mod-grid">
      <div class="mod"><div class="mod-h"><span class="mh-no">其一</span><span class="mh-name">[必填] 维度</span><span class="mh-stat">[必填] 数量</span></div><p>[必填] 解读。</p></div>
      <div class="mod"><div class="mod-h"><span class="mh-no">其二</span><span class="mh-name">[必填] 维度</span><span class="mh-stat">[必填] 数量</span></div><p>[必填] 解读。</p></div>
      <div class="mod"><div class="mod-h"><span class="mh-no">其三</span><span class="mh-name">[必填] 维度</span><span class="mh-stat">[必填] 数量</span></div><p>[必填] 解读。</p></div>
      <div class="mod"><div class="mod-h"><span class="mh-no">其四</span><span class="mh-name">[必填] 维度</span><span class="mh-stat">[必填] 数量</span></div><p>[必填] 解读。</p></div>
    </div>
    <div class="folio">— <b>09</b> —</div>
  </div>
</section>
```

- X08 条图：`.stat-row.top` 是朱砂条（占比最高项），首行加 `border-top:1.6px`；条宽 `style="width:X%"` 以最高项为 100% 满宽。行数 2–4。
- X09 圆环：三环色序 **seal → ink → muted**；`.dl-row` 与环一一对应；`.mod-grid` 四格（其一–其四）解读城市维度。
- 圆环 SVG 中 `stroke="var(--seal)"` 等以**属性**方式写（见模板），因为 C 的环是整条 stroke 而非复杂渐变——**不要改成内联 style**，与模板一致即可。占比必须来自内容源文档。
- 所有上篇数据页的 hero/大字数字必须来自内容源文档。

---

## X10 + X11 · 数据页 大字格 | 细条（一个对开 · 上篇 03/04）

```html
<section class="spread" id="sp-data-2">

  <!-- 数据页 X10 企业·大字格 -->
  <div class="page left" data-layout="X10">
    <div class="col-title"><span class="ct-cn">上篇 · 数据</span><span>03 · [必填] EN</span></div>
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">[必填] 小节标题</div>
      <div style="font-family:var(--disp);font-size:16pt;font-weight:700;line-height:1.4">[必填] 内容标题<br />[必填] 第二行</div>
    </div>
    <div class="sitem" style="margin-bottom:5mm">
      <div><div class="si-t">[必填] 结论一句话</div><div class="si-d">[必填] 补充说明。</div></div>
    </div>
    <div class="firm-grid">
      <div class="firm-cell acc">
        <div class="fn">[必填] 数<small>[必填] 单位</small></div>
        <div class="ft">[必填] 企业类型 · 规模区间</div>
        <div class="fd">[必填] 数量与说明。</div>
      </div>
      <div class="firm-cell">
        <div class="fn">[必填] 数<small>[必填] 单位</small></div>
        <div class="ft">[必填] 企业类型 · 规模区间</div>
        <div class="fd">[必填] 数量与说明。</div>
      </div>
      <div class="firm-cell">
        <div class="fn">[必填] 数<small>[必填] 单位</small></div>
        <div class="ft">[必填] 企业类型 · 规模区间</div>
        <div class="fd">[必填] 数量与说明。</div>
      </div>
      <div class="firm-cell">
        <div class="fn">[必填] 数<small>[必填] 单位</small></div>
        <div class="ft">[必填] 企业类型 · 规模区间</div>
        <div class="fd">[必填] 数量与说明。</div>
      </div>
    </div>
    <div class="figcap" style="margin-top:7mm">图 1-3 · [必填] 图表说明。</div>
    <div class="body-text no-indent">
      <p>[必填] 解读段。</p>
    </div>
    <div class="folio">— <b>10</b> —</div>
  </div>

  <!-- 数据页 X11 学历·细条 -->
  <div class="page right" data-layout="X11">
    <div class="col-title"><span class="ct-cn">上篇 · 数据</span><span>04 · [必填] EN</span></div>
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">[必填] 小节标题</div>
      <div style="font-family:var(--disp);font-size:16pt;font-weight:700;line-height:1.4">[必填] 内容标题<br />[必填] 第二行</div>
    </div>
    <div class="sitem" style="margin-bottom:5mm">
      <div><div class="si-t">[必填] 结论一句话</div><div class="si-d">[必填] 补充说明。</div></div>
    </div>
    <div class="hero-num" style="margin-bottom:6mm">[必填]<small>[必填] 单位</small></div>
    <div class="chart-unit">
      <div class="hbar-row"><span class="hl">[必填] 档位</span><span class="ht"><span class="hf acc" style="width:100%"></span></span><span class="hv">[必填] 数量</span></div>
      <div class="hbar-row"><span class="hl">[必填] 档位</span><span class="ht"><span class="hf" style="width:[必填]%"></span></span><span class="hv">[必填] 数量</span></div>
      <div class="figcap">图 1-4 · [必填] 图表说明；条长以最高档占比为满宽基准。</div>
    </div>
    <div class="body-text no-indent">
      <p>[必填] 解读段一。</p>
      <p>[必填] 解读段二。</p>
    </div>
    <div class="folio">— <b>11</b> —</div>
  </div>
</section>
```

- X10 大字格 `.firm-grid` 固定 2×2 四格；朱砂 acc 格只能一格（本期最突出项），其余墨色顶线。
- X11 细条 `.hbar-row` 2–4 行；最高档 `.hf.acc` + `width:100%`，其余按占比、墨色。

---

## X12 + X13 · 数据页 柱图 | 阶梯（一个对开 · 上篇 05/06）

```html
<section class="spread" id="sp-data-3">

  <!-- 数据页 X12 经验·柱图 -->
  <div class="page left" data-layout="X12">
    <div class="col-title"><span class="ct-cn">上篇 · 数据</span><span>05 · [必填] EN</span></div>
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">[必填] 小节标题</div>
      <div style="font-family:var(--disp);font-size:16pt;font-weight:700;line-height:1.4">[必填] 内容标题<br />[必填] 第二行</div>
    </div>
    <div class="sitem" style="margin-bottom:5mm">
      <div><div class="si-t">[必填] 结论一句话</div><div class="si-d">[必填] 补充说明。</div></div>
    </div>
    <div class="chart-unit">
      <div class="col-chart">
        <div class="ccol"><span class="v">[必填] 数<small>[必填] 单位</small></span><div class="bar" style="height:[必填]%"></div></div>
        <div class="ccol"><span class="v">[必填] 数<small>[必填] 单位</small></span><div class="bar" style="height:[必填]%"></div></div>
        <div class="ccol acc"><span class="v">[必填] 数<small>[必填] 单位</small></span><div class="bar" style="height:100%"></div></div>
      </div>
      <div class="ccol-labels">
        <span>[必填] 区间一<em>[必填] 数量 · 注</em></span>
        <span>[必填] 区间二<em>[必填] 数量 · 注</em></span>
        <span>[必填] 区间三<em>[必填] 数量 · 注</em></span>
      </div>
      <div class="figcap">图 1-5 · [必填] 图表说明；柱高按占比等比绘制，以峰值档为满高基准，朱砂柱为需求峰值。</div>
    </div>
    <div class="body-text no-indent">
      <p>[必填] 解读段一。</p>
      <p>[必填] 解读段二。</p>
    </div>
    <div class="folio">— <b>12</b> —</div>
  </div>

  <!-- 数据页 X13 技能·阶梯 -->
  <div class="page right" data-layout="X13">
    <div class="col-title"><span class="ct-cn">上篇 · 数据</span><span>06 · [必填] EN</span></div>
    <div style="margin-bottom:5mm">
      <div class="note" style="margin-bottom:2mm">[必填] 小节标题</div>
      <div style="font-family:var(--disp);font-size:16pt;font-weight:700;line-height:1.4">[必填] 内容标题<br />[必填] 第二行</div>
    </div>
    <div class="sitem" style="margin-bottom:5mm">
      <div><div class="si-t">[必填] 结论一句话</div><div class="si-d">[必填] 补充说明。</div></div>
    </div>
    <div class="ladder">
      <div class="lad-r">
        <span class="lad-no">其一</span>
        <span class="lad-t">[必填] 维度</span>
        <span class="lad-k">[必填] 定位</span>
        <span class="lad-d">[必填] 说明。</span>
      </div>
      <div class="lad-r">
        <span class="lad-no">其二</span>
        <span class="lad-t">[必填] 维度</span>
        <span class="lad-k">[必填] 定位</span>
        <span class="lad-d">[必填] 说明。</span>
      </div>
      <div class="lad-r">
        <span class="lad-no">其三</span>
        <span class="lad-t">[必填] 维度</span>
        <span class="lad-k">[必填] 定位</span>
        <span class="lad-d">[必填] 说明。</span>
      </div>
    </div>
    <div class="figcap">图 1-6 · [必填] 图表说明；阶梯逐级右移，越往上越依赖长期积累。</div>
    <div class="body-text no-indent">
      <p>[必填] 解读段一。</p>
      <p>[必填] 解读段二。</p>
    </div>
    <div class="folio">— <b>13</b> —</div>
  </div>
</section>
```

- X12 柱图固定 3 柱（峰值 `.ccol.acc` height:100%）；`.ccol-labels` 与柱一一对应，`em` 行放数量+注释。
- X13 阶梯固定 3 阶（其一左、其三右，模板 `:nth-child` 已内置位移，**不要改 padding-left**）；`.lad-k` 是朱砂描边小标签。

---

## X15 + X17a · 岗位封面 | 岗位详解一（一个对开 · 每岗位开头）

X15 整版出血岗位图 + 底部墨带 `job-band`，**无 folio**；右页 X17a 是十二段式 壹–叁。

```html
<section class="spread" id="sp-job-1">

  <!-- 岗位封面 X15：整版出血，无 folio -->
  <div class="page left" data-layout="X15" style="padding:0">
    <img class="img-bleed" src="images/job1.jpg" alt="[必填] 岗位场景" style="height:100%;object-position:center 30%">
    <div class="job-band">
      <div class="jb-no">[必填] 下篇 · 重点岗位 · 其壹</div>
      <div class="jb-title">[必填] 岗位名</div>
      <div class="jb-sub">[必填] EN · 本科及以上 · 方向 · 应届友好</div>
    </div>
    <div class="caption-chip" style="right:12mm;top:12mm"><b>FIG. 2-1 · 岗位场景</b>[必填] 图注（示意图）</div>
  </div>

  <!-- 岗位详解一 X17a -->
  <div class="page right" data-layout="X17a">
    <div class="col-title"><span class="ct-cn">下篇 · 岗位档案</span><span>JOB FILE · 01</span></div>
    <div style="margin-bottom:5mm">
      <div style="font-family:var(--mono);font-size:7pt;letter-spacing:.24em;color:var(--seal);margin-bottom:2mm">[必填] POSITION 01 / 06 · 其一至其叁</div>
      <div style="font-family:var(--disp);font-size:15pt;font-weight:700;letter-spacing:.1em">[必填] 岗位名 · 岗位详解</div>
    </div>
    <div class="lede jsec">
      <div class="jm-h"><span class="jm-no">壹</span><span class="jm-name">[必填] 岗位综述</span><span class="jm-en">[必填] OVERVIEW</span></div>
      <p>[必填] 综述段（首字下沉）。</p>
    </div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">贰</span><span class="jm-name">[必填] 岗位名的一天</span><span class="jm-en">[必填] A DAY</span></div>
      <div class="day-tab">
        <div class="day-row"><div class="dt">上午</div><div class="dc">[必填] 内容。</div></div>
        <div class="day-row"><div class="dt">中午</div><div class="dc">[必填] 内容。</div></div>
        <div class="day-row"><div class="dt">下午</div><div class="dc">[必填] 内容。</div></div>
      </div>
    </div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">叁</span><span class="jm-name">工作职责</span><span class="jm-en">[必填] RESPONSIBILITIES</span></div>
      <div class="ditem"><span class="dno">其一</span><div class="dt2"><div class="t">[必填] 职责名</div><div class="d">[必填] 说明。</div></div></div>
      <div class="ditem"><span class="dno">其二</span><div class="dt2"><div class="t">[必填] 职责名</div><div class="d">[必填] 说明。</div></div></div>
      <div class="ditem"><span class="dno">其三</span><div class="dt2"><div class="t">[必填] 职责名</div><div class="d">[必填] 说明。</div></div></div>
      <div class="ditem"><span class="dno">其四</span><div class="dt2"><div class="t">[必填] 职责名</div><div class="d">[必填] 说明。</div></div></div>
    </div>
    <div class="folio">— <b>15</b> —</div>
  </div>
</section>
```

- X15 图片墨带 `.job-band` 贴页底，白底 + 墨顶线；`.jb-no` 朱砂序（其壹/其贰…），`.jb-title` 23pt 宋体岗位名。图注 chip 放右上 `right:12mm;top:12mm`。
- 十二段式序号固定中文序数：壹贰叁肆伍陆柒捌玖拾拾壹拾贰。**每段一个小节 `.jsec`**，小节标题固定，段内条目 2–4 条。
- 职责 `.ditem` 用中文序数 `.dno`（其一–其四），4–6 条可调，超页拆到下一段页。
- 一天固定 3 行（上午/中午/下午），内容来自内容源文档。

---

## X17b + X17c · 岗位详解二 | 三（一个对开 · 肆伍陆 | 柒捌玖）

```html
<section class="spread" id="sp-job-2">

  <!-- 岗位详解二 X17b -->
  <div class="page left" data-layout="X17b">
    <div class="col-title"><span class="ct-cn">下篇 · 岗位档案</span><span>JOB FILE · 01</span></div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">肆</span><span class="jm-name">[必填] 行业前景</span><span class="jm-en">[必填] OUTLOOK</span></div>
      <div class="slist">
        <div class="sitem"><div><div class="si-t">[必填] 切面</div><div class="si-d">[必填] 说明。</div></div></div>
        <div class="sitem"><div><div class="si-t">[必填] 切面</div><div class="si-d">[必填] 说明。</div></div></div>
        <div class="sitem"><div><div class="si-t">[必填] 切面</div><div class="si-d">[必填] 说明。</div></div></div>
      </div>
    </div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">伍</span><span class="jm-name">[必填] 岗位名的生活</span><span class="jm-en">[必填] LIFESTYLE</span></div>
      <div class="slist">
        <div class="sitem"><div><div class="si-t">[必填] 切面</div><div class="si-d">[必填] 说明。</div></div></div>
        <div class="sitem"><div><div class="si-t">[必填] 切面</div><div class="si-d">[必填] 说明。</div></div></div>
      </div>
    </div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">陆</span><span class="jm-name">薪酬待遇</span><span class="jm-en">[必填] SALARY</span></div>
      <div class="sal">
        <div class="sal-c acc"><div class="sc-t">高级</div><div class="sc-v">[必填]<small>元以上</small></div><div class="sc-d">[必填] 说明。</div></div>
        <div class="sal-c"><div class="sc-t">中级</div><div class="sc-v">[必填]<small>元</small></div><div class="sc-d">[必填] 说明。</div></div>
        <div class="sal-c"><div class="sc-t">初级</div><div class="sc-v">[必填]<small>元</small></div><div class="sc-d">[必填] 说明。</div></div>
      </div>
      <div class="figcap">表 2-1 · [必填] 年薪区间（市场调研数据）；年薪以人民币计。</div>
    </div>
    <div class="folio">— <b>16</b> —</div>
  </div>

  <!-- 岗位详解三 X17c -->
  <div class="page right" data-layout="X17c">
    <div class="col-title"><span class="ct-cn">下篇 · 岗位档案</span><span>JOB FILE · 01</span></div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">柒</span><span class="jm-name">职业发展路径</span><span class="jm-en">[必填] PATH</span></div>
      <div class="pway">
        <div class="pw-r"><div class="pw-t">[必填] 序列</div><div class="pw-seq"><span class="pw-step">[必填] 阶段</span><span class="pw-arrow">→</span><span class="pw-step">[必填] 阶段</span><span class="pw-arrow">→</span><span class="pw-step hl">[必填] 终态</span></div></div>
        <div class="pw-r"><div class="pw-t">[必填] 序列</div><div class="pw-seq"><span class="pw-step">[必填] 阶段</span><span class="pw-arrow">→</span><span class="pw-step">[必填] 阶段</span><span class="pw-arrow">→</span><span class="pw-step hl">[必填] 终态</span></div></div>
        <div class="pw-r"><div class="pw-t">[必填] 序列</div><div class="pw-seq"><span class="pw-step">[必填] 阶段</span><span class="pw-arrow">→</span><span class="pw-step">[必填] 阶段</span><span class="pw-arrow">→</span><span class="pw-step hl">[必填] 终态</span></div></div>
      </div>
    </div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">捌</span><span class="jm-name">准入门槛</span><span class="jm-en">[必填] ENTRY</span></div>
      <div class="ditem"><span class="dno">其一</span><div class="dt2"><div class="t">[必填] 门槛</div><div class="d">[必填] 说明。</div></div></div>
      <div class="ditem"><span class="dno">其二</span><div class="dt2"><div class="t">[必填] 门槛</div><div class="d">[必填] 说明。</div></div></div>
      <div class="ditem"><span class="dno">其三</span><div class="dt2"><div class="t">[必填] 门槛</div><div class="d">[必填] 说明。</div></div></div>
    </div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">玖</span><span class="jm-name">专业优势</span><span class="jm-en">[必填] ADVANTAGE</span></div>
      <div class="slist">
        <div class="sitem"><div><div class="si-t">[必填] 优势</div><div class="si-d">[必填] 说明。</div></div></div>
        <div class="sitem"><div><div class="si-t">[必填] 优势</div><div class="si-d">[必填] 说明。</div></div></div>
        <div class="sitem"><div><div class="si-t">[必填] 优势</div><div class="si-d">[必填] 说明。</div></div></div>
      </div>
    </div>
    <div class="folio">— <b>17</b> —</div>
  </div>
</section>
```

- 薪酬 `.sal` 三档固定：高级 `.sal-c.acc`（朱砂数字，其余墨色）；数字**必须来自内容源文档**（原型的 SQE：高级 20 万+ / 中级 10–20 万 / 初级 5–10 万），无数据不编造。
- 路径 `.pway` 是分轨链（`.pw-r` 多条轨，每轨 `→` 相连，终态 `.pw-step.hl` 朱砂描边）；行数 2–3。
- `slist`/`sitem` 用于条目式小节（前景/生活/优势/渠道），每段 2–4 条。

---

## X17d + X18 · 岗位详解四 | 结语（一个对开 · 拾拾壹 | 拾贰·寄语）

```html
<section class="spread" id="sp-job-3">

  <!-- 岗位详解四 X17d -->
  <div class="page left" data-layout="X17d">
    <div class="col-title"><span class="ct-cn">下篇 · 岗位档案</span><span>JOB FILE · 01</span></div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">拾</span><span class="jm-name">什么样的人更适合</span><span class="jm-en">[必填] FIT</span></div>
      <div class="ditem"><span class="dno">其一</span><div class="dt2"><div class="t">[必填] 特质</div><div class="d">[必填] 说明。</div></div></div>
      <div class="ditem"><span class="dno">其二</span><div class="dt2"><div class="t">[必填] 特质</div><div class="d">[必填] 说明。</div></div></div>
    </div>
    <div class="jsec">
      <div class="jm-h"><span class="jm-no">拾壹</span><span class="jm-name">如何了解这个行业</span><span class="jm-en">[必填] RESOURCES</span></div>
      <div class="slist">
        <div class="sitem"><div><div class="si-t">[必填] 渠道</div><div class="si-d">[必填] 说明。</div></div></div>
        <div class="sitem"><div><div class="si-t">[必填] 渠道</div><div class="si-d">[必填] 说明。</div></div></div>
        <div class="sitem"><div><div class="si-t">[必填] 渠道</div><div class="si-d">[必填] 说明。</div></div></div>
      </div>
    </div>
    <div class="folio">— <b>18</b> —</div>
  </div>

  <!-- 结语 X18 -->
  <div class="page right" data-layout="X18">
    <div class="dv-watermark" style="right:auto;left:6mm">终</div>
    <div class="vt" style="position:absolute;top:40mm;right:auto;left:18mm;font-size:24pt;font-weight:700;letter-spacing:.3em">[必填] 寄语</div>
    <span class="seal" style="position:absolute;top:40mm;left:38mm;width:11mm;height:11mm;font-size:8pt">[必填] 其壹</span>
    <div style="position:absolute;left:60mm;right:14mm;top:44mm">
      <div class="note" style="margin-bottom:4mm">[必填] 卷末 · 其壹结语</div>
      <div class="jsec">
        <div class="jm-h"><span class="jm-no">拾贰</span><span class="jm-name">学习规划建议</span><span class="jm-en">[必填] PLAN</span></div>
        <div class="slist">
          <div class="sitem"><div><div class="si-t">[必填] 建议</div><div class="si-d">[必填] 说明。</div></div></div>
          <div class="sitem"><div><div class="si-t">[必填] 建议</div><div class="si-d">[必填] 说明。</div></div></div>
          <div class="sitem"><div><div class="si-t">[必填] 建议</div><div class="si-d">[必填] 说明。</div></div></div>
          <div class="sitem"><div><div class="si-t">[必填] 建议</div><div class="si-d">[必填] 说明。</div></div></div>
        </div>
      </div>
      <div class="pull" style="border-top:1.6px solid var(--ink);padding-top:5mm;font-size:13.5pt;line-height:1.9">
        [必填] 结语引文。
        <div class="pull-src" style="margin-top:2mm">—— [必填] 编者按 · 其壹终</div>
      </div>
      <div class="note" style="margin-top:8mm">[必填] 下一篇 · 其贰「[必填] 岗位名」—— [必填] 一句话预告，页面 [必填]。</div>
    </div>
    <div class="folio">— <b>19</b> —</div>
  </div>
</section>
```

- X18 是每岗位的收尾页：竖排寄语 + 其壹印 + 拾贰学习规划 + 结语引文 + 下篇预告；左缘「终」字水印（覆盖 `.dv-watermark` 为左侧 `right:auto;left:6mm`）。
- X18 布局全绝对定位（坐标锁死），只换文字；多个岗位时每岗位独立一个 X17d+X18 对开，序号与印章字随岗位变更。
- 学习规划建议 3–4 条；结语引文与预告必须来自内容源文档。

---

## 对开配对规则（build 脚本按此执行）

1. 封面 X00|X01 → 序 X02|X03 → 目录 X04|X05 → 幕封 X06|X07 → **上篇数据页两两配对**（X08–X13 固定六页，顺序不可调）→ **岗位对开**（每岗位：X15|X17a 封面开篇 → X17b|X17c → X17d|X18 结语）。
2. X03 / X15 是出血页**无 folio**，但物理页码仍占位（03 / 14）。
3. 页码铁律（≥12mm）、图注成组、出血页删 folio 三条在配对后逐页复查——validate 脚本自动检查。
4. 多岗位时：上篇六页固定，下篇按岗位循环 X15→X17a→X17b→X17c→X17d→X18；每岗位固定 4 个详情页（壹贰叁 / 肆伍陆 / 柒捌玖 / 拾拾壹+结语），**不做贪心打包**——十二段式分布已由原型定稿锁定。
5. 目录 `.ve-pg` 页码在全部对开排定后回填（两遍法：先占位排页，再按实际页号填目录与预告页号）。
