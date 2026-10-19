# F · 单页技术数据风（Technical Data）

牌号技术数据表（TDS）、检验规范、热处理工艺卡。**一页一个主题，单页成册。**

与 D 的分工：**产品目录 Catalog 留 D**（对开拼版、跨页大图）；**技术数据 Technical Data 在 F**——
TDS 以表格为主、按单页阅读，对开单位对单牌号 TDS 偏大（实测 18 页里 3–4 页留白 40–60%）。

## 物理规格

| 项 | 值 |
|---|---|
| 成品单页 | 210 × 297 mm（A4 竖版） |
| 出血 | 四缘各 3mm |
| 印刷幅面 | 216 × 303 mm |
| TrimBox | 幅面内缩 3mm = 210 × 297，由 `_shared/pdf_print_marks.py` 写入 |
| 裁切标记 | 每页 8 个（四角 L 形）；跨对开的半页只标外侧 4 个 |
| 换口径 | `--paper cn16` → 成品 216×291、幅面 222×297 |

## 快速开始

```bash
# 构建（--single 出单文件：字体子集化 + 图片 base64）
node templates/F-techdata/scripts/build.mjs \
  templates/F-techdata/content/example-techdata.json \
  ./H13-TDS.html --single

# 校验（0 错误才算过）
node templates/F-techdata/scripts/validate.mjs ./H13-TDS.html

# 打印：Chrome/Edge → 打印 → 另存为 PDF，页边距「无」，关闭页眉页脚
# 补印刷规格
python _shared/pdf_print_marks.py H13-TDS.pdf -o H13-TDS-送印.pdf
```

构建参数：`--paper a4|cn16`、`--lang zh|en|bi`、`--theme <slug>`（技术数据默认 `graphite`）、`--single`。

## 写之前先读

**`references/grade-datasheet.md`**——牌号技术数据的 L0–L6 骨架（牌号身份→标准对应→成分→性能→热处理→检验→免责依据）、
P0/P1/P2 缺口清单、旧版 TDS 常见 8 处硬伤。写任何牌号的 TDS 内容前先按骨架过一遍，一层不缺。

## 技术数据的三个专属机制

### 1. 数据身份 `basis`（标了就要标全）

同一个数字在 TDS 里有三种身份：标准要求（spec）、典型值（typical）、范围/最值（range/min/max）。
混排会让客户把典型值当保证值——这是纠纷源头。

```jsonc
{ "head": "室温力学性能", "basis": "typical", "cond": "TC-A", "cols": […], "rows": […] }
```

- 表级 `basis`：表题第二行打徽标（`spec` 黑 / `typical` 主题色 / 其余灰）。
- 列级 `cols[].basis`：同一张表里既有标准范围又有典型值时，标在列头下面。
- `basis:"none"`：工序表、清单、缺陷对策表这类**不含验收数值**的表，显式豁免。
- validate 检查完整性：一部分表标了、其余没标 → 警告。全不标不警告（但送印 checklist 会拦）。

### 2. 试验条件 `cond`（条件只写一处）

淬火温度、回火温度、保温时间在 `meta.test_conditions` 登记一次，性能表用 `cond:"TC-A"` 引用：

```jsonc
"meta": { "test_conditions": [
  { "id": "TC-A", "label": { "zh": "淬回火基准", "en": "H&T basis" },
    "items": ["Austenitised 1010 °C", "Air cooled", "Tempered 2 × 2 h"] }
] }
```

引用不存在的 id → build 报错；登记了没表引用 → build 警告（要么漏写 cond 要么多写了条件）。

### 3. 工艺参数表 `variant:"proc"` + 显式列宽

热处理页不用散文——散文里查不到「回火 1 小时还是 2 小时」。

```jsonc
{ "head": "按工序汇总", "variant": "proc", "basis": "spec",
  "cols": [ { "k": "工序", "en": "Operation", "w": "15%" }, … ],
  "rows": [
    { "group": { "zh": "前处理", "en": "Pre-treatment" } },   // 分组行，横跨全表
    [ { "zh": "软化退火", "en": "Soft annealing" }, "860–900 ℃", … ]
  ] }
```

