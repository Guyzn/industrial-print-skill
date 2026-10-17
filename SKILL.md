---
name: industrial-print-skill
description: 生成印刷级图文混排文档（单文件 HTML 可打印分页；成品 A4 单页 210×297mm、对开 420×297mm，含 3mm 出血的印刷幅面 426×303mm，订口不出血）：一套内容模型（JSON）+ 多套版式锁死风格，按「文档类型 × 风格关键词」路由。三类主文档——产品目录 Catalog（牌号卡/规格表/化学-力学双表/工艺流程/认证网格）、技术数据 Technical Data（成分表/性能表/热处理窗口/检验项）、企业介绍 Company Profile（数字带/产能流程/资质/历程/联系页）；另有高校手册线（职业发展/就业指导/新生手册）走 A/B/C 三套教育风格。内置数据条/圆环/数字带图表、pull-quote 引文、时间线等图文混排组件；13 套主题色板（hex+CMYK 双值）、MiSans 等可商用字体，build --single 出 1~2MB 单文件，@media print + pdf_print_marks 后处理出带 TrimBox/BleedBox/裁切标记的送印 PDF。支持 zh/en/bi 三语模式。换内容只换 JSON 与配色，换风格只换发起词，版式永不漂移。适用：产品目录/技术数据表/企业介绍/宣传册/白皮书/行业报告/高校手册等图文混排印刷品，或提到「印刷」「送印」「对开」「出血」「裁切标记」「目录」「手册」等词时使用。
---

# 印刷品生成 Skill（多风格路由版）

> 一套**版式锁死**的图文混排印刷品生成系统：**一套内容模型（JSON）+ 多套视觉风格**。
> 同一份内容可在风格间互转；换内容换配色，换风格换发起词——页面物理规格、骨架、图表纪律全部不变。

## 路由（第一步，必做）

**先判文档类型，再判风格。命中后只加载该模版目录下的资源——不要同时读多套。**

### 第一步：文档类型

| 用户要做的文档 | 模版 | 目录 |
|---|---|---|
| 产品目录 / Catalog / 牌号册 / 供货范围 | **D · 工业技术风** | `templates/D-industrial/` |
| 技术数据表 / Technical Data / 数据表 / 检验规范 | **D · 工业技术风** | `templates/D-industrial/` |
| 企业介绍 / Company Profile / 宣传册 / 白皮书 | **D · 工业技术风** | `templates/D-industrial/` |
| 职业发展 / 就业指导 / 人才培养方案 / 新生手册 | A / B / C 教育线 | `templates/A-career` `B-editorial` `C-journal` |

### 第二步：主题色（D 模版）

D 模版为**单一工业技术风**，视觉差异由**主题色**承担：

| 主题 slug | 名称 | 适用 |
|---|---|---|
| `steel-blue` | 🔧 钢蓝（默认） | 特种钢/合金产品目录、通用工业 |
| `graphite` | ⬛ 石墨 | 技术数据表、检验规范、白皮书 |
| `oxide-red` | 🟥 氧化红 | 热作模具钢、热处理、锻件 |
| `deep-pine` | 🌲 深松绿 | 不锈钢深加工、绿色制造、长效件 |

规则：用户指定主题就用指定的；未指定按文档类型推荐（目录→钢蓝、技术数据→石墨）；**只许从 `_shared/themes.md` 选，不许自定义 hex**。

## 语言模式（D 模版）

`meta.lang` 三选一：`zh`（仅中文）/ `en`（仅英文）/ `bi`（双语，中文主、英文次级）。

- 文本字段可写字符串（两语同文）或 `{ "zh": "...", "en": "..." }` 对象。
- **两语都写进 HTML**，由 CSS 按 `data-lang` 显隐——切语言不改 HTML、不改版式。
- 外贸文档默认 `bi`。

## 骨架编号（D · 工业技术风）

| 编号 | 版式 | 承载块 |
|---|---|---|
| D00/D01 | 封面（左右页） | 自动生成 |
| D02 | 目录 | 自动生成 |
| D03 | 章节 opener | 自动生成 |
| D04 | 双栏/三栏正文 + pull-quote | `text` |
| D05 | 牌号卡网格（2/3 列） | `grades` |
| D06 | 全宽规格表（可跨对开） | `table` |
| D07 | 化学-力学双表 | `twin` |
| D08 | 工艺流程（横/纵） | `flow` |
| D09 | 图表对（数据条 + 圆环/数字） | `chart` |
| D10 | 全出血大图 + 图注 | `image` |
| D11 | 数字带（3/4/5 格） | `stats` |
| D12 | 认证网格（4 列） | `certs` |
| D13 | 时间线 | `timeline` |
| D14 | 联系页（双栏 + 署名） | `contact` |
| D15 | 幕封/分隔 | `divider` |

