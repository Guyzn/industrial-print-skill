---
name: industrial-print-skill
description: 生成印刷级图文混排文档（单文件 HTML 可打印分页；两种物理口径：E/F 单页版 A4 210×297 一页成册，D 对开版 420×297，均含 3mm 四缘出血）：一套内容模型（JSON）+ 多套版式锁死风格，按「文档类型 × 风格关键词」路由。五类主文档——企业介绍 Company Profile（数字带/产能/资质/联系，一页一主题，含封底与跨对开 spread 页型）、产品作品集 Portfolio（牌号一页一版：横幅+对照表+成分+物理力学双表+热处理+供货+底部大图）、产品目录 Catalog（D 对开拼版/牌号卡/规格表/工艺流程/认证网格）、技术数据 Technical Data（F 单页：成分表/性能表/热处理窗口/检验项，带 basis 数据身份徽标 + cond 试验条件引用 + proc 工艺参数表），以及高校手册线（职业发展/就业指导/新生手册）走 A/B/C 三套教育风格。内置数字带/图表/引文/时间线等图文混排组件；14 套主题色板（hex+CMYK 双值）、MiSans 等可商用字体；build --single 出 1~3MB 单文件，@media print + pdf_print_marks 后处理出带 TrimBox/BleedBox/裁切标记的送印 PDF。自带官网图片抓取脚本（同域+robots 合规，自动算 300ppi 可印宽度并登记来源）。支持 zh/en/bi 三语模式。换内容只换 JSON 与配色，换风格只换发起词，版式永不漂移。适用：企业介绍/产品作品集/产品目录/技术数据表/宣传册/白皮书/行业报告/高校手册等图文混排印刷品，或提到「印刷」「送印」「对开」「出血」「裁切标记」「牌号手册」「目录」「手册」等词时使用。
---

# 印刷品生成 Skill（多风格路由版）

> 一套**版式锁死**的图文混排印刷品生成系统：**一套内容模型（JSON）+ 多套视觉风格**。
> 同一份内容可在风格间互转；换内容换配色，换风格换发起词——页面物理规格、骨架、图表纪律全部不变。

## 路由（第一步，必做）

**先判文档类型，再判风格。命中后只加载该模版目录下的资源——不要同时读多套。**

### 第一步：文档类型

| 用户要做的文档 | 模版 | 目录 |
|---|---|---|
| 企业介绍 / Company Profile / 作品集 / Portfolio / 宣传册（单页成册、照片多） | **E · 单页作品集风** | `templates/E-portfolio/` |
| 牌号手册 / 一页一个牌号 / 产品选型册 | **E · 单页作品集风** | `templates/E-portfolio/` |
| 产品目录 / Catalog / 对开拼版 / 跨页大图 | **D · 工业技术风** | `templates/D-industrial/` |
| 技术数据表 / Technical Data / TDS / 数据表 / 检验规范 / 工艺卡 | **F · 单页技术数据风** | `templates/F-techdata/` |
| 职业发展 / 就业指导 / 人才培养方案 / 新生手册 | A / B / C 教育线 | `templates/A-career` `B-editorial` `C-journal` |

**D / E / F 怎么选**（三者都是工业线，差别在页面单位与文档性质，不在风格）：

| | E · 单页作品集 | D · 对开 | F · 单页技术数据 |
|---|---|---|---|
| 页面单位 | 一页 210×297，印厂自己拼 | 一对开 420×297，折线装订 | 一页 210×297，印厂自己拼 |
| 密度来源 | 页数 + 每页固定套路（牌号页 19 次重复同一骨架） | 跨页大图 + 双栏长文 | 表格密度 + basis/cond 标注体系 |
| 适合 | 企业介绍、作品集、牌号手册、内容条目多而每条不长的册子；需要一两张跨页大图时用 `spread` 页型，不必换 D | 产品目录、整本都按对开读的册子 | 技术数据表 TDS、检验规范、工艺卡 |
| 页数 | 12–40 页（越多越稳） | 8–20 对开（16–40 页） | 6–20 页 |
| 空的成因 | 内容不够 / 没配图 | 一页两栏料不够 | 一页一张表料不够 |

