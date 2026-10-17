> ⚠️ 本文件只覆盖 **A/B/C 教育线**（高校手册）。2026-10-18 已新增 **D · 工业技术风**模版（产品目录 Catalog / 技术数据 Technical Data / 企业介绍 Company Profile），路由与内容模型以根目录 `SKILL.md` 为准，D 模版详情见 `templates/D-industrial/README.md`。

# 教育线（A/B/C）实施计划 · 历史存档

> 存档说明：本计划只覆盖教育线 A/B/C 三模版的原始实施过程。当前技能以工业线 D 模版为主线，
> 路由与内容模型一律以根目录 `SKILL.md` 为准。
> 模版 A（简洁教育×极简瑞士风）、模版 B（杂志编辑风）、模版 C（东方学报风）**均已建成并端到端验证通过**。
> 每套都沿同一条创建路径：先出关键页面成品原型（用户评审定稿）→ 再抽骨架库 → 再写构建/校验脚本 → 最后端到端验证。

## 0. 总目标与路由

| 模版 | 风格 | 触发关键词（写入 SKILL.md description 与路由表） | 构建/校验脚本 |
|------|------|------------------------------------------|----------------|
| **A-career**（已建成） | 简洁教育 × 极简瑞士风 | 瑞士风 / 简洁 / 极简 / 干净 / minimal / swiss | `build-handbook.mjs` / `validate-handbook.mjs` |
| **B-editorial**（已建成） | 杂志编辑风（默认） | 杂志 / 编辑风 / 杂志编辑 / 图文混排 / 文章式 / editorial / magazine / liker / 无风格词默认 | `build-magazine.mjs` / `validate-magazine.mjs` |
| **C-journal**（已建成） | 东方学报风 | 学报 / 书院 / 东方 / 竖排 / 宋体 / 宣纸 / 印章 / 学术 / journal | `build-journal.mjs` / `validate-journal.mjs` |

路由原则：
- 内容类型（职业发展/就业指导/培养方案/专业认知…）**不参与路由**——三套都能做同族内容，区别只在视觉。
- 风格词命中或未命中时**默认走 B（杂志编辑风）**；用户点名风格再切换，不猜。
- 三套共用：`_shared/fonts/`（MiSans + 阿里普惠 + IBM Plex Mono，46MB 只存一份）、`_shared/themes.md`（9 套主题色板，第 9 套朱砂为 C 专属）、**同一内容 JSON 结构**（`meta.std` / cover / chapters）。
- 各模版自持：`assets/template.html` 种子、`references/`（layouts / components / checklist）、`scripts/`（build + validate）、`content/`（示例 JSON）。
- 三套物理规格一致（210×285 大16开、对开 420×285、出血 3mm）→ 内容 JSON 可互相喂给任一模版重跑 build，**换风格 = 换种子 + 骨架 + 脚本**。

## 1. 模版 A 的创建方法（B/C 复刻的蓝本，A 已按此完成）

1. **定物理规格**：页面尺寸 / 出血 / 折线 / 打印方式（决定一切 CSS 常量）。
2. **定内容模型**：列出印刷品的全部信息模块（封面有什么、章节有什么、数据图表有哪些）。
3. **先出关键页面成品原型**：用手写 HTML 做出 3–5 个最关键页面的**最终视觉**（含真实文案与数据），逐页校准到「可送印」水准。此阶段不抽骨架、不写脚本。
4. **再抽骨架库**：从成品原型反向归纳出 `data-layout` 骨架（每骨架 = 固定 SLOT + Pre-flight 类名清单），写入 `references/layouts.md`。
5. **写构建脚本**：`build-*.mjs` = 内容 JSON + template.html → 成品 HTML（主题 token 注入、字体同步、自动拼版/分页）。
6. **写校验脚本 + checklist**：`validate-*.mjs` 静态校验（锚点/编号/打印样式/图表纪律），checklist.md 分级 P0–P3。
7. **端到端验证**：示例 JSON 各跑一次 build + validate，0 错误才算交付。

**纪律**：绝不在生成的 HTML 上手改；换内容 = 换 JSON；改样式 = 改 template.html 或脚本后重新生成。

## 2. 模版 B · 杂志编辑风（B-editorial）— 落地状态

### B-0 物理规格（与 A 同族，不做第二个物理世界）
- 成品：210×285 大16开成册，打印对开 420×285；每 `.spread` = 一对开卡，屏幕纵向滚动、打印逐对开输出；出血 3mm、安全区同 A。
- **风格差异集中在视觉层**：大标题页码角标、眉脚/脚注系统、引文块（pull-quote）、分栏网格、masthead 页眉词条、图文混排自由度更高。

### B-1 内容模型
- 与 A 完全同族：`meta.std` + `cover` + `chapters`（正文段落/引文/数据轨道/图注），职业发展类含 `jobs[]`、培养方案类含 `tables[]`。
- JSON 层只用一套结构；B 的差异体现在**每模块该长什么样**，不是该不该有。

### B-2 关键页面原型（先做这 4 个成品）
1. **封面**（杂志 masthead 风：大刊名 + 期号/眉条 + 主题词条列表 + 主视觉）
2. **章首引文页**（大标题 + 引文拉通 + 眉角期号角标）
3. **数据/正文交错页**（分栏正文 + 拉出数据表 + 引文块）
4. **职业/表格结算页**（岗位卡或表格 + 页脚信息带）

### B-3 抽骨架
- `data-layout="M01"–"M09"`：封面 / 目录 / 章首 / 正文分栏 / 数据页 / 引文页 / 图表页 / 岗位页 / 结算页。
- 每骨架写 Pre-flight 类名清单；template.html `<style>` 是唯一类名来源。

