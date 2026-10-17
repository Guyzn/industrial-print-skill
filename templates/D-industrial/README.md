# D · 工业技术风（Catalog / Technical Data / Company Profile）

版式锁死的图文混排印刷品模版。**一套内容模型（JSON）+ 一个视觉系统 + build/validate 双脚本**。
换内容只换 JSON 与主题色 token，页面物理规格、骨架、图表纪律全部不变。

## 物理规格

| 项 | 值 |
|---|---|
| 单页（成品） | 210 × 297 mm（A4） |
| 对开（成品，展开） | 420 × 297 mm |
| 印刷幅面（含出血） | **426 × 303 mm** = 成品四边各 +3mm；订口/折线处不出血 |
| 出血 | 3 mm（四缘），裁切标记画在出血区 |
| 安全区（ink area） | 上 13 / 外 12 / 中缝 12 / 下 14 mm（均自成品边起算） |
| 打印 | `@page { size: 426mm 303mm; margin: 0 }`，浏览器「打印 → 另存为 PDF」得含出血的对开幅面 |
| 屏幕 | 纵向滚动一屏一卡，屏幕所见 = 打印所得（裁切标记屏幕隐藏、打印显示） |

`paper` 可切 `cn16`（216×291 单页 / 印刷幅面 438×297）；默认 `a4`。
**报印尺寸说两遍**：成品 420×297mm 对开，含出血 426×303mm。

## 目录

```
D-industrial/
├── assets/
│   ├── template.html        ← 单文件种子（占位符由 build 注入）
│   └── blocks.css           ← 全部版式系统（@font-face / 骨架 / 打印分流）
├── scripts/
│   ├── build.mjs            ← 内容 JSON → 单文件 HTML + 同步字体（--single 内嵌 / --paper 切纸张）
│   └── validate.mjs         ← 0 错误才算过（含裁切标记、data URI 识别）
├── content/
│   ├── example-catalog.json ← 产品目录示例
│   ├── example-techdata.json← 技术数据表示例
│   ├── example-profile.json ← 企业介绍示例
│   └── images/              ← 占位图（送印前必须替换）
└── references/
    ├── layouts.md           ← 16 个骨架的用法与容量
    └── checklist.md         ← 送印前 P0 自检
```

共享工具在 `_shared/`：`inline-fonts.mjs`（字体内嵌器）、`pdf_print_marks.py`（PDF 裁切规格后处理）。

## 30 秒开始

```bash
# 目录版（html + fonts/ + images/）
node scripts/build.mjs content/example-catalog.json ./out/产品目录.html
# 单文件版（字体子集化 + 图片全部 base64 内嵌，1~2MB 一个文件）
node scripts/build.mjs content/example-catalog.json ./out/产品目录.html --single
# 校验（0 错误才算过）
node scripts/validate.mjs ./out/产品目录.html
open ./out/产品目录.html      # 浏览器打开 → 打印 → 另存为 PDF
```

`--single` 会覆盖原文件并清掉同目录的 `fonts/` `images/`——**目录版和单文件版不要输出到同一个目录**。

## 送印 PDF 四步（关键）

浏览器 print-to-pdf 只写 MediaBox，没有 TrimBox/BleedBox 和裁切标记，印厂无处对刀。补齐：

```bash
# 1. 打印（Edge/Chrome 均可）
msedge --headless=new --disable-gpu --no-sandbox \
  --print-to-pdf=out.pdf --no-pdf-header-footer "file:///.../产品目录.html"
# 2. 补印刷规格：TrimBox/BleedBox + 四角裁切标记 + 折线标记
python _shared/pdf_print_marks.py out.pdf -o 产品目录-送印.pdf
# 3. 字体嵌入自证（应只见 MiSans / IBMPlexMono 等 bundled 字体，不见 NSimSun/YaHei/Arial）
python -c "…"   # 见 checklist.md 第 3 节
# 4. 打样张
```