经验：**先问「一个牌号/一个主题值不值一整页」**。值且以图为主 → E；以表为主 → F；不值、需要两三个挤在一对开 → D。
技术数据曾经放在 D，实测对开单位对单牌号 TDS 偏大（18 页里 3–4 页留白 40–60%），v2.0.0 起拆到 F。

### 第二步：主题色（D / E / F 模版）

工业线三套为**同一视觉体系**，视觉差异由**主题色**承担：

| 主题 slug | 名称 | 适用 |
|---|---|---|
| `steel-blue` | 🔧 钢蓝（默认） | 特种钢/合金产品目录、通用工业 |
| `graphite` | ⬛ 石墨 | 技术数据表、检验规范、白皮书 |
| `oxide-red` | 🟥 氧化红 | 热作模具钢、热处理、锻件 |
| `deep-pine` | 🌲 深松绿 | 不锈钢深加工、绿色制造、长效件 |
| `shenda-amber` | 🟧 申达橙金 | 申达品牌物料（橙金+冷蓝双色，印刷须打样或走专色） |

规则：用户指定主题就用指定的；未指定按文档类型推荐（目录→钢蓝、技术数据(F)→石墨、申达物料→申达橙金）；**只许从 `_shared/themes.md` 选，不许自定义 hex**。

14 套主题全部通用（A/B/C/D/E 都能用）。E 额外需要 `--ink --steel --tint --accent-soft` 四个 token：
主题里写了就用，没写由 build 按主色自动派生（见 `templates/E-portfolio/scripts/build.mjs` 的 `withDerived`）。

## 语言模式

`meta.lang` 三选一：`zh`（仅中文）/ `en`（仅英文）/ `bi`（双语，中文主、英文次级）。可用 `--lang` 临时覆盖。

- 文本字段可写 `{ "zh": "...", "en": "..." }` 对象，两语都进 HTML，由 CSS 按 `data-lang` 显隐。
- **D 的坑**：D 把纯字符串默认当中文，`lang: en` 时会被 CSS 整段隐藏——**E 已修正**，E 里字符串按单语字面量原样输出，不挂语言 class。所以 E 的英文稿可以全用字符串，不必包对象；D 的英文稿必须写成对象（zh 可同文）。
- 外贸文档默认 `en` 或 `bi`。

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

## 页面与块（E · 单页作品集风）

E 的内容模型是**页序模型**，不是章节模型——`pages[]` 顺序即成册顺序，页码自动生成。

```jsonc
{
  "meta": {
    "doc": "portfolio", "lang": "en", "theme": "shenda-amber", "paper": "a4",
    "brand": "EXSTEEL", "brand_accent": "STEEL",     // 页眉品牌，第二段走 accent 色
    "legal": "Example Special Steel Co., Ltd.",       // 页脚左
    "url": "EXAMPLE-STEEL.COM",
    "title": "Special Steel Products Portfolio",
    "cover": { "image": "images/cover.jpg", "kicker": "…", "title": "…", "sub": "…", "slogan": "…" }
  },
  "pages": [
    { "type": "cover" },
    { "type": "contents", "groups": [ { "head": "COMPANY", "items": [ { "label": "About Us", "ref": "about" } ] } ] },
    { "type": "section", "id": "about", "title": "About Us", "sub": "…", "blocks": [ … ] },
    { "type": "grade", "id": "g-h13", "footer_mid": "1.2344 / H13",
      "banner": { "code": "1.2344 / H13", "family": "HOT WORK TOOL STEEL", "standards": "DIN … · AISI …" },
      "blocks": [ … ] }
  ]
}
```

