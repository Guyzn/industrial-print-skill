# 模版 B · 职业发展手册（杂志编辑风）

> 路由命中「杂志/编辑风/图文混排/文章式/editorial/magazine」时使用本模版。
> 版式锁死：换专业只换「内容清单 JSON + 主题色 token」，页面结构、骨架、组件纪律全部不变。

## 这个模版做什么

与模版 A **同一内容模型、同一物理规格**（210×285 大16开单页 / 打印对开 420×285，含 3mm 出血 = 432×291），只有**视觉层不同**：

| 维度 | 模版 A（瑞士极简） | 模版 B（杂志编辑） |
|---|---|---|
| 标题字体 | MiSans | Noto Serif SC（衬线，编辑感） |
| 正文 | 单栏 | MiSans 栏文 + 衬线大标题 |
| 角标 | 无 | IBM Plex Mono 刊头/期号/栏号 |
| 数据 | 条形图/环形图 | 六种数据版式：圆环/数据轨道/大字报/堆叠条/柱图/支柱色块 |
| 引文 | 无 | pull-quote 大引文块（可 pin-bottom） |
| 岗位 | 岗位详解页 | 十二段岗位档案（封面 M15 + 开篇 M16 + 详情 M17 自动分页） |
| 页码 | 页脚分割线 | 眉脚 folio（`fl-run` 栏名 + `fl-num`，奇偶镜像） |

**风格锚点**：刊头 masthead、期号角标、衬线大标题、pull-quote、发丝线分栏、folio 眉脚、墨区铁律（内容距页码 ≥12mm）。

**主色映射**：accent ← 主题 `--cov-ink`（默认「工程陶橙」`#75380f`）；辅色 `--chart-2 #a4835e / --chart-3 #2f6b5f / --chart-4 #3d5a80`。

## 骨架总览（M00–M17）

| 骨架 | 内容 | 配对 |
|---|---|---|
| M00/M01 | 封底/封面 | 对开 0 |
| M02/M03 | 序 / 序图（全出血，无 folio 但计数） | 对开 1 |
| M04/M05 | 目录 toc.compact / 速览 | 对开 2 |
| M06/M07 | 幕封 ×2（PART 01） | 对开 3 |
| M08–M13 | 数据页 ×6（donut/track/bignum/stack/colchart/pillars） | 对开 4–6 |
| M06/M14 | 幕封（PART 02）/ 岗位一览 | 对开 7 |
| M15/M16 | 岗位封面（全出血，无 folio）/ 岗位开篇 | 对开 8 |
| M17 | 岗位详情（十二段自动分页，奇数页补 closing） | 对开 9+ |

## 工作流

### Step 0 · 启动前（必做）

- 读取选中的源文档（docx/md/网页），解出文本完整读一遍，摸清骨架（封面/序/目录/章节/岗位/数据）。
- 确认路由：B 适用于「文章式、图文混排、编辑感」的表述；瑞士极简用模版 A，东方学报风用模版 C。

### Step 1 · 需求澄清

| # | 问题 | 为什么问 |
|---|------|---------|
| 1 | **专业名 / 学校学院名 / 年份** | 填封面刊头与眉脚 |
| 2 | **主题色选哪套**？ | 9 套预设（`_shared/themes.md`，第 9 套朱砂为模版 C 专属），只许选不许自定义 |
| 3 | **有没有源文档**？ | 有就基于文档，没有帮他搭框架 |
| 4 | **章节范围**？默认全量（封面+序+目录+两部分幕封+数据+岗位） | 可能只做某一部分 |
| 5 | **配图需求**？序图/幕封图/岗位封面图 | 决定图位是否填充 |
| 6 | **硬约束**？(必须含 XX 数据 / 页数限制) | 避免返工 |

### Step 2 · 主题色与元信息

内容 JSON 的 `meta`：`{school, handbook, year, theme, title}`。`theme` 为 9 套 slug 之一，build 时从 `_shared/themes.md` 注入 token，accent 自动取该主题 `--cov-ink`。**一份手册一套主题，不接受自定义 hex。**

