# 模版 A · 高校职业发展手册

> 路由命中「职业发展手册 / 就业指导手册 / 专业认知手册 / 新生专业手册 / career handbook」时使用本模版。
> 版式锁死：换专业只换「内容清单 JSON + 主题色 token」，页面结构、骨架、图表纪律全部不变。

## 这个模版做什么

生成**单文件 HTML** 的竖排可打印职业发展手册：

- **屏幕阅读**：整个文档 = 若干 `.spread` 对开卡（420×285 横版）纵向堆叠滚动，一屏一卡，悬浮目录锚点导航。
- **打印输出**：`@media print` 下每个 `.spread` 输出为一张 420×285mm（默认含 3mm 出血 = 432×291）横版页 → 浏览器「另存为 PDF」直接得到对开拼版成品，屏幕所见 = 打印所得。
- **内容模型**：每页是固定内容块（`.page` 210×285 骨架单元，`data-layout="Lxx"` 登记版式），内容不跨页自然流动，可单独校验不溢出。

**风格锚点**：瑞士国际主义 × 教育印刷品——无衬线（MiSans）、直角纯色、hairline 细线、单一 accent、极致字号对比、数据全部由数据计算。

## 工作流

### Step 0 · 启动前（必做）

- **读取当前选中的源文档**（如 `新能源汽车工程-职业发展手册2026.07.27.docx`）。docx 是 zip，用下面命令解出文本：

```bash
cd <项目目录>
# macOS 最快：textutil 直接转纯文本（无 pandoc 时用）
/usr/bin/textutil -convert txt "<源文档.docx>" -output /tmp/career-source.txt

# 通用法（docx 是 zip）：
mkdir -p /tmp/career-docx && cd /tmp/career-docx
unzip -o "<源文档.docx>" >/dev/null
python3 -c "
import re,html
t=open('word/document.xml',encoding='utf-8').read()
t=re.sub(r'<w:p[ >]','\n<w:p ',t)
t=re.sub(r'<[^>]+>','',t)
t=html.unescape(t)
t=re.sub(r'\n{3,}','\n\n',t)
print(t)
" > /tmp/career-source.txt
```

然后完整读一遍 `/tmp/career-source.txt`，摸清文档骨架（封面/序/目录/章节/岗位结构/数据图表）。

### Step 1 · 需求澄清（动手前必做，可跳过若 brief 已完整）

| # | 问题 | 为什么问 |
|---|------|---------|
| 1 | **专业名 / 学校学院名 / 年份** | 填封面与全部页眉页脚，不可缺 |
| 2 | **主题色选哪套**？ | 9 套预设（`_shared/themes.md`，第 9 套朱砂为模版 C 专属），只许选不许自定义 hex |
| 3 | **有没有源文档**（docx / md / 网页）？ | 有就基于文档，没有帮他搭内容框架 |
| 4 | **章节范围**？默认全量（封面+序+目录+两部分幕封+内容） | 可能只做某一章 |
| 5 | **配图需求**？哪些部分需要生成岗位/场景照片 | 决定图位是否填充（图位可留空自动隐藏） |
| 6 | **硬约束**？(必须含 XX 数据 / 不能出现 YY / 页数限制) | 避免返工 |

**内容清单（content manifest）约定**：把源文档内容结构化进 `content/<专业>.json`。**换专业 = 换一份 JSON + 换主题色 token**，页面顺序与骨架不变。

### Step 2 · 主题色与元信息（都在 JSON 里）

在内容 JSON 的 `meta` 里指定：

- `title`：手册标题（写入 `<title>` 与页脚）
- `theme`：9 套主题 slug 之一，构建时自动从 `_shared/themes.md` 注入 token（含封面 `--cov-*` 四 token）
- `sample`：`true` = 浓缩样板（单页展示）；`false` = 全量（自动拼对开）

**硬规则**：一份手册只用一套主题，不混搭、不接受自定义 hex。

### Step 3 · 填内容 + 构建（JSON → HTML，不手改生成的 HTML）

1. **写内容清单 JSON**：`content/<专业>.json`。参考 `content/example-xinnengyuan.json`（全量）与 `content/sample-xinnengyuan.json`（浓缩样板）。
2. **读骨架库**：`references/layouts.md`，理解每个骨架（L00 封面+封底 / L01+L02 序+目录 / L03s 单页幕封 / L04–L09 数据页 / L10 岗位封面 / L11 岗位详解）对应的 JSON 字段。
3. **运行构建脚本**生成手册：

```bash
node "<A-career>/scripts/build-handbook.mjs" \
  "<A-career>/content/<专业>.json" \
  "<项目目录>/<专业>-职业发展手册.html"
```

- **样板模式**：JSON `meta.sample=true` → 幕封、数据页、岗位页全部以 `.spread.single` 单页展示，用于逐页过样式。
- **全量模式**：`meta.sample=false` → 配对器自动把内容页两两拼成对开；岗位详解按字符预算自动分页，一节不拆页。
- **第一部分数据页自动排版（用户锁定）**：① 除幕封和顶部带图页外，所有页自动加页头 `.data-run`（续页）或由顶图/band 首页兼作页头；② 模块间距统一 12mm；③ 图解块一律**上文后图表**堆叠；④ 图表多色相（`.bar-fill` 用 `var(--bar)`）；⑤ **唯一分页约束 = 内容底部距页码分割线留白 ∈ [6,14]mm**，页数由内容撑出，无奇偶/幕封左页约束。真实 mm 常量见 `references/layouts.md`「第一部分数据页排版纪律」，改内容勿手算。
- **改样式 = 改 `assets/template.html` 或构建脚本后重新生成**，绝不在生成的 HTML 上手改。