| 页面类型 | 用途 | 关键字段 |
|---|---|---|
| `cover` | 封面 | `meta.cover`：整幅图 + 压暗 + 品牌 + 标题 + slogan + 网址 |
| `backcover` | 封底 | `statement` `note` `contact:[{k,lines[]}]` `image` `kicker`；暗底，品牌在上、标语近底、联络托底 |
| `spread` | 跨对开 | `image` `side`(`full`/`left`/`right`) `title` `sub` `lede` `cap` `blocks[]`；**占两页** |
| `contents` | 目录 | `groups[].items[].ref` 指向页面 `id`，页码自动解析；支持 `note` 与 `image` |
| `section` | 通用内容页 | `title` `sub` `lede` `blocks[]` |
| `grade` | 牌号页 | `banner{}` + `blocks[]`；横幅自动整幅出血 |
| `tablepage` | 密表页 | `tables:[{head, cols, rows, size, cls}]`，整页字号自动放大一档 |
| `gallery` | 图集 | `cols`(2/3) `items:[{src, cap, sub}]` |
| `contact` | 联系页 | `columns:[{head, rows:[{k,v}]}]` `foot` `image` |

| 块类型 | 关键字段 |
|---|---|
| `text` | `head` `paras[]` `lead:true` |
| `table` | `head` `cols[]` `rows[][]` `size`(sm/xs) `cls:"ovtbl"` `first:"col"` |
| `twin` | `items:[{head, cols, rows, first}]` —— 两表并排（物理/力学） |
| `note` | `title` `text` —— 橙左边线的提示条 |
| `kv` | `items:[{n, d}]` —— 数字带，橙顶线 |
| `dash` | `head` `items[]` —— 破折号列表 |
| `dashgroups` | `cols`(2/3) `groups:[{head, items[]}]` —— 分类列表（产品范围页） |
| `adv` | `items:[{no, t, p}]` —— 编号论点（为什么选我们） |
| `photos` | `cols`(2/3) `items:[{src, cap, sub}]` —— 图集网格，固定图高 |
| `photo` | `src` `cap` `fill:true` —— **托底图**，吃掉页面剩余高度 |
| `bleed` | `src` `cap` —— 整页出血图 |
| `chips` | `head` `items:[{code, name}]` |
| `twocol` | `items:[{head, text}]` |
| `spacer` | `grow`(权重，默认 1) `min`(默认 6mm) —— 吃掉剩余高度，位置由你定 |

**竖向怎么排（别再用「全部顶对齐」）**

页面正文是一列块，块间距 3mm，剩余高度有三种去处：

1. **托底图**（`photo fill:true`）：剩余高度全给页尾那张图，图会缩到 28mm 为止。牌号页、章节页默认这么做。
2. **spacer**：在两块之间插一个，剩余高度就落在那里。适合「标题与正文之间要空一段」的场合。
3. **整页分配**（`page.valign`）：`distribute`（剩余摊进所有块间）、`center`（整块居中）、`top`（默认）。

不写 `valign` 时构建脚本自动选：有托底图或 spacer → 顶部起排；没有吸收块且块数 ≥4 → `distribute`；块数 1–3 → `center`。
理由写在 `bodyCls` 的注释里——静态 HTML 量不到真实高度，与其猜一个绝对位置，不如按块数给确定的默认，作者随时可覆盖。

**页头是独立的**：标题、副标、导语在 `.page-head` 里固定在版心顶部，不参与竖向分配。否则标题会被 `center` 拖到页面中间。

**E 的密度纪律**：每页内容写完后，如果下方还剩超过约 40mm 空白，加一张 `photo fill:true` 托底，或补内容块。E 之所以看起来不空，不是因为字号小，是因为每页都有一张通栏图把页尾压住。这是从真实企业册子里反推出来的版面规律，不是装饰。

**边距与左缘**：左右 17mm（不是 14mm）——3mm 出血有 ±1mm 裁切公差，14mm 的边到成品上会变成 13mm，贴刀口就闷。顶层小标题的橙色竖线悬挂进左边距 5mm，正文仍对齐版心线，左边因此有一条「导标列」而不是一堵直墙。表格左右外缘不画竖线，只留横线——硬边框压在切口边上同样显挤。

