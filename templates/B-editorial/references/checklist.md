# Checklist · 交付前自检（模版 B · 杂志编辑风，每次生成后必跑）

> 两条线：**自动检查**（跑 `scripts/validate-magazine.mjs`）与**人工检查**（逐条过一遍，尤其印刷相关的几项）。

---

## 0. 自动检查（必跑）

```bash
node <B-editorial>/scripts/validate-magazine.mjs <手册.html>
```

通过标准：
- `data-layout` 覆盖率 100%（M00–M17），页面 left/right 严格交替
- 页码奇偶与左右页一致（偶数在左页）、`.fl-num` 非空且递增；无 folio 白名单仅 M00/M01/M03/M15
- 所有 `id="sp-*"` 都被目录锚点引用（无死锚点）
- SVG 内无 `fill="var(…)"`/`stroke="var(…)"`（必须 `style="stroke: var(--x);"`）
- 圆环图：viewBox `0 0 42 42`、首环 dashoffset=25、每环 dasharray 两值之和=100、有 `.donut-legend`
- 数据轨道：`.track-row` 数 = `--v` 数 = `.tr-val` 数，`--v ∈ (0,100]`
- 堆叠条 `--w` 之和 ≈ 100%；柱图柱数 = 标签数、峰值柱 height:100%
- 支柱色块 `.pcol` 三件齐（idx/t/d）；`.xtable` 有 `<th>`
- 岗位档案 `.sec-no` 十二段连号；`.pin-bottom` 只在 `.flex-fill` 页
- 无残留 `[必填]` 占位符、无外链图片
- **封面若仍是占位校徽（`logo-placeholder.svg`）→ 正式交付/送印前必须替换为真实校徽**（本镜像可分享，但不得带着占位符当成品交付）

---

## 1. 数据正确性（P0）

- [ ] 图表数值与源文档完全一致（占比、岗位数、城市、学历、经验、薪酬）
- [ ] 圆环图 <3% 的段按最小可视宽 2.3% 绘制，note 里注明
- [ ] 轨道以最大值为满刻度归一（最大项 `--v:100%`）
- [ ] 柱图 `pct` 为柱高归一百分比、`peak` 主峰唯一、`ci` 辅色索引与色序一致（accent→chart-3→chart-2→chart-4）
- [ ] **目录与岗位一览的页码指向 M15 岗位封面页**，与成品 `.fl-num` 一一对应（build 两遍法自动回填，手改 HTML 会破坏）
- [ ] 引文文字忠于源文档，不夸大、不编造署名

## 2. 版式与出血（P1）

- [ ] 墨区：top 13 / outer 12 / fold 12 / bottom 26mm；folio 在 bottom 10mm
- [ ] **页面内容与页码至少 12mm 留白（铁律）**——打包常量 SAFE=6 + folio 区，溢出靠几何校验（`.page` overflow:hidden 会静默裁切）
- [ ] 页级节奏类正确：`.sec-roomy`（松）/ 无类（默认）/ `.sec-tight`（紧）是**页级类**，作用 `.sec` 间距
- [ ] nextIssue 只在该页实际放得下时 pin-bottom（build 按节奏间距判定），放不下且详情页数为偶数时 console.warn 跳过——构建日志无未处理的 warn
- [ ] 详情页数为奇数时自动补 closing 页（白底 pullquote.tint）
- [ ] 幕封 M06/M07 反白文字可读，出血图 opacity ≤ 0.16
- [ ] 正文 ≥ 9pt、图注 ≥ 7.5pt、mono 角标 ≥ 7pt

## 3. 字体与印刷（P1）

- [ ] **字体本地嵌入**：标题 Noto Serif SC / 正文 MiSans / 角标 IBM Plex Mono / 封面辅助 Alibaba PuHuiTi 3，@font-face 走 `./fonts/` 相对路径（build 自动 cpSync）
- [ ] 主题色来自 `_shared/themes.md` 9 套之一；**accent = 主题 `--cov-ink`**（B 默认「工程陶橙」`#75380f`）
- [ ] 图表辅色只用 `--chart-2 #a4835e / --chart-3 #2f6b5f / --chart-4 #3d5a80`；**圆环专用色序 accent→chart-3→chart-4→chart-2**
- [ ] PDF 导出 300dpi；抽查封面大字、`pq-cn`、`.dv-num` 缺字形则换系统 CJK 栈
- [ ] 商业印刷按 themes.md CMYK 分色 + FOGRA39 软打样

## 4. 内容完整性（P2）

- [ ] 封面刊名/年份/统计条/底行齐全；封底 credits 完整
- [ ] 序（M02）+ 序图（M03）成对；目录（M04 compact）与速览（M05）成对
- [ ] PART 01 六组数据页各配一种 chart（donut/track/bignum/stack/colchart/pillars 不重复）
- [ ] 岗位十二段齐全（01 综述 → 12 学习规划），`dutySplit` 偶数、`breakBefore` 生效
- [ ] `pullQuotes` 按小节号插入（h=18 参与打包），nextIssue 预告下一岗位

## 5. 一致性（P3）

- [ ] 全部 `.page` 有 `data-layout="Mxx"`；骨架用模板类名，无自造类
- [ ] 中文标点全角、数字半角；禁止竖排
- [ ] 两份手册（不同专业）对比：版式完全一致，只差内容与主题色

---

## 送印前最后 30 秒

```
node scripts/build-magazine.mjs content/<专业>.json dist/<专业>.html   # 重建（含打包诊断 DEBUG_PACK=1）
node scripts/validate-magazine.mjs dist/<专业>.html                    # 自动
# 人工：封面 → 目录页码抽查 → 抽查 1 个数据页 → 抽查岗位尾页 nextIssue → 送印 4 项
```