### Step 3 · 填内容 + 构建（JSON → HTML，不手改生成的 HTML）

1. **写内容清单 JSON**：`content/<专业>.json`，参考 `content/example-xinnengyuan.json`。
2. **读骨架库**：`references/layouts.md`（M00–M17 对应 JSON 字段）。
3. **运行构建**：

```bash
node "<B-editorial>/scripts/build-magazine.mjs" \
  "<B-editorial>/content/<专业>.json" \
  "<项目目录>/<专业>-职业发展手册.html"

# 打包诊断（每页 fill/节奏/段分布）：
DEBUG_PACK=1 node scripts/build-magazine.mjs …
```

**JSON Schema 要点**：
- `cover{mastheadEn,credits[],logo,kicker,title[],yearSvg,sub,stats[],footerLine,deco}`
- `preface{title[],quote,paras[],sign,date,image,imageCaption,imagePosition}`
- `part1{tocLabel,runLabel,deskLabel,divider{num,kicker,title[],sub,image,quote[],lead,run},sections[]}`；`section.chart ∈ {donut,track,bignum,stack,colchart,pillars}`
- `part2{tocLabel,runLabel,divider(无 image),index{rows[{job,dir,detail}],quote,howToRead},jobs[]}`
- `job{no,dir,name[],shortName,portrait,summary,meta[],tags[],image,layout{dutySplit,breakBefore},pullQuotes,nextIssue,sections{十二段}}`
- colchart 列用 `pct`（柱高归一）+ `ci`（辅色索引）+ `peak`（主峰）

**分页模型（版式锁，build 自动完成，勿手算）**：
- 岗位详情 = **十二段固定序贪心打包**：`dutySplit`（偶数）跨页续排；`breakBefore` 强制换页；`pullQuotes` 按小节号插入（h=18）
- 节奏类（页级）：`fill + gaps×5 ≤ 200 → sec-roomy`；`fill ≥ 218 → sec-tight`；否则默认
- nextIssue：节奏分类后按实际间距 g（17/12/9）判定 `fill+g+20 ≤ BUDGET(239)` 才 pin-bottom；放不下且详情页数为偶数时 console.warn 跳过
- 详情页数为奇数 → 自动补 closing 页（白底 pullquote.tint，可承担 nextIssue）
- **页码两遍法**：封面 0,1 不显示；序=02 起递增（M03/M15 计数不显示）；目录与岗位一览页码指向 **M15 岗位封面页**；偶数在左页

**图表纪律**：
- SVG 内禁 `var()` 作 presentation 属性（用 `style="stroke: var(--accent);"`）
- 圆环 viewBox `0 0 42 42` r=15.9155，首环 dashoffset=25 累减，<3% 段最小可视宽 2.3%
- 色序：轨道/柱图 accent→chart-3→chart-2→chart-4；**圆环专用 accent→chart-3→chart-4→chart-2（DONUT_SERIES）**

**改样式 = 改 `assets/template.html` 或构建脚本后重新生成**，绝不在生成的 HTML 上手改。

#### 3.0 · 预检：类名必须在模板的 `<style>` 里有定义（最重要）

1. 先 Read 模板的 `<style>` 块（类名唯一来源）
2. 对照 `references/layouts.md` 挑骨架，确认要用的类都存在
3. 缺类 → 在模板 `<style>` 里补，不要每页 inline 重写
4. 不要发明新类名，如需自定义用 `style="..."` inline

**墨区铁律**：top 13 / outer 12 / fold 12 / bottom 26mm；folio 在 bottom 10mm；内容与页码 ≥12mm 留白。

### Step 4 · 配图（可选）

| 骨架 | 图位 |
|------|------|
| M03 序图 | 全出血通页（无 folio） |
| M06 幕封 | 低透明纹理出血图（opacity ≤ 0.16） |
| M15 岗位封面 | 全出血岗位场景图 + caption-chip |
| M01 封面 | 可选 deco 图位（不配也成立，靠字排） |
| M08–M13 数据页 | **不配照片**，保持数据视觉干净 |