**对开接缝**：单数页=右页（recto），双数页=左页（verso）。牌号横幅的渐变按 `data-side` 镜像：左页 90°（深→亮），右页 270°（亮→深），两页在订口同为 `--accent-2`，装订后没有色缝。`build` 自动写 `data-side`，`validate` 核对奇偶。注意 PDF 阅读器默认按 (1,2)(3,4) 配对，要看真对开需勾「显示封面页」。

**跨对开（`spread`）怎么落地**：出一张 426×303 的宽页会让 PDF 里同时存在两种 TrimBox，印厂得手工拆版，页码也数错一页。所以 `spread` 仍然输出**两张 216×303 的单页**：图按 426mm 宽铺开，左页从图的 0 起、右页从 210mm 起，各自 `overflow:hidden` 裁掉多余的一半。装订线上取的是同一张图的相邻像素，折起来是连续的一张。

- `side:"full"` 两张半页都是图，标题压在右半的暗化层上（画册标准跨页）；暗化层两半都铺，只压右半会在折缝上留一道竖直色阶。
- `side:"left"`（默认）/`"right"` 图占一半，另一半排 `title/lede/blocks`，走正常页头页脚。
- **必须从偶数页起**：偶数页是 verso，它的右邻才是同一张纸的正面。从奇数页起会警告——那两页装订后不是面对面的一对。
- 跨对开只在**外侧两角**画裁切标记（每半页 4 个）：内侧是折缝不是切口，在折缝上画刀线，装订后会有一条黑线露在书脊里。
- 图半边不编页，文字半边照常 `Page N / M`；`total` 按物理页数算，跨对开算两页。
- 图至少 5031px 宽才够 300ppi（426mm）。低于 200ppi 的图不要拿来跨页——对开是全书最经不起虚的地方。

**封底（`backcover`）**：与封面同一套暗底，重心反过来——品牌在上、标语靠底、联络方式压在最下面、版权细字托底。不编页。可以给 `image`，压暗层与封面共用；`statement` 支持 `{zh,en}` 双语。封面是「让人翻开」，封底是「让人记住怎么找你」，别把封底写成第二个目录。

## 图片获取（官网扒图）

企业介绍/作品集 80% 的工作量在图片，不在排版。官网通常已有成套产品照与厂房照，可以复用，但有两个硬约束：**分辨率**与**授权**。

```bash
# 1) 先试跑，只看候选与域名，不下载
node scripts/fetch-images.mjs https://example.com/products --dry-run

# 2) 下载：同域、robots 合规、自动剔除 logo/图标、低于阈值直接跳过
node scripts/fetch-images.mjs https://example.com/products \
  --out ./content/images --limit 30 --min-width 1200 --print-width 176

# 3) 读结果：manifest.json 给出每张图在 300ppi 下的最大可印宽度
#    sources.md 是给客户的图片来源清单，授权列必须人工填
```

脚本行为（写死的，不可绕过）：

1. **只抓同域**（含 `--allow` 白名单），不外扩到图库或第三方 CDN；
2. **先读 robots.txt**，命中 Disallow 直接退出；
3. **不抓 logo/icon/sprite/avatar**（除非 `--include-logo`）；
4. 低于 `--min-width`（默认 1200px）的图**跳过并在清单里计数**，不先下下来再说；
5. 每张图记 `source`、`via`、像素、`ppi_at_print_width`、`max_print_width_at_300ppi_mm`、`licence: UNVERIFIED`；
6. 不绕登录、不破防盗链、不抓带水印图库。

**判定口径**：`300ppi × 目标印刷宽度` 是硬线。176mm 宽的图至少要 2079px；一张 569px 的网页图只够印 48mm——放在整幅页面上必虚。低于 200ppi 的图不要用于整幅或跨页，只能做小图。

**授权纪律**（写进 checklist，属 P0）：官网图片≠可自由使用。摄影师、图库、客户提供的照片各有归属；官网图库图（EXIF 或水印能看出 weitu/shutterstock/getty 等）必须替换或取得授权。`sources.md` 的授权列空着就不许送印。

