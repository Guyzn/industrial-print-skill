# _shared/fonts/ — 字体版权声明

本目录收录的全部字体均为**可商用**字型，供三套模版在构建时本地化同步到生成物旁（保证打印 PDF 内嵌，不依赖任何远程字体服务）。

| 字体文件 | 字型 | 出品方 | 许可 | 商用说明 |
|---|---|---|---|---|
| `MiSans-Regular.ttf` / `MiSans-Semibold.ttf` | MiSans | 小米（Xiaomi） | SIL Open Font License 1.1 | 免费可商用 |
| `AlibabaPuHuiTi-3-45~95.woff2`（45 Light / 55 Regular / 65 Medium / 75 SemiBold / 85 Bold / 95 ExtraBold） | 阿里巴巴普惠体 3.0（Alibaba PuHuiTi 3） | 阿里巴巴（Alibaba Design） | 官方免费商用授权 | 免费可商用；按官网下载页声明使用 |
| `IBMPlexMono-Regular.woff2` | IBM Plex Mono | IBM | SIL Open Font License 1.1 | 免费可商用 |
| `NotoSerifSC-Var.ttf` | Noto Serif SC（变量字，字重 200–900） | Google（Noto 项目） | SIL Open Font License 1.1 | 免费可商用 |

## 使用注意

- **随仓库发布时请保留本文件**，并在分发时附上各字型的授权说明原文（可从上方出品方官网下载页获取）——本文件是摘要性声明，不替代官方授权文本。
- MiSans、Alibaba PuHuiTi 3、IBM Plex Mono、Noto Serif SC 均来自各自出品方官方渠道公开下载，本仓库仅做本地化收录，无任何转售行为。
- 各模版构建脚本会自动把本目录整体复制到输出 HTML 旁（`fonts/` 子目录），生成物可独立携带字体打印，不依赖网络。
- 若用于商业印刷发行，请以各出品方最新授权条款为准；本仓库不构成对任何第三方字型的担保。

## 更新记录

- 2026-08：目录建立（MiSans ×2、Alibaba PuHuiTi 3 六字重、IBM Plex Mono、Noto Serif SC 变量字）。
