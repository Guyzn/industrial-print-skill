# 模版 C · 职业发展手册（东方学报风）

> 路由命中「学报/书院/东方/竖排/宋体/宣纸/印章/journal」时使用本模版。
> 版式锁死：换专业只换「内容清单 JSON + 主题色 token」，页面结构、骨架、组件纪律全部不变。

## 这个模版做什么

与模版 A/B **同一内容模型、同一物理规格**（210×285 大16开单页 / 打印对开 420×285，含 3mm 出血 = 432×291），只有**视觉层不同**：

| 维度 | 模版 A（瑞士极简） | 模版 B（杂志编辑） | 模版 C（东方学报） |
|---|---|---|---|
| 气质 | 极简网格 | 刊头衬线编辑感 | 宣纸朱砂、竖排印章 |
| 标题字体 | MiSans | Noto Serif SC | Noto Serif SC（变量字 200–900） |
| 强调色 | 主题 accent | 主题 accent | **朱砂 `#9e2f26`（唯一点缀色）** |
| 页面底色 | 白 | 白 | 宣纸 `#f7f3ea` |
| 数据 | 条形图/环形图 | 六种数据版式 | 条图/圆环/大字格/细条/柱图/技能阶梯 |
| 签名元素 | 无 | pull-quote | **印章 `.seal` / 竖排 `.vt` / 文武线 / 中文序数** |
| 页码 | 页脚分割线 | 眉脚 folio | 下缘 folio + 栏名 |

**风格锚点**：宣纸底、朱砂点缀、竖排签名、印章、文武线、中文序数（壹贰叁 / 其一~其六）、Noto Serif SC 大标题与数字、folio 下缘页码。**朱砂是唯一强调色，其余全走墨色系。**

**主色映射**：朱砂 ← 主题 `--accent`；墨 `#1e1c17 / --ink-2 #3a372e / --muted #7d7666 / --border #d9d1bf`；宣纸 `--bg #f7f3ea / --surface #efe8d8`。

## 骨架总览（X00–X18）

| 骨架 | 内容 | 配对 |
|---|---|---|
| X00/X01 | 封底/封面 | 对开 1 |
| X02/X03 | 序 / 序图（全出血，无 folio 但计数） | 对开 2 |
| X04/X05 | 目录 / 目录右页（速览） | 对开 3 |
| X06/X07 | 幕封 / 引文 | 对开 4 |
| X08–X13 | 上篇数据页 ×6（条图/圆环/大字格/细条/柱图/阶梯） | 对开 5–7 |
| X15/X17a | 岗位封面（全出血，无 folio）/ 详解一 | 对开 8 |
| X17b/X17c | 详解二 / 详解三 | 对开 9 |
| X17d/X18 | 详解四 / 结语 | 对开 10 |

**分页锁（不可调整）**：上篇六页 X08–X13 固定顺序；每岗位固定 5 页（封面 X15 + 详解 X17a–X17d），第 6 页为结语 X18。页码连续不因岗位数变化。

## 工作流

### Step 0 · 启动前（必做）

- 读取选中的源文档（docx/md/网页），解出文本完整读一遍，摸清骨架（封面/序/目录/章节/岗位/数据）。
- 确认路由：东方学报风用本模版 C；文章式编辑感用 B；瑞士极简用 A。

### Step 1 · 需求澄清

| # | 问题 | 为什么问 |
|---|------|---------|
| 1 | **专业名 / 学校学院名 / 年份** | 填封面卷名与落款 |
| 2 | **主题色选哪套**？ | 9 套预设（`_shared/themes.md`，第 9 套朱砂为 C 专属），只许选不许自定义 |
| 3 | **有没有源文档**？ | 有就基于文档，没有帮他搭框架 |
| 4 | **章节范围**？默认全量（封面+序+目录+上篇数据+岗位+结语） | 可能只做某一部分 |
| 5 | **配图需求**？序图/岗位封面图 | 决定图位是否填充 |
| 6 | **硬约束**？(必须含 XX 数据 / 页数限制) | 避免返工 |

### Step 2 · 主题色与元信息

内容 JSON 的 `meta`：`{school, handbook, year, theme, title}`。`theme` 为 9 套 slug 之一，build 时从 `_shared/themes.md` 注入 token，朱砂自动取该主题 `--accent`。**一份手册一套主题，不接受自定义 hex。**

### Step 3 · 填内容 + 构建（JSON → HTML，不手改生成的 HTML）

1. **写内容清单 JSON**：`content/<专业>.json`，参考 `content/example-xinnengyuan.json`。
2. **读骨架库**：`references/layouts.md`（X00–X18 对应 JSON 字段）。
3. **运行构建**：

```bash
node "<C-journal>/scripts/build-journal.mjs" \
  "<C-journal>/content/<专业>.json" \
  "<项目目录>/<专业>-职业发展手册.html"
```

**JSON Schema 要点**：
- `meta{school,handbook,year,theme,title}`
- `cover{seal,nm,credits[],monoEn,logo,vtitle,vsub,covSeal,yr,ttl,strip[]}`
- `preface{year,dept,seal,paras[],who,whoSeal,when,image,imageCaption,figLabel}`；`paras[]` 每项可为字符串或 `{pre,m,d}`（句中高亮）
- `toc{p1{pages,label,...},p2{indexTitle,glance[]}}`
- `divider{watermark,tag,vt,seal,lab,tx}`（幕封）；`editor{cn,en,body[],src,note}`（编者按）
- `part1.sections[]` 六章，每章一种图表：`hero`（条图）/`donut`（圆环）+`mods`/`cells`（大字格）/`bars`（细条）/`cols`（柱图）/`ladder`（技能阶梯）；每章含 `en,note,title,si_t,si_d,figcap,body[]`
- `part2.jobs[]`：`name,sub,image,imagePos,imageCaption,sections{十二段},closing{vt,seal,note,pull,pullSrc}`
- 十二段 sections 键：`overview/day/duties/outlook/life/salary/path/threshold/advantages/fit/channels/plan`

