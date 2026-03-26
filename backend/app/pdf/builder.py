"""PDF generation logic migrated from the original Flask app.py.

Accepts an article data dict, builds HTML with inline CSS, and uses
WeasyPrint to produce a PDF that faithfully reproduces the original
journal formatting.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from weasyprint import HTML

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_DIR = Path(__file__).resolve().parent
_LOGOS_PATH = _DIR / "logos.json"

# ---------------------------------------------------------------------------
# Load base-64 logos once at import time
# ---------------------------------------------------------------------------
_logos: dict[str, str] = {}


def _load_logos() -> None:
    global _logos
    if _logos:
        return
    with open(_LOGOS_PATH, encoding="utf-8") as fh:
        raw = json.load(fh)
    _logos["revista"] = f"data:image/png;base64,{raw['revista']}"
    _logos["upds"] = f"data:image/png;base64,{raw['upds']}"
    _logos["cc"] = f"data:image/png;base64,{raw['cc']}"
    _logos["orcid"] = f"data:image/png;base64,{raw['orcid']}"


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
    ".sec-title{font-family:Arial,sans-serif;font-size:11pt;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:.03em;margin-top:16px;margin-bottom:7px}"
    ".sec-num{color:#223b87;margin-right:2px}"
    ".sub-title{font-family:Arial,sans-serif;font-size:10.5pt;font-weight:700;color:#223b87;margin-top:12px;margin-bottom:5px}"
    ".body-p{font-size:10pt;text-align:justify;line-height:1.6;margin-bottom:8px;color:#111}"
    ".fig-wrap{margin:16px 0;text-align:center;page-break-inside:avoid}"
    ".fig-title{font-family:Arial,sans-serif;font-size:9pt;color:#111;margin-top:6px;text-align:left}"
    ".fig-cap{font-family:Arial,sans-serif;font-size:8pt;color:#555;font-style:italic;margin-top:3px;text-align:left}"
    ".fn-area{position:absolute;bottom:48px;left:206px;right:52px;border-top:1px solid #bbb;padding-top:5px}"
    ".fn-item{font-size:7.5pt;font-family:Arial,sans-serif;color:#444;line-height:1.4;margin-bottom:3px;text-align:justify}"
    "sup{font-size:6pt;vertical-align:super}"
    ".refs-wrap{margin-left:154px;margin-top:20px;padding-top:11px;border-top:1.5px solid #223b87}"
    ".refs-title{font-family:Arial,sans-serif;font-size:11pt;font-weight:700;text-transform:uppercase;color:#111;margin-bottom:8px}"
    ".ref-item{font-size:8.5pt;margin-bottom:5px;text-align:justify;line-height:1.45;padding-left:1.5em;text-indent:-1.5em;color:#222}"
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
    if f.get("src"):
        html += (
            f'<img src="{f["src"]}" style="max-width:100%;max-height:260px;'
            f'object-fit:contain;display:block;margin:0 auto;border:1px solid #e5e7eb">'
        )
    html += (
        f'<div class="fig-title"><strong>'
        f'{_xe(f.get("tipo", "Figura"))} {_xe(str(f.get("num", "")))} : '
        f'{_xe(f.get("title", ""))}</strong></div>'
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
    if not text:
        return ""

    sec_fn_idx = [0]
    html = ""

    for para in text.split("\n"):
        para = para.strip()
        if not para:
            continue

        # Check for figure / table / chart markers
        m = re.match(
            r"^\[(FIGURA|CUADRO|GRÁFICO|GRAFICO)\s+(\d+)\]$", para, re.I
        )
        if m:
            tipo = m.group(1).capitalize()
            num = m.group(2)
            key = f"[{m.group(1).upper()} {num}]"
            fig = fn_global["figmap"].get(key)
            if fig:
                html += _fig_html(fig)
            else:
                html += (
                    f'<p class="body-p" style="color:#dc2626">'
                    f'[{tipo} {num} — no definido]</p>'
                )
            continue

        # Replace [fn] markers with superscript footnote numbers
        def replace_fn(match: re.Match[str]) -> str:
            fn_global["counter"] += 1
            txt = sec_fns[sec_fn_idx[0]] if sec_fn_idx[0] < len(sec_fns) else ""
            sec_fn_idx[0] += 1
            all_fns.append(txt)
            return f"\x00SUP{fn_global['counter']}\x00"

        line = re.sub(r"\[fn\]", replace_fn, para, flags=re.I)
        line = _xe(line)
        line = re.sub(r"\x00SUP(\d+)\x00", r"<sup>\1</sup>", line)
        html += f'<p class="body-p">{line}</p>'

    return html


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def build_pdf(d: dict[str, Any]) -> bytes:
    """Build a PDF from the article data dict and return raw bytes."""
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
    fr = f'<a href="{doi}">{_xe(doi)}</a>' if doi else ""

    # Authors block
    auth = ""
    for a in authors:
        orcid_id = a.get("orcid", "")
        orc = (
            f'<a href="https://orcid.org/{_xe(orcid_id)}" style="text-decoration:none">'
            f'<img class="orcid-img" src="{_logos["orcid"]}"></a>'
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
            f'<div class="author-wrap"><div class="author-name-row">{orc}'
            f'<span class="author-name">{_xe(a.get("name", ""))}</span>'
            f"</div>{inst}{em}</div>"
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
        body += _process_block(
            sec.get("content", ""), sec.get("fns", []), fn_global, all_fns
        )
        for sub in sec.get("subs", []):
            body += f'<div class="sub-title">{_xe(sub.get("title", ""))}</div>'
            body += _process_block(sub.get("content", ""), [], fn_global, all_fns)

    # References
    if d.get("refs"):
        body += '<div class="refs-wrap"><div class="refs-title">Referencias</div>'
        for r in d["refs"]:
            body += f'<p class="ref-item">{_xe(r)}</p>'
        body += "</div>"

    # Footnotes
    fn_html = ""
    if all_fns:
        fn_html = '<div class="fn-area">'
        for i, fn in enumerate(all_fns):
            fn_html += f'<p class="fn-item"><sup>{i + 1}</sup> {_xe(fn)}</p>'
        fn_html += "</div>"

    # ── Page 2+ (body) ──
    pg2 = _pad2(int(d.get("pageStart", 1)) + 1)
    p2 = ""
    if d.get("sections"):
        p2 = (
            f'<div class="page-inner">'
            + _build_hdr()
            + f'<div class="body-wrap">{body}</div>'
            + fn_html
            + f'<div class="pg-num">{pg2}</div>'
            + f'<div class="footer"><span>{fl}</span><span>{fr}</span></div></div>'
        )

    html_doc = (
        f"<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\">"
        f"<style>{CSS}</style></head><body>{p1}{p2}</body></html>"
    )
    return HTML(string=html_doc).write_pdf()
