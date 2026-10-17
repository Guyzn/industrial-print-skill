# 送印前 P0 自检（checklist.md）· D · 工业技术风

`validate.mjs` 管机械正确性，本清单管**交付质量**。两项都过，才允许送印。

---

## P0 · 不过就不能送印

### 内容真实性
- [ ] **价格数据已经过内部仓库/采购核价**——目录、报价类文档里的每一个价格都有核价来源。没有核价的字段一律删掉，不许留示例数。
- [ ] 技术数据（成分、力学、热处理窗口）与正式技术文件一致，不是凭记忆写的。
- [ ] 公司名用全称 **Example Special Steel Co., Ltd.**；信用证项下单据**照 LC 原文抄、一字不差**（LC 写 CO., LTD 就写 CO., LTD）。
- [ ] 销售负责人默认 **李明（示例）**（除非客户指定其他业务员）。
- [ ] 没有把「示例占位」字样留给客户看到。

### 占位资产替换
- [ ] `images/logo-placeholder.svg` → **真实 logo**（白底版 / 深底版各一）。
- [ ] `images/placeholder-*.svg` → **真实照片**：全出血 ≥ 300dpi，插图 ≥ 200dpi。
- [ ] 图片方向、构图与所在对开匹配（全出血图不能是竖图横放）。

### 印刷规格
- [ ] 出血 3mm 四边都在；图片与色块真的伸出到出血线外。
- [ ] 安全区内没有正文被裁切的风险（文字距成品边 ≥ 12mm）。
- [ ] `@page { size: 426mm 303mm }` 未被改动（a4）；`--paper cn16` 时是 438×297。
- [ ] 报印口径说两遍：**成品 420×297mm 对开，含出血 426×303mm**。
- [ ] 送印 PDF 跑过 `python _shared/pdf_print_marks.py`：TrimBox/BleedBox 在，四角裁切标记与折线标记在。
- [ ] 页数偶数；对开顺序正确；封面不编页，正文从 P.01 起。

### 字体嵌入自证（换机器/换印厂一致性的生死线）
目录版：`fonts/` 与 HTML 一起交付。然后查 PDF 里实际嵌了什么：

```bash
python -c "
from pypdf import PdfReader
r = PdfReader('送印.pdf')
fonts = set()
for pg in r.pages:
    for n, ref in (pg.get('/Resources', {}).get('/Font', {}) or {}).items():
        fonts.add(str(ref.get_object().get('/BaseFont')))
print(sorted(fonts))
"
```

- [ ] 只出现 bundled 字体子集（`MiSans` / `IBMPlexMono` / `AlibabaPuHuiTi` / `NotoSerifSC`）。
- [ ] **不出现** `NSimSun` / `MicrosoftYaHei` / `SimSun` / `Arial` / `Menlo` / `PingFangSC`——出现任何一个都说明有文本在回退系统字体，印厂机器上会变形。

### 校验与打样
- [ ] `node scripts/validate.mjs <html>` → **0 错误**。
- [ ] 有警告的条目逐条人工复核过，确认可忽略。
- [ ] **自己打了一本样张**（或至少打印 PDF 到 A3 对开核对）：版面、断字、表格跨页、图注位置肉眼看过。
- [ ] 中英双语模式下，两种语言都看过一遍，没有漏译或英文溢出。

## P1 · 应该做

- [ ] 色彩：主题色已按 `_shared/themes.md` 的 CMYK 表给印厂做分色，没让浏览器转 CMYK。
- [ ] 已做软打样（soft-proof，FOGRA39 / US Web Coated）确认色差可接受。
- [ ] 表格跨对开时，中缝没有切断关键数字或表头。
- [ ] 牌号卡的 `badges` 没有超出卡片宽度换行难看。
- [ ] 页脚文字与文档编号正确，且与文件控制台账一致。
- [ ] 目录版与 `--single` 单文件版没输出到同一目录（`--replace` 会清掉同目录 `fonts/` `images/`）。

## P2 · 加分

- [ ] 文档编号、版本号、修订记录随文件控制台账管理。
- [ ] 内容 JSON 已存档（进 git 或知识库），改稿可追溯。
- [ ] 交付时附一句「本文件为印刷成品，PDF 由 HTML 直接导出，成品 420×297mm 对开、含出血 426×303mm，TrimBox/BleedBox 与裁切标记已嵌入」。

---

## 常见翻车点（都是踩过的）

| 现象 | 原因 | 处置 |
|---|---|---|
| 单独发 HTML，客户说字体全变 | `fonts/` 目录没一起发 | 连目录打包，或 `--single`，或直接发 PDF |
| 印厂说尺寸不对 | 按旧数字 420×285/432×291 报的 | 成品 **420×297**（a4）或 432×291（cn16）；报印加一句含出血 426×303 / 438×297 |
| 印厂把出血当成品裁 / 来问裁切尺寸 | 浏览器 print-to-pdf 不写 TrimBox/BleedBox | 送印前必跑 `_shared/pdf_print_marks.py` |
| PDF 里混进 NSimSun/雅黑/Arial | 某段文本在回退系统字体（@font-face 失效、字符不在子集、SVG 自带字体列表） | 按上方「字体嵌入自证」定位；查 `@font-face` 是否被写进 `:root{}`（2026-10-18 踩过：整份文档静默用宋体，validate 0 错误也发现不了） |
| 表格数字对不齐 | 列没标 `num: true` | 数值列一律加 `num: true` |
| 中文英文挤在一行 | 用了字符串而不是 `{zh, en}` 对象，或标题层级漏了换行规则 | 双语字段一律写对象 |
| 一页塞太多压字号 | 违反「一页一个主体」 | 拆对开，不许低于 8pt |
| 同目录先建目录版再建 `--single` | `--replace` 按设计清掉同目录 `fonts/` `images/` | 两个版本分目录输出 |
| 截图坐标点不中 | 屏幕像素 ≠ 屏幕坐标 | 本项目不涉及（纯 HTML 排版），但若用 MCP 截图要 ×2 |