## 内容模型（meta.std = 0.2）

```jsonc
{
  "meta": {
    "std": "0.2",                  // 固定
    "doc": "catalog",              // catalog | techdata | profile
    "lang": "bi",                  // zh | en | bi
    "theme": "steel-blue",         // 见上表
    "paper": "a4",                 // a4(210×297) | cn16(216×291)
    "doc_no": "SS-CAT-2026-01",
    "year": "2026",
    "title":  { "zh": "...", "en": "..." },
    "company": { "zh": "...", "en": "..." },
    "org_line": { "zh": "...", "en": "..." },
    "logo": "images/logo-placeholder.svg",
    "footer": "页脚文字 · 文档编号",
    "toc_title": { "zh": "目录", "en": "Contents" },
    "cover": {
      "kind":  { "zh": "产品目录", "en": "Product Catalogue" },
      "title": { "zh": "标题\\n可断行", "en": "Title\\nline break" },
      "sub":   { "zh": "副标", "en": "Subtitle" },
      "stats": [ { "v": "AMS", "label": { "zh": "航空标准", "en": "Aerospace" } } ]
    }
  },
  "toc": true,
  "sections": [
    {
      "id": "s1", "no": "01",
      "title": { "zh": "牌号总览", "en": "Grade Overview" },
      "lede":  { "zh": "章节导语", "en": "Section lede" },
      "guide": [ { "no": "01", "title": { "zh": "…", "en": "…" } } ],
      "spreads": [
        {
          "id": "sp-grades", "layout": "D05",
          "side": "both",                       // both=跨对开 | left | right
          "title": { "zh": "…", "en": "…" },
          "blocks": [ { "type": "grades", "cols": 3, "cards": [ … ] } ]
        }
      ]
    }
  ],
  "dividers": [ { "no": "END", "title": {…}, "note": {…} } ]
}
```

### 块类型速查

| type | 关键字段 |
|---|---|
| `text` | `cols`(2/3) `paras[]` `pull:{q,who}` |
| `grades` | `cols`(2/3) `cards:[{code, code_en, name, rows:[[k,v]], badges[]}]` |
| `table` | `tables:[{caption, cols:[{k,en,num}], rows, compact, zebra}]` `note` |
| `twin` | `tables:[…]` `wideLeft` |
| `flow` | `dir`("h"/"v") `steps:[{title, desc}]` |
| `chart` | `bars:{max, rows:[{label,v,val}]}` / `donut:{max,v,label,legend:[{k,v,s}]}` / `nums:[{v,label}]` |
| `image` | `mode`("full"/"plate") `src` `caption` `no` |
| `stats` | `cols`(3/4/5) `cells:[{v,label}]` |
| `certs` | `cells:[{code, name}]` |
| `timeline` | `events:[{yr, title, desc}]` |
| `contact` | `cols:[{title, rows:[{k,v}]}]` `sign:{name, line}` |

## 使用流程（开发者）

```bash
# 1. 写内容 JSON（参考 templates/D-industrial/content/example-*.json）
# 2. 构建（加 --single 得单文件：字体子集化 + 图片 base64，1~2MB）
node templates/D-industrial/scripts/build.mjs \
  templates/D-industrial/content/example-catalog.json \
  ./产品目录.html
# 3. 校验 —— 🔴 0 错误才算过，不过不允许进下一步
node templates/D-industrial/scripts/validate.mjs ./产品目录.html
# 4. 浏览器打开 → 打印 → 另存为 PDF
# 5. 补裁切规格（浏览器不写 TrimBox/BleedBox，印厂无处对刀）
python _shared/pdf_print_marks.py 产品目录.pdf -o 产品目录-送印.pdf
# 6. 字体嵌入自证：PDF 里只许见 MiSans/IBMPlexMono 等，见 NSimSun/YaHei/Arial 即回退
```

口径：成品 A4 单页 210×297 / 对开 420×297；含 3mm 四缘出血的印刷幅面 426×303（订口不出血）。
`--single` 依赖 fontTools（`pip install fonttools brotli`），`pdf_print_marks.py` 依赖 pypdf。