**段落格式**：`body[]` 每项可为字符串（`<p>`）或 `{pre,m,d}` 对象——`pre` 为 mark 前导文字，`m` 为高亮内容（朱砂 mark），`d` 为 mark 后续文字；缺 `pre`/`d` 时可省略。两句式 mark 也走此结构。

**图表纪律**：
- SVG 内禁 `var()` 作 presentation 属性（用 `style="stroke: var(--seal);"`）
- 圆环 viewBox `0 0 42 42` r=15.9155，首环 dashoffset=25 累减，<3% 段最小可视宽 2.3%；色序 seal→ink→muted→border
- 柱图峰值柱 `acc` 类朱砂高亮；细条图以最大值为满宽归一；阶梯固定 3 级「其一/其二/其三」

**改样式 = 改 `assets/template.html` 或构建脚本后重新生成**，绝不在生成的 HTML 上手改。

#### 3.0 · 预检：类名必须在模板的 `<style>` 里有定义（最重要）

1. 先 Read 模板的 `<style>` 块（类名唯一来源）
2. 对照 `references/layouts.md` 挑骨架，确认要用的类都存在
3. 缺类 → 在模板 `<style>` 里补，不要每页 inline 重写
4. 不要发明新类名，如需自定义用 `style="..."` inline

**墨区铁律**：top 13 / outer 12 / fold 12 / bottom 26mm；folio 在 bottom 10mm；内容与页码留白 **≥12mm（最小值，非固定值）**。上篇排版纪律：模块下方间隙大就把下一模块接上来，模块不要求独占整页。

### Step 4 · 配图（可选）

| 骨架 | 图位 |
|------|------|
| X03 序图 | 全出血通页（无 folio） |
| X06 幕封 | 低透明纹理出血图（opacity ≤ 0.16） |
| X15 岗位封面 | 全出血岗位场景图 + 竖排落款 |
| X00 封底 | 可选 logo 图位（不配也成立，靠字排） |
| X08–X13 数据页 | **不配照片**，保持数据视觉干净 |

- 一律真实照片；项目内 `images/` 相对路径引用，不得热链远程 URL；全出血 ≥ 300dpi，插图 ≥ 200dpi。
- **校徽**：仓库内置中性**占位校徽**（`images/logo-placeholder.svg`，build 自动同步）——本镜像可分享；**正式发布请把 `cover.logo` 换成真实墨色单色校徽**（置宣纸底上）。

### Step 5 · 校验（必做）

```bash
node "<C-journal>/scripts/validate-journal.mjs" "<项目目录>/<专业>-职业发展手册.html"
```

静态校验覆盖：data-layout 覆盖率（X00–X18，含 X17a–X17d 后缀）、left/right 交替、页码奇偶与递增、folio 白名单、目录 data-pg 回填、SVG var() 禁令、圆环/柱图/细条/阶梯/薪酬/路径纪律、序数连号（壹→拾贰）、对开配对、出血页 padding、图片、占位符、字体。0 错误才算过（exit 0=全过，2=仅警告）。

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
templates/C-journal/
├── README.md                    ← 你正在读
├── assets/
│   └── template.html            ← 单文件种子（全套 CSS + SLOT: theme tokens + X00–X18 骨架占位）
├── content/
│   └── example-xinnengyuan.json ← 内容清单样例（新能源汽车工程 · 10 对开 20 页全量）
├── references/
│   ├── layouts.md               ← X00–X18 页面骨架库
│   └── checklist.md             ← 质量检查清单（P0/P1/P2/P3 分级）
├── scripts/
│   ├── build-journal.mjs        ← 构建器：content JSON + template.html → 手册 HTML
│   └── validate-journal.mjs     ← 静态校验（X00–X18/页码奇偶/图表纪律/组件）
├── prototype/
│   ├── journal-prototype.html   ← 定稿原型（东方学报风，骨架唯一来源）
│   └── images/                  ← 原型配图（占位校徽/preface/job1 等）
└── dist/                        ← 构建产物（html + images/ + fonts/）

共享资源（勿复制）：
├── ../../_shared/themes.md      ← 9 套预设主题色板（hex + CMYK 双值）
└── ../../_shared/fonts/         ← MiSans / Noto Serif SC / IBM Plex Mono（build 自动同步）
```

**加载顺序建议**：
1. 读本 README 了解整体
2. Step 1 对齐澄清项
3. 动手前 Read 模板 `<style>` 块 —— 类名唯一来源
4. 读 `references/layouts.md` 挑骨架
5. 用 `_shared/themes.md` 选主题色
6. 生成后 `validate-journal.mjs` + 读 `references/checklist.md` 自检

## 参考作品

- 新能源汽车工程 · 职业发展手册（模版 C 示例，20 页）
- 学报风参考：中华书局古籍版式、陈寅恪文集排印、民国书局铅字章法（竖排书名、文武线、印章落款）