完整规则见 `_shared/image-sourcing.md`。

## 使用流程（开发者）

```bash
# 1. 写内容 JSON（E 参考 templates/E-portfolio/content/example-portfolio.json
#                   D 参考 templates/D-industrial/content/example-*.json）
# 2. 构建（加 --single 得单文件：字体子集化 + 图片 base64，E 约 2~3MB）
node templates/E-portfolio/scripts/build.mjs \
  templates/E-portfolio/content/example-portfolio.json \
  ./企业介绍.html --single
# 3. 校验 —— 🔴 0 错误才算过，不过不允许进下一步
node templates/E-portfolio/scripts/validate.mjs ./企业介绍.html
# 4. 浏览器打开 → 打印 → 另存为 PDF（关页眉页脚）
# 5. 补裁切规格（浏览器不写 TrimBox/BleedBox，印厂无处对刀）
python _shared/pdf_print_marks.py 企业介绍.pdf -o 企业介绍-送印.pdf
# 6. 字体嵌入自证：PDF 里只许见 MiSans/IBMPlexMono 等，见 NSimSun/YaHei/Arial 即回退
```

口径：
- **E 单页版**：成品 210×297（A4），四缘 3mm 出血 → 印刷幅面 216×303，裁切标记每页 8 个；跨对开的半页只标外侧 4 个。
- **D 对开版**：成品单页 210×297，对开 420×297，印刷幅面 426×303（订口不出血）。
`--single` 依赖 fontTools（`pip install fonttools brotli`），`pdf_print_marks.py` 依赖 pypdf。

完整工作流（澄清 → 选主题 → 写 JSON → 构建 → 校验 → checklist 自检 → 打印核对 → 补裁切规格）见
`templates/D-industrial/README.md` 与 `references/checklist.md`。
技术数据表走 F：另须先读 `templates/F-techdata/references/grade-datasheet.md`：牌号数据 L0–L6 骨架、数据身份（basis）与试验条件（cond）标注规则、旧版常见 8 处硬伤。

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
| E 的页面看起来「空一半」 | 页尾没有托底图 → 在 `blocks` 末尾加 `{ "type":"photo", "fill":true, "src":"…" }` | 补内容块，或把两页并一页、把一对开拆成两页 |
| E 报「未知页面类型: X」 | `pages[].type` 只许 cover / backcover / spread / contents / section / grade / tablepage / gallery / contact | 对照 `example-portfolio.json` |
| E 的目录页码是空的 | `items[].ref` 写的是页面 `id`，不是标题；`id` 必须存在且唯一 | 临时用 `"page": "8"` 写死 |
| E 的英文稿整段不见了 | 只有 D 会这样（字符串被当中文隐藏）；E 已修正。若在 D 上遇到 → 文本改 `{zh,en}` | 见「语言模式」 |
| 官网抓的图印出来发虚 | `manifest.json` 里 `ppi_at_print_width < 300` → 换原图/重拍，或缩小图在版面上的宽度 | 只用它做小图（≤ `max_print_width_at_300ppi_mm`） |
| 抓图脚本报 robots 禁止 | 换页面或改用已获授权的图片，**不要绕过** | 让客户提供原图 |
| 目录版与 `--single` 输出到同一目录 | `--replace` 按设计清掉同目录 `fonts/` `images/` → 两个版本分目录输出 | 目录版重新 build 一次即可 |
| 提示缺 pypdf / fontTools | `pip install pypdf` / `pip install fonttools brotli` | 无 fontTools 时 `--single` 退化为全量内嵌（约 95MB，功能不受影响）；无 pypdf 则手工给印厂报 TrimBox 坐标 |

## 核心设计原则（不可妥协）

