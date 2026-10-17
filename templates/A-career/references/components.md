# Components · 组件规范

模板 `<style>` 里已定义的全部组件的**行为约定**。凡是要往手册里加的块，先查这里——**「怎么用」优先查 layouts.md，这里是「为什么这么设计 + 边界条件」**。

---

## 0. 设计哲学（先读）

- **手册是书，不是网页**：页面静止排版，不做动效、不悬浮、不 hover 突变。任何「动」都是错误的。
- **打印优先**：所有颜色、尺寸、字号都在为 300dpi 打印服务。屏幕只是预览。
- **一页一主体**：不跨页流动，溢出先拆页。
- **数据纪律**：图形全部由数据计算，`--v/--max` 禁止 magic number。

---

## 1. 网格系统

- 页面内容区：左右安全边距各 10mm（出血版），正文栏宽约 150mm。
- `.data-2col`：两栏，间距 8mm。
- `.stat-grid`：三/四卡网格，卡片内 `.st-num` 大数字 + `.st-label` 小字。
- **禁止**在 `.data` 或 `.job-detail` 里叠超过两个组件（会爆）。

## 2. 表格 `.tbl`

- 默认 `.tbl` 三列：左列左对齐（标签），中间/右列 `.num` 右对齐（数值）。
- `th` 背景 `var(--surface)`，底部 hairline 分隔；行高 ≥ 7mm。
- 字号 ≥ 8pt；内容超长拆行而不是横向滚动。
- **表格不能横向溢出页面**：列宽自适应，用 `table-layout:fixed`，`word-break:break-all`。

## 3. 图表组件

| 组件 | 类 | 数据接口 | 禁止 |
|---|---|---|---|
| 条形图 | `.bar-chart` `.bar-row` `.bar-track` `.bar-fill` `.bar-value` | 容器 `--max`，条 `--v` | 空条、无 label、magic number |
| 环形图 | `.donut` `.donut-center` `.donut-legend` | `--d0` `--d1`（累加角度） | 肉眼估角度、图例缺数值 |
| 大数字卡 | `.stat-grid` `.stat-cell` | `.st-num` 文本 | 数字挤一行（`<b>` 单位换行） |
| 三支柱 | `.pillar-grid` `.pillar` | `.pl-title` `.pl-desc` `.pl-tags` | 支柱超 4 个 |

**条形图规则**：
- 条 = `calc(var(--v)/var(--max)*100%)`；`--v`、`--max` 必须是纯数字（可在百分比数值用小数）。
- 每条三件套缺一不可：`.bar-label`（类别 + `<small>` 单位量）、`.bar-track > .bar-fill`、`.bar-value`（数值 + `<b class="b-unit">` 单位）。
- 条高 ≥ 3mm，视觉对比靠宽度；条间 gap 3mm。

**环形图规则**：
- `--d0`/`--d1` 是**累加**角度：`--d0` = 前几段总角度，`--d1` = 加上本段后的总角度。角度 = 百分比 × 3.6°，最多一位小数。
- 剩余到 360° 自动是 `--bg` 段（「其他」不用画）。
- 图例 `.lg-row` 必须含：色点 `.lg-dot`、名称 `.lg-name`、数值 `.lg-val`（占比 + 绝对量）。
- 三段以上：用 `--d0` `--d1` 之后再加 `--d2`（模板需补 `--d2` 段），或改用条形图。

## 4. 排版

- 标题层级：`.h-kicker`（小标签）→ `.h-title`（大标题）→ `.lead`（导语）→ `.body`（正文）。
- 正文 `font-size:9pt; line-height:1.75`；行高不缩（打印舒服）。
- `.mono`：等宽数字（表格数值用）。`.muted`：次级灰。
- **禁华文竖排**；书名号、破折号用全角；数字、百分号用半角。
- 序号 `.js-nb` 用衬线大号数字（模板已含衬线数字字体栈，无衬线化失败则退回等宽）。

## 5. 封面与幕封

- `.cv-img` / `.dv-img` 全出血但 `opacity ≤ 0.16`：只做低饱和纹理，不能抢字。
- `.cover` 内的 `.cv-title` 大标题 ≤ 6 个字/行，超长拆 `<span class="row">` 分行。
- 幕封 `.dv-num` 超大号（>120pt）衬线数字是视觉锚点，勿删。

## 6. 页码与页眉

- `.page-foot` 固定在页面底部 10mm 处（`.pf-num` 右侧）。
- `.page-head` 顶部 10mm：`.ph-tag`（部分名）+ `.ph-title`（手册名）。
- 正文内容**不得**顶到 `.page-head` / `.page-foot` 的安全区内。

## 7. 图片

- 相对路径 `images/{页码}-{语义}.{ext}`；不热链、不用外链 URL。
- 封面/幕封 ≥ 300dpi 等效（约 4961×3369px），插画 ≥ 200dpi。
- `<img>` 缺图时直接删标签，不留占位。

## 8. 打印与出血

- 默认 `body.no-bleed`（精确 420×285 对开）；`body` 无类时含 3mm 出血（432×291）。
- 页面单位固定 mm；PDF 导出选 300dpi。
- 校对：送印前用软打样（FOGRA39）过一遍 accent 与 fg 的 CMYK 值（themes.md 附表）。

## 9. 浏览器兼容

- 目标 Chrome（桌面）；用 `@page` 分页需在打印样式里处理 `.spread{break-after:page}`。
- 字体本地 `@font-face` 引入 MiSans（SIL OFL，商用免费），**不走 CDN**，保证 PDF 内嵌字型。
- 无 `scrollIntoView`；锚点用 `<a href="#sp-*">` 原生跳转。