- `proc`：首列加粗（工序名）、列头中英分行、长文本列正常折行（不顶穿相邻列）。
- `cols[].w`：显式列宽 + `table-layout:fixed`。不给列宽时浏览器按内容分配，短列会被撑得比长列还宽。
- `{group}` 分组行：一张大表分「前处理 / 硬化 / 回火」几段读；validate 列数核对自动跳过。

## 页面类型

| type | 用途 | 关键字段 |
|---|---|---|
| `cover` | 封面 | `meta.cover`：标题 + 副标 + slogan + 品牌 |
| `backcover` | 封底 | `statement` `note` `contact:[{k,lines[]}]` `kicker`；TDS 用作「文件控制」页 |
| `contents` | 目录 | `groups[].items[].ref` → 页面 `id`，页码自动 |
| `section` | 通用内容页 | `title` `sub` `lede` `blocks[]` |
| `grade` | 牌号概述页 | `banner{code,family,standards}` + `blocks[]`，横幅自动出血 |
| `tablepage` | 密表页 | `tables:[{head, basis, cond, variant, cols, rows, note}]`，整页字号自动放大一档 |
| `gallery` | 图集 | 金相照片、车间设备 |
| `contact` | 联系页 | `columns:[{head,rows:[{k,v}]}]` |
| `spread` | 跨对开 | 偶有大图时用；必须从偶数页起 |

块类型：`text` `table` `twin` `note` `kv` `dash` `dashgroups` `adv` `photos` `photo` `bleed` `chips` `twocol` `spacer` `svg` `flow`。

- **`svg`**：曲线图（尺寸变化、回火曲线）内联进页面，继承页面字体——`<img>` 引 SVG 会掉字体。
- **`flow`**：工艺流程。`dir:"v"` 纵向（步骤多可加 `cols:2` 分两栏），默认横向。
- **`spacer`** / `photo fill:true`：吃掉页面剩余高度，页尾不留白。

## 竖向分配与密表页纪律

剩余高度默认：有吸收块顶部起排；块 ≥4 摊进块间；块 1–3 居中。`page.valign` 覆盖。

⚠️ **密表页（两张以上大表）必须 `valign:"top"`**。居中模式下内容一旦略高，溢出会平分向上下两端，
上半截直接盖住页标题（2026-10-19 踩过：F 工艺参数页标题被白块吃掉一半）。
页头已加 `background + z-index` 兜底，但内容超高仍会从页脚方向溢出——减行、压 padding、拆页，三选一。

## 常见问题

**表格数字对不齐。** 数值列加 `num: true`（右对齐）。

**英文稿数字整列消失。** 不会了——纯 ASCII 单元格（数字、单位、牌号）不套语言层，两种语言模式都在。

**单元格里中英挤在一起。** 给 `{zh,en}` 对象，英文自动换行或加间隔点；不要写「碳Carbon」这种拼接字符串。

**页尾超过 40mm 空白。** 加 `spacer` 吸收，或把下一张表提上来；不许压字号。

**目录页码空白。** `items[].ref` 写页面 `id`，不是标题。

## 目录结构

```
templates/F-techdata/
├── assets/
│   ├── template.html      ← 外壳（主题与 CSS 由 build 注入）
│   └── blocks.css         ← 版式系统 + 技术数据专用段（tag/cond/proc/flow/fig-svg）
├── content/
│   ├── example-techdata.json   ← H13 TDS 示例（10 页，含 basis/cond/proc 全特性）
│   └── images/
├── scripts/
│   ├── build.mjs
│   └── validate.mjs
├── references/
│   ├── grade-datasheet.md ← 牌号技术数据骨架（必读）
│   └── checklist.md       ← 送印前人审清单
└── README.md
```