1. **单主题单 accent** — 一份印刷品只用一套主题色，accent 小面积点缀，禁止大面积铺色。
2. **直角纯色** — 不允许渐变 / 阴影 / 圆角（hairline 分割线除外）。
3. **网格至上** — 8px 基线网格；「留白」与「故意错位」都是建立在对齐自知之上的有意选择。
4. **数据由数据计算** — 图表长度全部由 `--v/--max` 计算，每个数据点有类别 + 数值标签。
5. **一页（或一对开）一个主体** — 溢出先删内容/拆页，不压字号硬塞。
6. **印刷先于屏幕** — 出血 3mm、安全区、字体本地化嵌入为 P0；PDF 送印前必须补 TrimBox/BleedBox + 裁切标记。
7. **页面单位先定，版式后定** — E 一页 210×297（216×303 含出血），D 一对开 420×297（426×303）。同一份内容换页面单位必须重排，不能直接搬 JSON；「空」的根因多半是页面单位选错，不是配色或字号。
8. **图片按 300ppi 反推尺寸** — 一张图能印多宽 = 像素宽 ÷ 300 × 25.4mm。低于 200ppi 不许整幅使用；官网图先用 `scripts/fetch-images.mjs` 量，不要凭「看起来清楚」判断。
9. **🔴 价格禁编造** — 目录/报价类内容中的价格必须经内部核价后填入，示例 JSON 只放公开标准口径。
10. **字体嵌入要自证** — PDF 里出现系统字体（NSimSun/YaHei/Arial/Menlo/PingFangSC）即失败；`@font-face` 写在 `:root{}` 内会被浏览器整体丢弃，属静默故障。

## 共享资源（勿复制）

```
industrial-print-skill/
├── SKILL.md                 ← 你正在读（路由 + 通用纪律）
├── _shared/
│   ├── fonts/               ← 可商用字体（MiSans + 阿里普惠 + IBM Plex Mono + Noto Serif SC）
│   ├── placeholders/        ← 中性占位 logo
│   ├── themes.md            ← 14 套主题色板（hex + CMYK），含 D/E 专属 token
│   ├── image-sourcing.md    ← 图片来源规则：同域、robots、300ppi、授权登记
│   ├── inline-fonts.mjs     ← 字体内嵌器：目录产物 → 单文件（子集化 + base64）
│   └── pdf_print_marks.py   ← PDF 后处理：TrimBox/BleedBox + 裁切标记（纵向单页不画折线）
├── scripts/
│   └── fetch-images.mjs     ← 官网抓图：同域 + robots + 尺寸判定 + manifest/sources
└── templates/
    ├── E-portfolio/         ← 单页作品集风：企业介绍 / 作品集 / 牌号手册（一页一牌号）
    ├── D-industrial/        ← 工业技术风：Catalog / Company Profile（对开拼版）
    ├── F-techdata/          ← 单页技术数据风：Technical Data / TDS / 检验规范（basis/cond/proc）
    ├── A-career/            ← 教育线：极简瑞士风
    ├── B-editorial/         ← 教育线：杂志编辑风（默认）
    └── C-journal/           ← 教育线：东方学报风
```

## 适合 / 不适合

| 适合 ✔ | 不适合 ✘ |
|---|---|
| 企业介绍 / 作品集 / 牌号手册（单页成册） | 需要 Word / PPT / 在线编辑格式的文档 |
| 产品目录（对开拼版）/ 技术数据表（单页） | 需要交互、视频等电子阅读体验的内容 |
| 送印刷厂的实体手册 | 需要自定义任意版式的「自由排版」需求 |
| 中英双语外贸文档 | 无出血规格的轻量文档（传单、单页 A4 内部用） |

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
13. **不许抓站外图片、不许绕 robots、不许抓带水印图库** — `fetch-images.mjs` 已写死同域与 robots 检查；要第三方素材就买授权，不要改脚本。
14. **不许用低于 200ppi 的图做整幅或跨页** — 印出来发虚是印厂的锅，但文件是你交的。先量 `ppi_at_print_width`。

## 字体版权

内置字体均为可商用字型：MiSans、Alibaba PuHuiTi 3、IBM Plex Mono、Noto Serif SC。
来源与许可明细见 `_shared/fonts/README.md`——随仓库发布请保留该文件。

## License

MIT