完整工作流（澄清 → 选主题 → 写 JSON → 构建 → 校验 → checklist 自检 → 打印核对 → 补裁切规格）见
`templates/D-industrial/README.md` 与 `references/checklist.md`。

## 失败模式与回退（按症状查）

每条都是真实踩过的坑。症状对上前先做一线修复；**仍失败走兜底，兜底也不行才停下来问人**。

| 症状 | 一线修复 | 仍失败的兜底 |
|---|---|---|
| validate 报「HTML 引用了 ./fonts/ 但产物旁没有 fonts 目录」 | 重跑不带 `--single` 的 build，或手工 `cp -r _shared/fonts/ <产物目录>/` | 查 build 输出里的「字体已同步」日志；确认输出目录可写 |
| PDF 里出现 NSimSun / MicrosoftYaHei / Arial / Menlo / PingFangSC | ① 确认 `@font-face` 写在 `:root` **之外**（写在 `:root{}` 内会被浏览器整体丢弃，整份文档静默回退系统字体）；② 改稿加了新字符 → 重跑 `--single` 重新收集子集 | `--no-subset` 全量内嵌对比定位；若外部 SVG 自带字体列表，换真实 logo（转路径）或走 `--single` 注入 WBEmbeddedSVG |
| `--single` 产物 > 20MB（没瘦身） | fontTools 没装上，走了全量内嵌 → `pip install fonttools brotli` | `SUBSET_PYTHON` 指定带 fontTools 的解释器；`PYFTSUBSET_CMD` 指定 pyftsubset 路径 |
| 印厂反馈「没有裁切标记 / 裁切尺寸不对」 | 送印 PDF 漏跑后处理 → `python _shared/pdf_print_marks.py x.pdf -o x-送印.pdf` | `--trim` / `--gap` 调参（如 `--trim 5mm`）；确认源 PDF 是 Edge/Chrome `--no-pdf-header-footer` 产物 |
| build 报「未知块类型: X」 | JSON 的 `type` 拼错或混用了教育线字段 → 对照本文「块类型速查表」 | 对照 `templates/D-industrial/content/example-*.json` 的合法写法 |
| build 报「主题不存在: X」 | `meta.theme` slug 拼错 → 从 `_shared/themes.md` 选：steel-blue / graphite / oxide-red / deep-pine | 同上，只许选不许自定义 |
| 打印出的 PDF 页数翻倍或空白页 | 有人改过 `@page` 或 `@media print` → 核对 `@page { size: 426mm 303mm }`（a4）未被改动 | 用 `validate.mjs` 的「裁切标记」计数反查对开数 |
| 拿教育线（A/B/C）的 JSON 喂 D 模版报 TypeError | 三套字段有差异（B 有 `glance`、C 有 `divider`/`editor`、A 有 `sample`）→ 按 D 的 example 重建，不要硬改 | 直接照 `example-catalog.json` 抄结构 |
| 目录版与 `--single` 输出到同一目录 | `--replace` 按设计清掉同目录 `fonts/` `images/` → 两个版本分目录输出 | 目录版重新 build 一次即可 |
| 提示缺 pypdf / fontTools | `pip install pypdf` / `pip install fonttools brotli` | 无 fontTools 时 `--single` 退化为全量内嵌（约 95MB，功能不受影响）；无 pypdf 则手工给印厂报 TrimBox 坐标 |

## 核心设计原则（不可妥协）

1. **单主题单 accent** — 一份印刷品只用一套主题色，accent 小面积点缀，禁止大面积铺色。
2. **直角纯色** — 不允许渐变 / 阴影 / 圆角（hairline 分割线除外）。
3. **网格至上** — 8px 基线网格；「留白」与「故意错位」都是建立在对齐自知之上的有意选择。
4. **数据由数据计算** — 图表长度全部由 `--v/--max` 计算，每个数据点有类别 + 数值标签。
5. **一页（一对开）一个主体** — 溢出先删内容/拆页，不压字号硬塞。
6. **印刷先于屏幕** — 出血 3mm、安全区、字体本地化嵌入为 P0；PDF 送印前必须补 TrimBox/BleedBox + 裁切标记。
7. **共享一个物理规格** — A4 210×297 / 对开 420×297（含出血印刷幅面 426×303），内容 JSON 可互转。
8. **🔴 价格禁编造** — 目录/报价类内容中的价格必须经内部核价后填入，示例 JSON 只放公开标准口径。
9. **字体嵌入要自证** — PDF 里出现系统字体（NSimSun/YaHei/Arial/Menlo/PingFangSC）即失败；`@font-face` 写在 `:root{}` 内会被浏览器整体丢弃，属静默故障。

