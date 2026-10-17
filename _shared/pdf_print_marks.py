#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_shared/pdf_print_marks.py — 给「打印 → 另存为 PDF」产物补印刷规格

浏览器（Edge/Chrome --print-to-pdf）只写 MediaBox，不写 TrimBox/BleedBox，
也没有裁切标记——印厂要么来问，要么把出血当成品裁。本脚本在后处理阶段补齐：

  1. BleedBox = MediaBox（出血幅面）
  2. TrimBox  = MediaBox 内缩 --trim（默认 3mm）= 成品区
  3. CropBox  = TrimBox（查看器默认显示成品）
  4. 每页内容流前置裁切标记：
     - 四角 L 形裁切线（从 TrimBox 角向外伸到 MediaBox 边缘，留 --gap 间隙防连墨）
     - 上下缘折线标记（对开中线 x = W/2）
  5. ArtBox 同 TrimBox

用法：
  python _shared/pdf_print_marks.py in.pdf                     # 另存为 in.print.pdf
  python _shared/pdf_print_marks.py in.pdf -o out.pdf
  python _shared/pdf_print_marks.py in.pdf --trim 5mm --gap 2mm
  python _shared/pdf_print_marks.py in.pdf --marks none         # 只补 box，不画标记

依赖：pypdf（pip install pypdf）。无 pypdf 时退出码 3。
"""
import argparse
import re
import sys

MM = 72.0 / 25.4  # mm → pt


def parse_len(v, default_mm):
    if v is None:
        return default_mm * MM
    m = re.match(r"^\s*([\d.]+)\s*(mm|pt)?\s*$", str(v))
    if not m:
        raise SystemExit(f"无法解析长度: {v!r}（示例：3mm / 12pt）")
    val = float(m.group(1))
    return val * MM if (m.group(2) or "mm") == "mm" else val


def build_marks(W, H, t, gap, fold=True):
    """返回画裁切标记的 PDF 内容流操作符（用户空间 pt，原点左下）。"""
    ops = ["q", "0.25 w", "0 0 0 RG"]
    lines = [
        # 四角 L：从 MediaBox 边缘画到 TrimBox 角（留 gap 间隙）
        (0, t, t - gap, t),            # 左上 水平
        (t, 0, t, t - gap),            # 左上 垂直
        (W - t + gap, t, W, t),        # 右上 水平
        (W - t, 0, W - t, t - gap),    # 右上 垂直
        (0, H - t, t - gap, H - t),    # 左下 水平
        (t, H - t + gap, t, H),        # 左下 垂直
        (W - t + gap, H - t, W, H - t),  # 右下 水平
        (W - t, H - t + gap, W - t, H),  # 右下 垂直
    ]
    if fold and W > H:  # 对开（横版）才有折线
        x = W / 2.0
        lines += [(x, 0, x, gap), (x, H - gap, x, H)]
    for x1, y1, x2, y2 in lines:
        if x2 <= x1 or y2 <= y1:
            # gap >= trim 时该角无空间可画，跳过而不是画反向线
            continue
        ops.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")
    ops.append("Q")
    return "\n".join(ops) + "\n"


def main():
    ap = argparse.ArgumentParser(description="给 PDF 补 TrimBox/BleedBox 与裁切标记")
    ap.add_argument("pdf", help="输入 PDF（浏览器 print-to-pdf 产物）")
    ap.add_argument("-o", "--out", help="输出 PDF（默认 <name>.print.pdf）")
    ap.add_argument("--trim", default="3mm", help="TrimBox 内缩量/出血宽（默认 3mm）")
    ap.add_argument("--gap", default="1mm", help="裁切标记与成品角的间隙（默认 1mm）")
    ap.add_argument("--marks", choices=["full", "none"], default="full",
                    help="full=补 box+画标记；none=只补 box")
    ap.add_argument("--no-fold", action="store_true", help="不画折线标记")
    args = ap.parse_args()

    try:
        from pypdf import PdfReader, PdfWriter
        from pypdf.generic import ArrayObject, FloatObject, NameObject, DecodedStreamObject
    except ImportError:
        print("缺少 pypdf：pip install pypdf", file=sys.stderr)
        sys.exit(3)

    trim = parse_len(args.trim, 3)
    gap = parse_len(args.gap, 1)
    if gap >= trim:
        print(f"警告: gap({args.gap}) >= trim({args.trim})，四角标记可能被跳过", file=sys.stderr)

    reader = PdfReader(args.pdf)
    writer = PdfWriter()
    out_path = args.out or re.sub(r"\.pdf$", "", args.pdf, flags=re.I) + ".print.pdf"

    n_pages = 0
    for page in reader.pages:
        mb = [float(v) for v in page.mediabox]
        W, H = mb[2] - mb[0], mb[3] - mb[1]
        t = trim
        boxes = {
            "/MediaBox": [mb[0], mb[1], mb[2], mb[3]],
            "/BleedBox": [mb[0], mb[1], mb[2], mb[3]],
            "/TrimBox": [mb[0] + t, mb[1] + t, mb[2] - t, mb[3] - t],
            "/CropBox": [mb[0] + t, mb[1] + t, mb[2] - t, mb[3] - t],
            "/ArtBox": [mb[0] + t, mb[1] + t, mb[2] - t, mb[3] - t],
        }
        for k, v in boxes.items():
            page[NameObject(k)] = ArrayObject(
                [FloatObject(v[0]), FloatObject(v[1]), FloatObject(v[2]), FloatObject(v[3])])

        if args.marks == "full":
            ops = build_marks(W, H, t, gap, fold=not args.no_fold)
            mark = DecodedStreamObject()
            mark.set_data(ops.encode("ascii"))
            old = page.get("/Contents")  # 原始间接引用，勿用 get_contents()（返回解码对象，clone 会炸）
            if old is None:
                page[NameObject("/Contents")] = writer._add_object(mark)
            else:
                page[NameObject("/Contents")] = ArrayObject(
                    [writer._add_object(mark), old])
        writer.add_page(page)
        n_pages += 1

    if reader.metadata:
        try:
            writer.add_metadata(dict(reader.metadata))
        except Exception:
            pass

    with open(out_path, "wb") as f:
        writer.write(f)

    # 摘要
    mb = [float(v) for v in reader.pages[0].mediabox]
    print(f"OK {out_path}")
    print(f"  页数: {n_pages}")
    print(f"  MediaBox: {mb[2] - mb[0]:.1f}×{mb[3] - mb[1]:.1f}pt "
          f"= {(mb[2] - mb[0]) / MM:.1f}×{(mb[3] - mb[1]) / MM:.1f}mm（含出血）")
    print(f"  TrimBox:  内缩 {args.trim} = 成品 {(mb[2] - mb[0] - 2 * trim) / MM:.1f}"
          f"×{(mb[3] - mb[1] - 2 * trim) / MM:.1f}mm")
    print(f"  裁切标记: {'四角 L + 折线' if args.marks == 'full' else '无（只补 box）'}")


if __name__ == "__main__":
    main()
