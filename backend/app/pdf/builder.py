"""PDF generation logic migrated from the original Flask app.py.

Accepts an article data dict, builds HTML with inline CSS, and uses
WeasyPrint to produce a PDF that faithfully reproduces the original
journal formatting.
"""

from __future__ import annotations

import base64
import json
import re
from pathlib import Path
from typing import Any

from weasyprint import HTML

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_DIR = Path(__file__).resolve().parent
_IMG_DIR = _DIR / "img"

# ---------------------------------------------------------------------------
# Load logos once at import time (from image files)
# ---------------------------------------------------------------------------
_logos: dict[str, str] = {}


def _load_logos() -> None:
    global _logos
    if _logos:
        return
    for name in ("revista", "upds", "cc", "orcid"):
        for ext in ("png", "jpg", "jpeg"):
            path = _IMG_DIR / f"{name}.{ext}"
            if path.exists():
                mime = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png"
                b64 = base64.b64encode(path.read_bytes()).decode()
                _logos[name] = f"data:{mime};base64,{b64}"
                break


# ---------------------------------------------------------------------------
# CSS (same as original app – single minified string)
# ---------------------------------------------------------------------------
CSS = (
    "@page{size:A4;margin:0}"
    "*{box-sizing:border-box;margin:0;padding:0}"
    'body{font-family:"Times New Roman",Times,serif;background:white;color:#111;font-size:10pt;line-height:1.55}'
    ".page{width:794px;height:1123px;padding:48px 52px 68px 52px;position:relative;page-break-after:always;overflow:hidden;display:flex;flex-direction:column}"
    ".hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:2px solid #223b87;margin-bottom:16px;flex-shrink:0}"
    ".logo-rev{height:52px;width:auto}"
    ".logo-upds{height:34px;width:auto}"
    ".p1-top-block{flex-shrink:0}"
    ".art-type{font-family:Arial,sans-serif;font-style:italic;font-size:9pt;color:#223b87;margin-bottom:9px}"
    ".art-title{font-family:Arial,sans-serif;font-size:16pt;font-weight:700;color:#111;line-height:1.2;text-align:justify;margin-bottom:5px}"
    ".art-title-en{font-family:Arial,sans-serif;font-size:11pt;font-weight:700;color:#888;line-height:1.3;margin-bottom:12px}"
    ".author-wrap{text-align:right;margin-bottom:0}"
    ".author-name-row{display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-bottom:2px}"
    ".orcid-img{width:16px;height:16px}"
    ".author-name{font-family:Arial,sans-serif;font-size:14pt;font-weight:700;color:#111}"
    ".author-inst{font-family:Arial,sans-serif;font-size:11pt;font-style:italic;color:#223b87;display:block}"
    ".author-email{font-family:Arial,sans-serif;font-size:8pt;color:#555;display:block;margin-top:1px}"
    ".author-orcid{font-family:Arial,sans-serif;font-size:7pt;display:block;margin-top:2px}"
    ".p1-cols{display:flex;gap:16px;margin-top:12px;flex:1;min-height:0}"
    ".p1-left{width:138px;flex-shrink:0;font-family:Arial,sans-serif;font-size:7pt;color:#333;line-height:1.5;text-align:justify;display:flex;flex-direction:column;justify-content:space-between;padding-top:70px;padding-bottom:10px}"
    ".sb-block{margin-bottom:10px}"
    ".sb-label{font-weight:700;color:#111;font-size:7pt}"
    ".cc-img{width:100%;display:block;margin-bottom:5px}"
    ".cc-text{font-size:6.5pt;color:#444;line-height:1.45;text-align:justify}"
    ".p1-right{flex:1;min-width:0;overflow:hidden}"
    ".abs-wrap{padding-top:70px}"
    ".abs-box{border:1px solid #c8cfe8;padding:10px 13px}"
    ".abs-box+.abs-box{border-top:none}"
    ".abs-label{font-family:Arial,sans-serif;font-weight:700;font-size:9pt;color:#223b87}"
    ".abs-text{font-size:9pt;text-align:justify;line-height:1.5;color:#111}"
    ".kw-row{margin-top:7px}"
    ".kw-label{font-family:Arial,sans-serif;font-weight:700;font-size:9pt;color:#223b87}"
    ".kw-text{font-size:9pt;color:#333}"
    ".pg-num{position:absolute;bottom:54px;left:52px;width:138px;text-align:center;font-size:68pt;font-weight:900;color:#e8ecf5;font-family:Arial,sans-serif;line-height:1;letter-spacing:-4px}"
    ".footer{position:absolute;bottom:20px;left:52px;right:52px;font-family:Arial,sans-serif;font-size:7.5pt;color:#666;border-top:1px solid #ddd;padding-top:5px;display:flex;justify-content:space-between}"
    ".footer a{color:#223b87;text-decoration:none}"
    ".page-inner{width:794px;height:1123px;padding:48px 52px 68px 52px;position:relative;page-break-after:always;overflow:hidden}"
    ".body-wrap{margin-left:154px}"
    ".body-wrap > :first-child{margin-top:0!important}"
    ".sec-title{font-family:Arial,sans-serif;font-size:11pt;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:.03em;margin-top:16px;margin-bottom:7px}"
    ".sec-num{color:#223b87;margin-right:2px}"
    ".sub-title{font-family:Arial,sans-serif;font-size:10.5pt;font-weight:700;color:#223b87;margin-top:12px;margin-bottom:5px}"
    ".subsub-title{font-family:Arial,sans-serif;font-size:10pt;font-weight:600;font-style:italic;color:#3a4f8a;margin-top:10px;margin-bottom:4px}"
    ".body-p{font-size:10pt;text-align:justify;line-height:1.6;margin-bottom:8px;color:#111}"
    ".body-wrap p{font-size:10pt;text-align:justify;line-height:1.6;margin-bottom:8px;color:#111}"
    ".body-wrap strong{font-weight:700}"
    ".body-wrap em{font-style:italic}"
    ".body-wrap u{text-decoration:underline}"
    ".body-wrap s{text-decoration:line-through}"
    ".body-wrap sub{font-size:7pt;vertical-align:sub}"
    ".body-wrap sup{font-size:7pt;vertical-align:super}"
    ".body-wrap ul{list-style:disc;margin:0 0 8px 24px;padding:0;font-size:10pt;line-height:1.6;color:#111}"
    ".body-wrap ol{list-style:decimal;margin:0 0 8px 24px;padding:0;font-size:10pt;line-height:1.6;color:#111}"
    ".body-wrap li{margin-bottom:3px}"
    ".body-wrap li > p{margin-bottom:2px}"
    ".body-wrap blockquote{border-left:3px solid #c8cfe8;padding-left:12px;margin:8px 0 8px 12px;font-style:italic;color:#444}"
    ".body-wrap a{color:#223b87;text-decoration:underline}"
    ".fig-wrap{margin:16px 0;text-align:center;page-break-inside:avoid}"
    ".fig-title{font-family:Arial,sans-serif;font-size:9pt;color:#111;margin-top:6px;text-align:left}"
    ".fig-cap{font-family:Arial,sans-serif;font-size:8pt;color:#555;font-style:italic;margin-top:3px;text-align:left}"
    ".fn-area{margin-left:154px;margin-top:20px;page-break-inside:avoid;border-top:1px solid #bbb;padding-top:5px}"
    ".fn-item{font-size:7.5pt;font-family:Arial,sans-serif;color:#444;line-height:1.4;margin-bottom:3px;text-align:justify}"
    "sup{font-size:6pt;vertical-align:super}"
    ".refs-wrap{margin-left:0;margin-top:0;padding-top:11px;border-top:1.5px solid #223b87;page-break-before:always}"
    ".refs-title{font-family:Arial,sans-serif;font-size:11pt;font-weight:700;text-transform:uppercase;color:#111;margin-bottom:8px}"
    ".ref-item{font-size:8.5pt;margin-bottom:5px;text-align:left;line-height:1.45;padding-left:1.5em;text-indent:-1.5em;color:#222;overflow-wrap:break-word}"
    "@media print {"
    " .page { page: main-page; }"
    " .page-inner { page: b-page; display:block!important; height:auto!important; overflow:visible!important; padding:0!important; width:auto!important; box-decoration-break:clone; -webkit-box-decoration-break:clone; margin: 0!important; }"
    " .fixed-hdr { position: running(hdr); width: 690px; }"
    " .fixed-ftr { position: running(ftr); width: 690px; }"
    " .footer-print { border-top:1px solid #ddd; padding-top:5px; display:flex; justify-content:space-between; font-family:Arial,sans-serif; font-size:7.5pt; color:#666; }"
    " .footer-print a { color:#223b87; text-decoration:none; }"
    " .screen-only { display:none!important; }"
    " .fn-print { float:footnote; font-size:7.5pt; font-family:Arial,sans-serif; color:#444; line-height:1.4; text-align:justify; }"
    " .fn-print::footnote-call { content:counter(footnote); font-size:6pt; vertical-align:super; }"
    " .fn-print::footnote-marker { content:counter(footnote) '. '; font-size:6pt; }"
    "}"
    "@page main-page {"
    "  margin: 0;"
    "}"
    "@page b-page {"
    "  margin: 128px 52px 68px 52px;"
    "  @footnote { border-top:1px solid #bbb; padding-top:5px; margin-top:10px; margin-left:154px; }"
    "  @top-center { content: element(hdr); vertical-align: top; padding-top: 48px; }"
    "  @bottom-center { content: element(ftr); vertical-align: bottom; padding-bottom: 20px; }"
    "  @bottom-left {"
    "    content: counter(page, decimal-leading-zero);"
    "    margin-left: 0;"
    "    width: 138px;"
    "    text-align: center;"
    "    font-family: Arial,sans-serif;"
    "    font-size: 68pt;"
    "    font-weight: 900;"
    "    color: #e8ecf5;"
    "    line-height: 1;"
    "    letter-spacing: -4px;"
    "    vertical-align: bottom;"
    "    padding-bottom: 54px;"
    "  }"
    "}"
    "@media screen {"
    " .print-only { display:none!important; }"
    "}"
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _xe(s: Any) -> str:
    """HTML-escape a value."""
    if not s:
        return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _pad2(n: Any) -> str:
    return str(int(n or 0)).zfill(2)


def _fmt_date(s: str) -> str:
    if not s:
        return ""
    try:
        y, m, d = s.split("-")
        months = [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
        ]
        return f"{int(d)} {months[int(m) - 1]} {y}"
    except Exception:
        return s


def _build_hdr() -> str:
    return (
        f'<div class="hdr">'
        f'<img class="logo-rev" src="{_logos["revista"]}" alt="EARL">'
        f'<img class="logo-upds" src="{_logos["upds"]}" alt="UPDS">'
        f'</div>'
    )


def _fig_html(f: dict[str, Any] | None) -> str:
    if not f:
        return ""
    html = '<div class="fig-wrap">'
    html += (
        f'<div class="fig-title"><strong>'
        f'{_xe(f.get("tipo", "Figura"))} {_xe(str(f.get("num", "")))} : '
        f'{_xe(f.get("title", ""))}</strong></div>'
    )
    if f.get("src"):
        w = f.get("width")
        h = f.get("height")
        if w and h:
            img_style = f"width:{w}px;height:{h}px;object-fit:fill;"
        else:
            img_style = "max-width:100%;max-height:260px;object-fit:contain;"
        html += (
            f'<img src="{f["src"]}" style="{img_style}'
            f'display:block;margin:0 auto;border:1px solid #e5e7eb">'
        )
    if f.get("caption"):
        html += f'<div class="fig-cap">{_xe(f["caption"])}</div>'
    html += "</div>"
    return html


def _process_block(
    text: str,
    sec_fns: list[str],
    fn_global: dict[str, Any],
    all_fns: list[str],
) -> str:
    """Process a content block.

    The block content is now HTML produced by the Tiptap editor (with marks
    like <strong>, <em>, <ul>, <blockquote>, etc.). Legacy plain-text input
    is also supported by wrapping non-empty lines in <p> tags.
    """
    if not text:
        return ""

    # sec_fn_idx is shared via fn_global so it persists across section + subsections
    if "sec_fn_idx" not in fn_global:
        fn_global["sec_fn_idx"] = [0]
    sec_fn_idx = fn_global["sec_fn_idx"]

    # Detect HTML vs legacy plain text
    is_html = bool(re.search(r"<\w+[^>]*>", text))
    if not is_html:
        lines = [_xe(line.strip()) for line in text.split("\n") if line.strip()]
        text = "".join(f"<p>{line}</p>" for line in lines)

    # Replace figure marker paragraphs (e.g. <p>[FIGURA 1]</p>) with figure HTML
    def replace_figure_marker(match: re.Match[str]) -> str:
        tipo = match.group(1).capitalize()
        num = match.group(2)
        key = f"[{match.group(1).upper()} {num}]"
        fig = fn_global["figmap"].get(key)
        if fig:
            return _fig_html(fig)
        return (
            f'<p style="color:#dc2626">[{tipo} {num} — no definido]</p>'
        )

    text = re.sub(
        r"<p[^>]*>\s*\[(FIGURA|CUADRO|GRÁFICO|GRAFICO)\s+(\d+)\]\s*</p>",
        replace_figure_marker,
        text,
        flags=re.I,
    )

    # Replace [fn] markers (anywhere inline) with the dual screen/print spans
    def replace_fn(match: re.Match[str]) -> str:
        fn_global["counter"] += 1
        txt = sec_fns[sec_fn_idx[0]] if sec_fn_idx[0] < len(sec_fns) else ""
        sec_fn_idx[0] += 1
        all_fns.append(txt)
        c = fn_global["counter"]
        fn_txt = _xe(txt)
        return (
            f'<span class="screen-only"><sup>{c}</sup></span>'
            f'<span class="print-only fn-print">{fn_txt}</span>'
        )

    text = re.sub(r"\[fn\]", replace_fn, text, flags=re.I)

    return text


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def build_html(d: dict[str, Any]) -> str:
    """Build the HTML for the article and return it as a string."""
    _load_logos()

    pn = _pad2(d.get("pageStart", 1))
    doi = d.get("doi", "")
    cite = _xe(d.get("citeRef", ""))
    lic = d.get("lic", "CC BY 4.0")
    authors = d.get("authors", [])

    # Footer left / right
    fl = (
        f"<em>Estudios Ambientales Revista Latinoamericana</em>"
        + cite.split("Latinoamericana")[-1]
        if "Latinoamericana" in cite
        else cite
    )
    if doi:
        doi_url = doi if doi.startswith("http") else f"https://doi.org/{doi}"
        fr = f'<a href="{doi_url}">{_xe(doi)}</a>'
    else:
        fr = ""

    # Authors block
    auth = ""
    for a in authors:
        orcid_id = a.get("orcid", "")
        orc = (
            f'<span class="author-orcid">'
            f'<a href="https://orcid.org/{_xe(orcid_id)}" style="text-decoration:none;color:#a6ce39">'
            f'<img class="orcid-img" src="{_logos["orcid"]}"> '
            f'{_xe(orcid_id)}</a></span>'
            if orcid_id
            else ""
        )
        inst = (
            f'<span class="author-inst">{_xe(a.get("inst", ""))}</span>'
            if a.get("inst")
            else ""
        )
        em = (
            f'<span class="author-email">{_xe(a.get("email", ""))}</span>'
            if a.get("email")
            else ""
        )
        auth += (
            f'<div class="author-wrap"><div class="author-name-row">'
            f'<span class="author-name">{_xe(a.get("name", ""))}</span>'
            f"</div>{inst}{em}{orc}</div>"
        )

    # Sidebar
    auth0 = authors[0].get("name", "") if authors else ""
    surname = auth0.split(",")[0].strip() if "," in auth0 else auth0
    fc = _xe(
        f'{surname}. {d.get("titleEs", "")}. {d.get("citeRef", "")}. {doi}'
    )
    sbd = ""
    if d.get("dateReceived"):
        sbd += f'Recibido: {_xe(_fmt_date(d["dateReceived"]))}<br/>'
    if d.get("dateAccepted"):
        sbd += f'Aceptado: {_xe(_fmt_date(d["dateAccepted"]))}<br/>'
    if d.get("datePublished"):
        sbd += f'Publicado: {_xe(_fmt_date(d["datePublished"]))}'

    sidebar = (
        f'<div class="p1-left"><div class="sb-top">'
        f'<div class="sb-block"><span class="sb-label">Citaci&oacute;n:</span><br/>{fc}</div>'
        f'<div class="sb-block">{sbd}</div></div>'
        f'<div><img class="cc-img" src="{_logos["cc"]}">'
        f'<div class="cc-text">Esta revista adopta la licencia {_xe(lic)}, que permite el uso, '
        f"distribuci&oacute;n y reproducci&oacute;n en cualquier medio, siempre que se "
        f"otorgue el cr&eacute;dito adecuado a los autores y a la fuente original.</div>"
        f"</div></div>"
    )

    # Abstract & keywords
    ke = (
        f'<div class="kw-row"><span class="kw-label">Palabras clave:</span> '
        f'<span class="kw-text">{_xe(d.get("kwEs", ""))}</span></div>'
        if d.get("kwEs")
        else ""
    )
    kn = (
        f'<div class="kw-row"><span class="kw-label">Keywords:</span> '
        f'<span class="kw-text">{_xe(d.get("kwEn", ""))}</span></div>'
        if d.get("kwEn")
        else ""
    )
    ae = (
        f'<div class="abs-box"><p class="abs-text">'
        f'<span class="abs-label">Resumen</span>: '
        f'{_xe(d.get("absEs", ""))}</p>{ke}</div>'
    )
    an = (
        f'<div class="abs-box"><p class="abs-text">'
        f'<span class="abs-label">Abstract</span>: '
        f'{_xe(d.get("absEn", ""))}</p>{kn}</div>'
        if d.get("absEn")
        else ""
    )
    ten = (
        f'<div class="art-title-en">{_xe(d.get("titleEn", ""))}</div>'
        if d.get("titleEn")
        else ""
    )

    # ── Page 1 ──
    p1 = (
        f'<div class="page">'
        + _build_hdr()
        + f'<div class="p1-top-block">'
        + f'<div class="art-type"><em>{_xe(d.get("docType", "Artículo"))}</em></div>'
        + f'<div class="art-title">{_xe(d.get("titleEs", ""))}</div>'
        + ten
        + auth
        + f"</div>"
        + f'<div class="p1-cols">{sidebar}'
        + f'<div class="p1-right"><div class="abs-wrap">{ae}{an}</div></div></div>'
        + f'<div class="pg-num">{pn}</div>'
        + f'<div class="footer"><span>{fl}</span><span>{fr}</span></div></div>'
    )

    # ── Build figure map ──
    figs = d.get("figs", [])
    figmap: dict[str, dict[str, Any]] = {}
    for f in figs:
        key = f"[{f.get('tipo', 'FIGURA').upper()} {f.get('num', '')}]"
        figmap[key] = f

    fn_global: dict[str, Any] = {"counter": 0, "figmap": figmap}
    all_fns: list[str] = []
    body = ""

    for i, sec in enumerate(d.get("sections", [])):
        body += (
            f'<div class="sec-title"><span class="sec-num">{i + 1}.</span> '
            f"{_xe(sec.get('title', '')).upper()}</div>"
        )
        # Reset the fn index counter for each section so it starts at 0
        # within sec.fns (which contains both section + subsection footnotes
        # in the order they appear in the document)
        fn_global["sec_fn_idx"] = [0]
        sec_fns = sec.get("fns", [])
        body += _process_block(
            sec.get("content", ""), sec_fns, fn_global, all_fns
        )
        for j, sub in enumerate(sec.get("subs", [])):
            body += f'<div class="sub-title">{i + 1}.{j + 1}. {_xe(sub.get("title", ""))}</div>'
            # Use the same sec_fns list — sec_fn_idx persists, so the
            # subsection continues consuming from where the section left off
            body += _process_block(sub.get("content", ""), sec_fns, fn_global, all_fns)
            # Sub-subsections (level 3 — 1.1.1)
            for k, subsub in enumerate(sub.get("subs", [])):
                body += (
                    f'<div class="subsub-title">'
                    f'{i + 1}.{j + 1}.{k + 1}. {_xe(subsub.get("title", ""))}</div>'
                )
                body += _process_block(
                    subsub.get("content", ""), sec_fns, fn_global, all_fns
                )

    # References (on a new page)
    if d.get("refs"):
        body += '<div class="refs-wrap"><div class="refs-title">Referencias</div>'
        for r in d["refs"]:
            # Convert URLs to clickable links before escaping
            def _linkify(text: str) -> str:
                parts = re.split(r'(https?://\S+)', text)
                result = ""
                for part in parts:
                    if re.match(r'https?://\S+', part):
                        url = part.rstrip('.,;)')
                        trailing = part[len(url):]
                        result += f'<a href="{url}" style="color:#223b87">{_xe(url)}</a>{_xe(trailing)}'
                    else:
                        result += _xe(part)
                return result
            body += f'<p class="ref-item">{_linkify(r)}</p>'
        body += "</div>"

    # Footnotes (screen-only, for the preview pagination script)
    fn_html = ""
    if all_fns:
        fn_html = '<div class="fn-area screen-only">'
        for i, fn in enumerate(all_fns):
            fn_html += f'<p class="fn-item"><sup>{i + 1}</sup> {_xe(fn)}</p>'
        fn_html += "</div>"

    # ── Page 2+ (body) ──
    pg2 = _pad2(int(d.get("pageStart", 1)) + 1)
    p2 = ""
    if d.get("sections") or d.get("refs"):
        hdr_html = _build_hdr()
        p2 = (
            f'<div class="page-inner">'
            + f'<div class="print-only fixed-hdr">{hdr_html}</div>'
            + f'<div class="print-only fixed-ftr">'
            + f'<div class="footer-print"><span>{fl}</span><span>{fr}</span></div>'
            + f'</div>'
            + f'<div class="screen-only hdr-wrap">{hdr_html}</div>'
            + f'<div class="body-wrap">{body}{fn_html}</div>'
            + f'<div class="screen-only pg-num">{pg2}</div>'
            + f'<div class="screen-only footer"><span>{fl}</span><span>{fr}</span></div></div>'
        )

    reset_val = int(d.get("pageStart", 1)) - 1
    
    html_doc = (
        f"<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\">"
        f"<style>{CSS}</style>"
        f"<style>@media print {{ body {{ counter-reset: page {reset_val}; }} }}</style>"
        f"</head><body>{p1}{p2}</body></html>"
    )
    return html_doc


def build_pdf(d: dict[str, Any]) -> bytes:
    """Build a PDF from the article data dict and return raw bytes."""
    html_doc = build_html(d)
    return HTML(string=html_doc).write_pdf()