- 一律真实照片；项目内 `images/` 相对路径引用，不得热链远程 URL；全出血 ≥ 300dpi，插图 ≥ 200dpi。
- **校徽**：仓库内置中性**占位校徽**（`images/logo-placeholder.svg`，build 自动同步）——本镜像可分享；**正式发布请把 `cover.logo` 换成真实校徽图**（白色版，置于主色底上）。

### Step 5 · 校验（必做）

```bash
node "<B-editorial>/scripts/validate-magazine.mjs" "<项目目录>/<专业>-职业发展手册.html"
```

静态校验覆盖：data-layout 覆盖率（M00–M17）、left/right 交替、页码奇偶与递增、folio 白名单、锚点、SVG var() 禁令、圆环/轨道/堆叠条/柱图/支柱纪律、xtable 表头、pullquote、sec-no 连号、pin-bottom 须 flex-fill、图片、占位符、字体。0 错误才算过（exit 0=全过，2=仅警告）。

**几何校验（防静默裁切）**：`.page` 是 `overflow:hidden`，必须用 headless Chrome 探针逐页量 `scrollHeight - clientHeight`（应为 0），并 `--print-to-pdf` 确认 PDF 页数 = 对开数、页面尺寸 = 432×291mm（1225×825pt）。

### Step 6 · 对照 checklist 自检

打开 `references/checklist.md` 逐项对照。P0 项必须全过。

### Step 7 · 本地预览 + 打印核对

```bash
open "<项目目录>/<专业>-职业发展手册.html"
```

- 浏览器滚动阅读，右上角悬浮目录可跳转
- 打印 → 另存为 PDF → 核对 432×291 对开拼版
- 办公室直打：`<body>` 加 `.no-bleed` 类重新导出（精确 420×285）

### Step 8 · 迭代

先改内容 JSON，再改版式（模板 CSS / 骨架），最后才是构建脚本。不要为了微调破坏版式锁。

## 资源文件导览

```
templates/B-editorial/
├── README.md                    ← 你正在读
├── assets/
│   └── template.html            ← 单文件种子（全套 CSS + SLOT: theme tokens + 8 种子对开 + stage 标记）
├── content/
│   └── example-xinnengyuan.json ← 内容清单样例（新能源汽车工程 · 22 页全量）
├── references/
│   ├── layouts.md               ← M00–M17 页面骨架库
│   └── checklist.md             ← 质量检查清单（P0/P1/P2/P3 分级）
├── scripts/
│   ├── build-magazine.mjs       ← 构建器：content JSON + template.html → 手册 HTML（DEBUG_PACK=1 诊断）
│   └── validate-magazine.mjs    ← 静态校验（M00–M17/页码奇偶/图表纪律/组件）
├── prototype/
│   └── magazine-prototype.html  ← 定稿原型（11 对开 22 页，骨架唯一来源）
└── dist/                        ← 构建产物（html + images/ + fonts/）

共享资源（勿复制）：
├── ../../_shared/themes.md      ← 9 套预设主题色板（hex + CMYK 双值）
└── ../../_shared/fonts/         ← MiSans / Noto Serif SC / IBM Plex Mono / Alibaba PuHuiTi 3（build 自动同步）
```

**加载顺序建议**：
1. 读本 README 了解整体
2. Step 1 对齐澄清项
3. 动手前 Read 模板 `<style>` 块 —— 类名唯一来源
4. 读 `references/layouts.md` 挑骨架
5. 用 `_shared/themes.md` 选主题色
6. 生成后 `validate-magazine.mjs` + 读 `references/checklist.md` 自检

## 参考作品

- 新能源汽车工程 · 职业发展手册（模版 B 示例，22 页）
- 编辑风参考：The New York Times Magazine 栏目系统、Monocle 刊头与眉脚、Kinfolk 图文混排
