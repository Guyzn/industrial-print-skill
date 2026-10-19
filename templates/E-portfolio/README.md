# E · 单页作品集风（Portfolio）

企业介绍、产品作品集、牌号手册。**一页一个主题，一页成册。**

## 物理规格

| 项 | 值 |
|---|---|
| 成品单页 | 210 × 297 mm（A4 竖版） |
| 出血 | 四缘各 3mm |
| 印刷幅面 | 216 × 303 mm |
| TrimBox | 幅面内缩 3mm = 210 × 297，由 `_shared/pdf_print_marks.py` 写入 |
| 裁切标记 | 每页 8 个（四角 L 形），CSS 画在出血区，PDF 后处理再加一层 |
| 换口径 | `--paper cn16` → 成品 216×291、幅面 222×297 |

## 为什么单独做一套

D 是**对开拼版**：一张纸两页并排，适合跨页大图和长文。把一份 30 页的企业册子塞进 12 个对开，每页只有半页料——**空是必然的**，跟配色无关。

E 是**单页成册**：一个 `.sheet` 就是一个印刷页，印厂自己拼。于是可以：

- 一页一个牌号（19 个牌号 = 19 页，骨架重复 19 次，密度自然稳定）
- 一页一组设备（3×3 图集，图片本身就把版面填满）
- 章节页写完后用一张通栏图收尾，页尾不留白

这是从真实企业册子反推的规律：**密度不靠字号小，靠每页有固定的信息套路和一张托底图。**

## 快速开始

```bash
# 构建（--single 出单文件：字体子集化 + 图片 base64，约 2~3MB）
node templates/E-portfolio/scripts/build.mjs \
  templates/E-portfolio/content/example-portfolio.json \
  ./企业介绍.html --single

# 校验（0 错误才算过）
node templates/E-portfolio/scripts/validate.mjs ./企业介绍.html

# 打印：Chrome/Edge → 打印 → 另存为 PDF，页边距「无」，关闭页眉页脚
# 或命令行：
#   chrome --headless --no-pdf-header-footer --print-to-pdf=企业介绍.pdf 企业介绍.html

# 补印刷规格
python _shared/pdf_print_marks.py 企业介绍.pdf -o 企业介绍-送印.pdf
```

构建参数：`--paper a4|cn16`、`--lang zh|en|bi`、`--theme <slug>`、`--single`。

## 页面类型

| type | 用途 | 关键字段 |
|---|---|---|
| `cover` | 封面 | `meta.cover`：整幅图 + 压暗 + 品牌 + 标题 + slogan + 网址 |
| `contents` | 目录 | `groups[].items[].ref` → 页面 `id`，页码自动；`note`、`image` 可选 |
| `section` | 通用内容页 | `title` `sub` `lede` `blocks[]` |
| `grade` | 牌号页 | `banner{code,family,standards}` + `blocks[]`，横幅自动出血 |
| `tablepage` | 密表页 | `tables:[{head, cols, rows, size, cls}]`，整页字号自动放大一档 |
| `gallery` | 图集 | `cols`(2/3) `items:[{src,cap,sub}]` |
| `contact` | 联系页 | `columns:[{head,rows:[{k,v}]}]` `foot` `image` |

## 块类型

`text` `table` `twin` `note` `kv` `dash` `dashgroups` `adv` `photos` `photo` `bleed` `chips` `twocol` `spacer`

三个要点：

- **`photo` 的 `fill:true`** 是 E 的收尾机制——吃掉页面剩余高度，最小缩到 28mm。每页内容不足时，用它把页尾压住。
- **`spacer`** 把剩余高度放在你指定的位置，`grow` 是权重。两个 spacer 各 `grow:1` 就平分。
- **`table` 的 `first:"col"`** 把首列变成行标题（浅底、左对齐、加粗），对照表必须用。

## 竖向分配

页面正文是一列块，块间距 3mm。剩余高度不写规则时由构建脚本自动处理：

| 页面状态 | 默认行为 |
|---|---|
| 有 `photo fill` 或 `spacer` | 顶部起排，剩余给吸收块 |
| 无吸收块、块数 ≥4 | `distribute`：剩余摊进块间（space-evenly） |
| 无吸收块、块数 1–3 | `center`：整块居中 |

要覆盖就写 `page.valign`：`top` / `center` / `bottom` / `distribute` / `between`。

页头（标题 + 副标 + 导语）是独立的 `.page-head`，固定在版心顶部，不参与分配——否则标题会被 `center` 拖到页面中间。

完整字段见根目录 `SKILL.md` 的「页面与块」表。

## 内容编写顺序（别反过来）

1. **先定页序**：封面 / 目录 / 章节 / 牌号页 / 图集 / 联系，一共多少页。
2. **再定每页一个主体**：一页只讲一件事。讲不完就拆页，不要压字号。
3. **最后配图**：每页配一张能撑住版面的图，或一张托底图。
4. 写 JSON，构建，看一下页尾是否超过 40mm 空白；超了加图或补块。

## 对开接缝（横幅渐变）

装订后单数页在右（recto）、双数页在左（verso）。牌号横幅的渐变按这一条镜像：

| 页 | data-side | 渐变 | 订口侧颜色 |
|---|---|---|---|
| 双数（左页） | `verso` | `90deg`：深 → 亮 | 右缘 `#2196D9` |
| 单数（右页） | `recto` | `270deg`：亮 → 深 | 左缘 `#2196D9` |

于是整个对开读作「深 → 亮｜亮 → 深」，折线上两侧同为品牌蓝，没有竖向色缝。`data-side` 由 build 按页码自动写入，validate 会核对奇偶。

**预览要点**：PDF 阅读器默认把 (1,2)、(3,4) 并排，那不是真实对开。要看真对开，在 Acrobat 里开「双页视图」并勾选「显示封面页」，得到 (2,3)、(4,5)……；此时右页才是单数页。

## 常见问题

**页面下半页空。** 缺托底图或 spacer。`blocks` 末尾加 `{ "type": "photo", "fill": true, "src": "…" }`；也可以在标题与正文之间插 `{ "type": "spacer", "grow": 1 }`，把余量放在那里而不是页尾。

**目录页码是空白。** `items[].ref` 要写页面的 `id`，不是标题。也可以临时用 `"page": "8"` 写死。

**英文稿整段消失。** 那是 D 的老毛病（字符串被当中文隐藏）。E 里字符串按单语原样输出，不会消失；如果只出现部分文字，检查是否误用了 `{zh:...}` 只给中文。

**图印出来发虚。** 量 `ppi_at_print_width`。176mm 宽需要 2079px，官网常见的 569px 只够印 48mm。

**标题压不住照片。** 封面压暗层是固定 rgba 三段渐变；照片本身如果很亮，换一张，不要靠调渐变硬压。

## 目录结构

```
templates/E-portfolio/
├── assets/
│   ├── template.html      ← 外壳（主题与 CSS 由 build 注入）
│   └── blocks.css         ← 版式系统（物理规格、组件、打印规则）
├── content/
│   ├── example-portfolio.json
│   └── images/            ← 占位图（ph-cover/hero/band/sq）
├── scripts/
│   ├── build.mjs
│   └── validate.mjs
├── references/
│   └── checklist.md       ← 送印前人审清单
└── README.md
```