### B-4 脚本
- `scripts/build-magazine.mjs`：与 build-handbook.mjs 同构（主题注入 / 字体同步 / 对开拼版 / SLOT 替换），原型骨架换 B 版。
- `scripts/validate-magazine.mjs`：骨架编号 M 前缀、对开数、打印样式、图表 `--v/--max`、无远程图链、CSS 色值仅来自注入主题。

### B-5 验收（已通过）
- `content/example-xinnengyuan.json` build + validate 0 错误；打印 PDF = N 张 420×285mm 对开。

## 3. 模版 C · 东方学报风（C-journal）— 落地状态

### C-0 物理规格与设计令牌
- 与 A/B 同族：210×285 大16开、对开 420×285、出血 3mm（`.spread` 画布 432×291）。墨区 top 13 / outer 12 / fold 12 / bottom 26mm；folio 在 bottom 10mm；**内容距页码 ≥12mm 是最小值，不是固定值**——不撑满、内容随流，禁止「内容贴底、页中留白」。
- 设计令牌（第 9 套主题「朱砂 Cinnabar」，C 专属）：宣纸 `#f7f3ea` / paper-2 `#efe8d8` / 墨 `#1e1c17` / ink-2 `#3a372e` / muted `#7d7666` / border `#d9d1bf` / **朱砂 `#9e2f26` 唯一点缀色**。
- 字体：Noto Serif SC（变量字 200–900）做标题与大数字、MiSans 正文、IBM Plex Mono 角标页码。
- 签名元素：`.seal` 印章、`.vt` 竖排（vertical-rl）、`.wenwu` 文武线、中文序数（壹贰叁…）。

### C-1 内容模型
- 同一套 JSON 结构；C 的差异全在渲染（竖排标题、宣纸底色、朱砂点缀、印章/文武线）。

### C-2 关键页面原型（已定稿）
- 原型 `prototype/journal-prototype.html` 经用户评审定稿后才落管线；曾两次转风格（粗野风 → Neo-Swiss 年报风 → 东方学报风），两次旧原型均已归档废弃。
- 定稿含：封面/封底（占位校徽）、序 8 段 + 署名「段昊阳 · 张大牛 · 康传智　|　丙午年 七月 · 2026.07」、竖排目录、上篇六页图表（大数字 / 圆环 / 大字格 / hero-num+hbar / 竖向柱 / 阶梯）、下篇 `.sal` 三档薪酬 + `.pway` 分轨路径。

### C-3 分页模型（锁死，X00–X18 共 19 页）
- 骨架编号 X 前缀；页码连续：X00 封底=00 / X01 封面=01 / X02 序=02 / X03 序图=03（无 folio）/ X04|X05 竖排目录=04-05 / X06 幕封=06 / X07 引文=07 / X08…X13=08–13 上篇六页 / X15 岗位封面=14（无 folio）/ X17a=15（壹贰叁）/ X17b=16（肆伍陆）/ X17c=17（柒捌玖）/ X17d=18（拾拾壹）/ X18 结语=19（拾贰·寄语）。
- **与 B 不同**：上篇六页固定顺序、每岗位固定 4 个详情页（壹贰叁 / 肆伍陆 / 柒捌玖 / 拾拾壹），不做贪心打包；下篇段落按内容自然落位（P15 叁叁 gap 35.8 / P16 陆 gap 97.1 / P17 玖 gap 73.8 / P18 拾拾壹 gap 140.8mm 自然收尾）。

### C-4 脚本
- `scripts/build-journal.mjs`：主题映射 `seal←--accent`、`ink←--cov-ink`、`paper←--bg`、`paper-2←--surface`、`ink-2←--fg`、`muted←--muted`、`border←--border`；默认 `engineering-terra`，`--theme cinnabar` 切朱砂；含 bodyText 句中 `<mark>` 前导 pre 增强。
- `scripts/validate-journal.mjs`：骨架编号 X 前缀、对开数、页码连续、打印样式、图表 `--v/--max`、无远程图链、CSS 色值仅来自注入主题。

### C-5 验收（已通过）
- `content/example-xinnengyuan.json`（12 段下篇）build + validate 0 错误 0 警告；`engineering-terra` 与 `--theme cinnabar` 双主题各 10 对开 / 20 页，validate 全绿。

## 4. 里程碑

| # | 里程碑 | 产出 | 验收 |
|---|--------|------|------|
| M1 | A 建成 + 共享目录 | A 全套就位、可构建 | A build + validate 通过 ✅ |
| M2 | 新 SKILL.md（风格路由） | description + 路由表 + 通用工作流 | 三套风格词各命中正确模版 ✅ |
| M3 | 模版 B | B 全套（原型→骨架→脚本→checklist） | B build + validate 0 错误 ✅（22 页 M00–M17） |
| M4 | 模版 C | C 全套（原型→骨架→脚本→checklist） | C build + validate 0 错误 ✅（X00–X18，双主题） |
| M5 | 端到端 | 三套各跑一次 | 0 错误 ✅ |

## 5. 不变量（三套都必须遵守）

1. 一份印刷品只用一套主题色（`_shared/themes.md` 9 选 1），禁自定义 hex。
2. 直角纯色、无渐变无阴影（hairline 除外）；三套风格差异只允许出现在字号 / 撞色 / 构图 / 字体气质，不允许出现在素材纪律。
3. 图表数据全部由 `--v/--max` 计算，每个数据点有类别标签 + 数值标签。
4. 打印先于屏幕：出血/安全区/字体嵌入为 P0。
5. 内容 JSON 三套互通；换风格 = 换种子 + 骨架 + 脚本重跑 build，不在生成物上手改。
6. 改样式改模版，绝不在生成物上手改。