## 共享资源（勿复制）

```
industrial-print-skill/
├── SKILL.md                 ← 你正在读（路由 + 通用纪律）
├── _shared/
│   ├── fonts/               ← 可商用字体（MiSans + 阿里普惠 + IBM Plex Mono + Noto Serif SC）
│   ├── placeholders/        ← 中性占位 logo
│   ├── themes.md            ← 13 套主题色板（hex + CMYK），含 D 模版专属 token
│   ├── inline-fonts.mjs     ← 字体内嵌器：目录产物 → 单文件（子集化 + base64）
│   └── pdf_print_marks.py   ← PDF 后处理：TrimBox/BleedBox + 裁切标记 + 折线标记
└── templates/
    ├── D-industrial/        ← 工业技术风：Catalog / Technical Data / Company Profile
    ├── A-career/            ← 教育线：极简瑞士风
    ├── B-editorial/         ← 教育线：杂志编辑风（默认）
    └── C-journal/           ← 教育线：东方学报风
```

## 适合 / 不适合

| 适合 ✔ | 不适合 ✘ |
|---|---|
| 产品目录 / 技术数据表 / 企业介绍 | 需要 Word / PPT / 在线编辑格式的文档 |
| 送印刷厂的实体手册 | 需要交互、视频等电子阅读体验的内容 |
| 图表与图文混排密集的印刷品 | 需要自定义任意版式的「自由排版」需求 |
| 中英双语外贸文档 | 单页非对开、无出血规格的轻量文档 |

🔴 **STOP · 送印前强制人审**：`validate.mjs` 0 错误只是机械合格。送印前必须逐条过 `templates/D-industrial/references/checklist.md` 的 P0 清单，并人工核对样张——占位 logo/插图是否已换、价格是否已核价、PDF 字体嵌入自证是否干净，三项任何一项存疑即停。

## 反例与黑名单（不要做什么）

只写「应该做」会漏掉真正的翻车源。以下每条都是**禁止项**，见到即停：

1. **不许自定义 hex / 自造主题** — 只从 `_shared/themes.md` 选，选不出就向用户要偏好，不许现场调色。
2. **不许把 `@font-face` 写进 `:root { }`** — at-rule 在样式块内被浏览器整体丢弃，整份文档静默回退系统字体，validate 0 错误也发现不了。
3. **不许手写图表长度百分比** — 图表宽度一律由 `--v/--max` 计算；手写的值改数据后不会跟着变。
4. **不许为省空间关掉字体本地化或出血** — 这两项是 P0；嫌文件大走 `--single` 子集化，不许砍规格。
5. **不许压字号硬塞内容** — 正文不低于 8pt；溢出先删内容或拆对开。
6. **不许编造价格或技术数据** — 没有核价来源的字段一律删；成分/力学/热处理数据必须与正式技术文件一致。
7. **不许把目录版和 `--single` 版输出到同一目录** — `--replace` 会清掉同目录 `fonts/` `images/`，把另一个版本搞残。
8. **不许不经字体嵌入自证就发 PDF** — 见到 NSimSun/YaHei/Arial/Menlo/PingFangSC 任何一个即打回，不许「看起来差不多」。
9. **不许拿 A/B/C 教育线的 JSON 直接喂 D 模版（或反向）** — 字段有差异，按目标模版 example 重建。
10. **不许改 `@page` 尺寸、删 `@media print` 规则、注释掉 `print-color-adjust: exact`** — 这三处一动，打印规格和底色全丢。
11. **不许拿屏幕截图当送印依据** — 屏幕是 screen media（无裁切标记、无出血判断）；送印核对以 print-to-pdf 产物为准。
12. **不许把「示例占位」字样、占位 logo、占位插图留给客户** — 送印前 P0 替换，见 checklist。

## 字体版权

内置字体均为可商用字型：MiSans、Alibaba PuHuiTi 3、IBM Plex Mono、Noto Serif SC。
来源与许可明细见 `_shared/fonts/README.md`——随仓库发布请保留该文件。

## License

MIT