`pdf_print_marks.py` 依赖 pypdf（`pip install pypdf`）；`--single` 依赖 fontTools（`pip install fonttools brotli`，缺了自动退化为全量内嵌，产物约 95MB）。

## 工作流（六步）

1. **澄清** — 文档类型（catalog / techdata / profile）、语言（zh / en / bi）、主题色、页数量级。
2. **选主题** — 从 `_shared/themes.md` 的 4 套工业主题选 1，只许选不许自定义 hex。
3. **写内容 JSON** — 照 `content/example-*.json` 的结构填。表格列数、牌号卡字段、流程步骤都从这里来。
4. **构建** — `node scripts/build.mjs <json> <out.html>`（要单文件加 `--single`）。
5. **校验** — `node scripts/validate.mjs <out.html>`，**0 错误才算过**；有警告逐条人工复核。
6. **checklist 自检 + 打印核对 + 补裁切规格** — 过 `references/checklist.md`，print-to-pdf 后跑 `pdf_print_marks.py`，然后自己打一本样张。

## 三类文档的内容组织建议

### 产品目录 Catalog
- 章节：牌号总览 → 规格与交付形态 → 化学成分与力学性能 → 应用与认证 → 联系。
- 主力骨架：`D05` 牌号卡、`D06` 跨对开大表、`D08` 交付流程、`D12` 认证网格。
- 价格字段**不要写进 JSON**，除非已经过内部核价；示例 JSON 一律只放公开标准口径。

### 技术数据 Technical Data
- 章节：概述与关键指标 → 化学成分 → 力学性能与热处理 → 生产与检验流程 → 文件控制。
- 主力骨架：`D04` 正文、`D06/D07` 数据表、`D08` 热处理窗口（纵向流程）、`D11` 数字带。
- 推荐主题 `graphite`，让数字说话。

### 企业介绍 Company Profile
- 章节：我们是谁 → 能力与产能 → 历程与联系。
- 主力骨架：`D10` 全出血大图（`side:"both"` + 单个 `mode:"full"` 图块，图铺满 426×303 含出血幅面）、`D11` 数字带、`D08` 链路、`D12` 资质、`D13` 时间线、`D14` 联系页。

## 双语模式

- `meta.lang = "bi"` 时中文为主、英文为次级小字，标题层英文自动换行。
- 文本字段写 `{ "zh": "...", "en": "..." }`；两语相同的写字符串即可。
- 两语都写进 HTML，由 CSS 按 `data-lang` 显隐——**切语言不改 HTML、不改版式**，不会漂移。
- `validate.mjs` 会检查英文覆盖率，低于中文一半会警告。

## 硬纪律

1. 一份文档只用一套主题，中途不换色。
2. 只许从 `_shared/themes.md` 选主题，不接受任意 hex。
3. 图表长度全部由 `--v/--max` 计算，不手写百分比宽度。
4. 一页（一对开）一个主体；溢出先删内容或拆页，不压字号硬塞。
5. 出血、安全区、字体本地化是 P0，不许为省空间关掉。
6. `@font-face` 必须写在 `:root` **之外**——写在 `:root { }` 里会被浏览器整体丢弃，全部文本静默回退系统字体（2026-10-18 踩过，validate 查不出来，只有查 PDF 嵌入字体能发现）。
7. 送印前必须替换占位 logo 与占位插图（见 `references/checklist.md`）。

## 已知边界

- 不做 Word / PPT 输出，只出 HTML（目录版或单文件）与「另存为 PDF」+ 后处理的对开印刷成品。
- 不依赖无障碍树，因此没有「段落内精确选词」的问题；但也不做文字检索优化。
- 图表只有数据条、圆环、数字带三类，不做折线/散点/堆叠——需要的话先提需求再扩，不要临时改 CSS。
- `--single` 的 SVG 内文字会注入 MiSans 子集兜底；外部 SVG 自带字体列表的，在目录版里仍按该列表回退（换真实 logo 后自然消失）。
