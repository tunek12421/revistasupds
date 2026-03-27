import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  FileDown,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  Check,
} from "lucide-react";
import useArticleStore from "../stores/articleStore";
import api from "../lib/api";
import StepIndicator from "../components/editor/StepIndicator";
import TitlePanel from "../components/editor/TitlePanel";
import AuthorsPanel from "../components/editor/AuthorsPanel";
import AbstractPanel from "../components/editor/AbstractPanel";
import BodyPanel from "../components/editor/BodyPanel";
import ReviewPanel from "../components/editor/ReviewPanel";

const TOTAL_STEPS = 5;

function countKw(str) {
  if (!str || !str.trim()) return 0;
  return str.split(",").map((k) => k.trim()).filter(Boolean).length;
}

function xe(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PAGE_W = 794;

function PreviewPane({ html }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [containerH, setContainerH] = useState(600);

  const recalc = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const s = c.clientWidth / PAGE_W;
    setScale(s);
    setContainerH(c.clientHeight);
  }, []);

  useEffect(() => {
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recalc]);

  return (
    <aside className="w-1/2 border-l border-gray-200 bg-gray-100 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          Vista previa
        </span>
        <span className="text-[10px] text-gray-400">En vivo</span>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
      >
        <div
          className="origin-top-left"
          style={{
            width: PAGE_W,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            title="live-preview"
            srcDoc={html}
            className="border-0 bg-white"
            style={{ width: PAGE_W, height: containerH / scale }}
          />
        </div>
      </div>
    </aside>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [articleId, setArticleId] = useState(id || null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [stepError, setStepError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const contentRef = useRef(null);

  const collect = useArticleStore((s) => s.collect);
  const loadArticle = useArticleStore((s) => s.loadArticle);
  const reset = useArticleStore((s) => s.reset);
  const titleEs = useArticleStore((s) => s.titleEs);
  const titleEn = useArticleStore((s) => s.titleEn);
  const docType = useArticleStore((s) => s.docType);
  const authors = useArticleStore((s) => s.authors);
  const absEs = useArticleStore((s) => s.absEs);
  const absEn = useArticleStore((s) => s.absEn);
  const kwEs = useArticleStore((s) => s.kwEs);
  const kwEn = useArticleStore((s) => s.kwEn);
  const sections = useArticleStore((s) => s.sections);
  const refs = useArticleStore((s) => s.refs);
  const doi = useArticleStore((s) => s.doi);
  const lic = useArticleStore((s) => s.lic);
  const dateReceived = useArticleStore((s) => s.dateReceived);
  const dateAccepted = useArticleStore((s) => s.dateAccepted);
  const datePublished = useArticleStore((s) => s.datePublished);

  // Load existing article
  useEffect(() => {
    if (id) {
      setLoadingArticle(true);
      api
        .get(`/articles/${id}`)
        .then((res) => {
          if (res.data.data) loadArticle(res.data.data);
          setArticleId(res.data.id);
        })
        .catch(() => {
          alert("No se pudo cargar el artículo");
          navigate("/dashboard");
        })
        .finally(() => setLoadingArticle(false));
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Validate current step
  const validateStep = (s) => {
    const data = collect();
    switch (s) {
      case 1:
        if (!data.titleEs.trim()) return "El título en español es obligatorio";
        if (!data.titleEn.trim()) return "El título en inglés es obligatorio";
        return "";
      case 2:
        if (data.authors.length === 0) return "Añade al menos un autor";
        if (data.authors.some((a) => !a.name.trim()))
          return "Todos los autores deben tener nombre";
        return "";
      case 3: {
        if (!data.absEs.trim()) return "El resumen en español es obligatorio";
        if (!data.absEn.trim()) return "El abstract en inglés es obligatorio";
        const kwEsN = countKw(data.kwEs);
        const kwEnN = countKw(data.kwEn);
        if (kwEsN < 3 || kwEsN > 6) return "Palabras clave en español: entre 3 y 6";
        if (kwEnN < 3 || kwEnN > 6) return "Keywords en inglés: entre 3 y 6";
        return "";
      }
      case 4:
        if (data.sections.length === 0) return "Añade al menos una sección";
        if (data.sections.some((sec) => !sec.title.trim()))
          return "Todas las secciones deben tener título";
        return "";
      default:
        return "";
    }
  };

  // Auto-save
  const autoSave = async () => {
    try {
      const payload = {
        title_es: titleEs || "Sin título",
        doc_type: docType,
        data: collect(),
        status: "draft",
      };
      if (articleId) {
        await api.put(`/articles/${articleId}`, payload);
      } else {
        const res = await api.post("/articles", payload);
        setArticleId(res.data.id);
        window.history.replaceState(null, "", `/editor/${res.data.id}`);
      }
      setSaveMessage("Borrador guardado");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      // Silent fail
    }
  };

  const handleNext = async () => {
    const error = validateStep(step);
    if (error) { setStepError(error); return; }
    setStepError("");
    await autoSave();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    contentRef.current?.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStepError("");
    setStep((s) => Math.max(s - 1, 1));
    contentRef.current?.scrollTo(0, 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title_es: titleEs || "Sin título",
        doc_type: docType,
        data: collect(),
        status: "draft",
      };
      if (articleId) {
        await api.put(`/articles/${articleId}`, payload);
      } else {
        const res = await api.post("/articles", payload);
        setArticleId(res.data.id);
        window.history.replaceState(null, "", `/editor/${res.data.id}`);
      }
      setSaveMessage("Guardado correctamente");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePdf = async () => {
    for (let s = 1; s <= 4; s++) {
      const err = validateStep(s);
      if (err) { setStep(s); setStepError(err); return; }
    }
    setGenerating(true);
    try {
      const res = await api.post("/generate-pdf", collect(), { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "articulo_earl.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al generar el PDF");
    } finally {
      setGenerating(false);
    }
  };

  // Live preview HTML — debounced to avoid scroll jumps
  const [previewHtml, setPreviewHtml] = useState("");
  const previewDeps = JSON.stringify([titleEs, titleEn, docType, authors, absEs, absEn, kwEs, kwEn, sections, refs, doi, lic, dateReceived, dateAccepted, datePublished]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewHtml(buildPreview());
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDeps]);

  const buildPreview = () => {
    const authorsHtml = authors
      .map(
        (a) =>
          `<p style="margin:2px 0"><strong>${xe(a.name)}</strong>${a.inst ? ` — <em style="color:#223b87">${xe(a.inst)}</em>` : ""}${a.email ? `<br/><span style="font-size:8pt;color:#555">${xe(a.email)}</span>` : ""}${a.orcid ? `<br/><span style="font-size:7.5pt;color:#a6ce39">ORCID: ${xe(a.orcid)}</span>` : ""}</p>`
      )
      .join("");

    let fnGlobal = 0;
    const allFns = [];

    const processText = (text, secFns) => {
      if (!text) return "";
      let secFnIdx = 0;
      return text.split("\n").filter((l) => l.trim()).map((para) => {
        let line = para.replace(/\[fn\]/gi, () => {
          fnGlobal++;
          const fnText = (secFns || [])[secFnIdx] || "";
          secFnIdx++;
          allFns.push(fnText);
          return `<sup style="color:#223b87">${fnGlobal}</sup>`;
        });
        return `<p style="text-align:justify;margin-bottom:6px;font-size:10pt;line-height:1.6">${xe(line).replace(/&lt;sup style=&quot;color:#223b87&quot;&gt;(\d+)&lt;\/sup&gt;/g, '<sup style="color:#223b87">$1</sup>')}</p>`;
      }).join("");
    };

    const renderFigBlock = (b) => {
      let imgStyle = "";
      if (b.imgW && b.imgH) {
        imgStyle = `width:${b.imgW}px;height:${b.imgH}px;object-fit:fill;`;
      } else {
        imgStyle = `max-width:100%;object-fit:contain;`;
      }
      return `<div style="margin:12px 0;text-align:center;page-break-inside:avoid"><div style="font-size:9pt;margin-bottom:4px"><strong>${xe(b.tipo)} ${b.num}:</strong> ${xe(b.title)}</div>${b.src ? `<img src="${b.src}" style="${imgStyle}border:1px solid #e5e7eb;display:block;margin:0 auto"/>` : ""}${b.caption ? `<div style="font-size:8pt;color:#555;font-style:italic;margin-top:4px">${xe(b.caption)}</div>` : ""}</div>`;
    };

    const sectionsHtml = sections
      .map((sec, i) => {
        const blocks = sec.blocks || [{ type: "text", content: sec.content || "" }];
        let body = `<div style="font-family:Arial,sans-serif;font-size:11pt;font-weight:700;text-transform:uppercase;margin-top:16px;margin-bottom:7px"><span style="color:#223b87">${i + 1}.</span> ${xe(sec.title).toUpperCase()}</div>`;
        for (const block of blocks) {
          if (block.type === "text") body += processText(block.content, sec.fns || []);
          else if (block.type === "figure") body += renderFigBlock(block);
        }
        (sec.subs || []).forEach((sub, subIdx) => {
          body += `<div style="font-family:Arial,sans-serif;font-size:10.5pt;font-weight:700;color:#223b87;margin-top:12px;margin-bottom:5px">${i + 1}.${subIdx + 1}. ${xe(sub.title)}</div>`;
          body += processText(sub.content, []);
        });
        return body;
      })
      .join("");

    const fnsHtml =
      allFns.length > 0
        ? `<div style="border-top:1px solid #bbb;margin-top:20px;padding-top:6px">${allFns.map((fn, i) => `<p style="font-size:7.5pt;color:#444;margin-bottom:2px"><sup>${i + 1}</sup> ${xe(fn)}</p>`).join("")}</div>`
        : "";

    const refsHtml = refs.filter(Boolean).length > 0
      ? `<div style="margin-top:20px;padding-top:10px;border-top:1.5px solid #223b87"><div style="font-family:Arial,sans-serif;font-size:11pt;font-weight:700;text-transform:uppercase;margin-bottom:8px">Referencias</div>${refs.filter(Boolean).map((r) => `<p style="font-size:8.5pt;padding-left:1.5em;text-indent:-1.5em;margin-bottom:4px;line-height:1.45">${xe(r)}</p>`).join("")}</div>`
      : "";

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><style>
body{font-family:'Times New Roman',Times,serif;margin:0;padding:24px 28px;color:#111;font-size:10pt;line-height:1.55;background:white;overflow-wrap:break-word;word-wrap:break-word;word-break:break-word}
.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:2px solid #223b87;margin-bottom:14px}
.hdr span{font-family:Arial,sans-serif;font-size:11pt;font-weight:700;color:#223b87}
</style></head><body>
<div class="hdr"><span>Estudios Ambientales<br/><span style="font-size:6pt;letter-spacing:0.12em;font-weight:400">REVISTA LATINOAMERICANA</span></span><span style="font-size:18pt;font-weight:900">UPDS</span></div>
<div style="font-family:Arial,sans-serif;font-style:italic;font-size:9pt;color:#223b87;margin-bottom:8px">${xe(docType)}</div>
<div style="font-family:Arial,sans-serif;font-size:15pt;font-weight:700;color:#111;line-height:1.2;margin-bottom:4px">${xe(titleEs) || '<span style="color:#ccc">Título del artículo...</span>'}</div>
${titleEn ? `<div style="font-family:Arial,sans-serif;font-size:10pt;font-weight:700;color:#888;line-height:1.3;margin-bottom:10px">${xe(titleEn)}</div>` : ""}
<div style="text-align:right;margin-bottom:10px">${authorsHtml || '<p style="color:#ccc;font-size:9pt">Autores...</p>'}</div>
<div style="display:flex;gap:14px;margin-top:10px">
<div style="width:120px;flex-shrink:0;font-family:Arial,sans-serif;font-size:6.5pt;color:#333;line-height:1.5">
${dateReceived ? `<div>Recibido: ${xe(dateReceived)}</div>` : ""}
${dateAccepted ? `<div>Aceptado: ${xe(dateAccepted)}</div>` : ""}
${datePublished ? `<div>Publicado: ${xe(datePublished)}</div>` : ""}
<div style="margin-top:8px;font-size:6pt;color:#444">${xe(lic)}</div>
</div>
<div style="flex:1;min-width:0">
${absEs ? `<div style="border:1px solid #c8cfe8;padding:8px 10px;margin-bottom:0"><p style="font-size:9pt;text-align:justify;line-height:1.5"><span style="font-family:Arial,sans-serif;font-weight:700;color:#223b87">Resumen</span>: ${xe(absEs)}</p>${kwEs ? `<div style="margin-top:5px"><span style="font-family:Arial,sans-serif;font-weight:700;font-size:9pt;color:#223b87">Palabras clave:</span> <span style="font-size:9pt;color:#333">${xe(kwEs)}</span></div>` : ""}</div>` : '<div style="border:1px solid #e5e7eb;padding:8px 10px;color:#ccc;font-size:9pt">Resumen...</div>'}
${absEn ? `<div style="border:1px solid #c8cfe8;border-top:none;padding:8px 10px"><p style="font-size:9pt;text-align:justify;line-height:1.5"><span style="font-family:Arial,sans-serif;font-weight:700;color:#223b87">Abstract</span>: ${xe(absEn)}</p>${kwEn ? `<div style="margin-top:5px"><span style="font-family:Arial,sans-serif;font-weight:700;font-size:9pt;color:#223b87">Keywords:</span> <span style="font-size:9pt;color:#333">${xe(kwEn)}</span></div>` : ""}</div>` : ""}
</div>
</div>
<div style="margin-top:16px">
${sectionsHtml || '<p style="color:#ccc;font-size:10pt">El contenido del artículo aparecerá aquí...</p>'}
</div>
${fnsHtml}
${refsHtml}
${doi ? `<div style="margin-top:12px;font-family:Arial,sans-serif;font-size:7.5pt;color:#666;border-top:1px solid #ddd;padding-top:5px">${xe(doi)}</div>` : ""}
</body></html>`;
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <TitlePanel />;
      case 2: return <AuthorsPanel />;
      case 3: return <AbstractPanel />;
      case 4: return <BodyPanel />;
      case 5: return <ReviewPanel />;
      default: return null;
    }
  };

  if (loadingArticle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#223b87]" size={40} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#223b87] transition"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
              {titleEs || "Nuevo Artículo"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <Check size={14} />
                {saveMessage}
              </span>
            )}
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#223b87] border border-gray-300 hover:border-[#223b87]/30 px-3 py-1.5 rounded-lg transition"
              title={showPreview ? "Ocultar vista previa" : "Mostrar vista previa"}
            >
              {showPreview ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
              <span className="hidden sm:inline">Vista previa</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm bg-[#223b87] hover:bg-[#1a2f6b] text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar
            </button>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <StepIndicator current={step} />
      </div>

      {/* Split pane: form + preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form */}
        <main
          ref={contentRef}
          className={`overflow-y-auto transition-all ${
            showPreview ? "w-1/2" : "w-full"
          }`}
        >
          <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 w-full">
            {renderStep()}
          </div>
        </main>

        {/* Live preview */}
        {showPreview && (
          <PreviewPane html={previewHtml} />
        )}
      </div>

      {/* Step error */}
      {stepError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-center">
          <p className="text-sm text-red-600">{stepError}</p>
        </div>
      )}

      {/* Bottom navigation */}
      <footer className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            Atrás
          </button>

          <span className="text-xs text-gray-400">
            Paso {step} de {TOTAL_STEPS}
          </span>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-[#223b87] hover:bg-[#1a2f6b] text-white px-6 py-2.5 rounded-lg transition font-medium"
            >
              Siguiente
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleGeneratePdf}
              disabled={generating}
              className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg transition font-medium disabled:opacity-50"
            >
              {generating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              Generar PDF
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