#### 3.0 · 预检：类名必须在模板的 `<style>` 里有定义（**最重要**）

**在写任何页面代码之前**：

1. **先 Read 模板的 `<style>` 块末尾**（类名唯一来源）
2. **对照 layouts.md 的 Pre-flight 类名清单**，确认要用的类都存在
3. 缺类 → **在模板 `<style>` 里补**，不要每页 inline 重写
4. **不要发明新类名**，如需自定义用 `style="..."` inline

**布局完整性**：每页内容必须完整落在 210×285 内（正文 ≥ 9pt；唯一分页约束见上）。骨架库 `references/layouts.md` 开头有「溢出纪律」。

### Step 4 · 配图（可选，按需生成）

| 骨架 | 图位 |
|------|------|
| L00 封面（右半） | 专业主视觉大图（低透明纹理） |
| L03s 幕封 | 可选低透明纹理图 |
| L10 岗位封面 | 岗位场景主图 |
| L11 岗位详解 | 每岗位 1 张岗位场景小图 |
| L01 序 | 通栏配图（高 62mm，可省） |
| L04–L09 数据页 | **不配照片**，保持数据视觉干净 |

- 一律用真实照片，瑞士风处理 = 低饱和 / 统一色调 overlay；内容为空时图位自动隐藏。
- 图片存放：项目内 `images/{页码}-{语义}.{ext}`，相对路径引用，**不得热链远程 URL**。
- 分辨率：全出血图 ≥ 300dpi 等效，普通插图 ≥ 200dpi。
- **校徽**：仓库内置中性**占位校徽**（`images/logo-placeholder.svg`，build 自动同步到输出目录）——本镜像可分享；**正式发布请把 `cover.logo` 换成真实校徽图**（建议白色版 SVG）。

### Step 5 · 校验（必做）

```bash
# 全量模式
node "<A-career>/scripts/validate-handbook.mjs" "<项目目录>/<专业>-职业发展手册.html"
# 样板模式（目录引用未收录页降级为警告）
node "<A-career>/scripts/validate-handbook.mjs" "<项目目录>/<专业>-职业发展手册.html" --sample
```

静态校验覆盖：目录锚点齐全、章节编号连续、打印样式存在、图表 `--v/--max` 纪律、版式登记 `data-layout`、页脚页码连续。0 错误才算过（exit 0=全过，2=仅警告）。

**几何校验（防静默裁切）**：`.page` 是 `overflow:hidden`，溢出会被裁掉且静态校验查不出。必须用 headless Chrome 注入探针脚本逐页量 `scrollHeight - clientHeight`（应为 0），并 `--print-to-pdf` 确认 PDF 页数 = 对开数、页面尺寸 = 432×291mm（1225×825pt）。

### Step 6 · 对照 checklist 自检

打开 `references/checklist.md` 逐项对照。P0 项（页面溢出、出血安全区、图表数据、字体嵌入、跨页断裂）必须全过。

### Step 7 · 本地预览 + 打印核对

```bash
open "<项目目录>/<专业>-职业发展手册.html"
```

- 浏览器竖排滚动阅读，目录锚点可跳转
- 点右下角「打印」按钮 → 另存为 PDF → 核对 420×285（默认含 3mm 出血）对开拼版
- 需要办公室直打（不要出血）：在 `<body>` 加 `.no-bleed` 类后重新导出（精确 420×285）

### Step 8 · 迭代

模板 CSS 高度参数化，90% 的调整是改 inline style 或改内容 JSON 后重填。**不要为了微调破坏版式锁**——先改内容，再改版式，最后才是模板。

## 资源文件导览

```
templates/A-career/
├── README.md                    ← 你正在读
├── assets/
│   ├── template.html            ← 单文件手册种子（页面系统 CSS + 打印拼版 + 全部骨架 SLOT + 目录/打印 JS）
│   └── divider-nums/            ← 幕封大号数字 SVG
├── content/
│   ├── example-xinnengyuan.json ← 内容清单样例（新能源汽车工程·全量 6 岗位）
│   └── sample-xinnengyuan.json  ← 浓缩样板（meta.sample=true，单页展示）
├── references/
│   ├── layouts.md               ← L00–L11 页面骨架库（含 Pre-flight 类名清单 + 图位标记）
│   ├── components.md            ← 图表 / 表格 / 页眉页脚 / 目录 / 勾选框等组件手册
│   └── checklist.md             ← 质量检查清单（P0/P1/P2/P3 分级）
└── scripts/
    ├── build-handbook.mjs       ← 构建器：content JSON + template.html → 手册 HTML（样板/全量两模式）
    └── validate-handbook.mjs    ← 静态校验（锚点/编号/打印样式/图表纪律；--sample 样板模式）

共享资源（勿复制）：
├── ../../_shared/themes.md      ← 9 套预设主题色板（hex + CMYK 双值）
└── ../../_shared/fonts/         ← 可商用字体本地化（构建时自动同步到生成物旁）
```

**加载顺序建议**：
1. 读本 README 了解整体
2. Step 1 对齐澄清项
3. **动手前 Read 模板 `<style>` 块** —— 类名唯一来源
4. 读 `references/layouts.md` 挑骨架
5. 用 `_shared/themes.md` 选主题色，`references/components.md` 查组件用法
6. 生成后 `validate-handbook.mjs` + 读 `references/checklist.md` 自检

## 参考作品

- 新能源汽车工程 · 职业发展手册（2026.07 样板）
- 瑞士国际主义风格参考：Josef Müller-Brockmann 网格系统、Massimo Vignelli NYC Subway
