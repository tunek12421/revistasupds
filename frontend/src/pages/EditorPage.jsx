import { useEffect, useState, useRef, useCallback } from "react";
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

const PAGE_W = 794;

function PreviewPane({ html }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [containerH, setContainerH] = useState(600);
  const initialized = useRef(false);

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

  // Write HTML into iframe without resetting scroll
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    if (!initialized.current) {
      // First load: use srcdoc approach
      iframe.srcdoc = html;
      initialized.current = true;
    } else {
      // Subsequent updates: write directly to preserve scroll
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          const scrollY = doc.documentElement?.scrollTop || doc.body?.scrollTop || 0;
          doc.open();
          doc.write(html);
          doc.close();
          // Restore scroll position
          requestAnimationFrame(() => {
            if (doc.documentElement) doc.documentElement.scrollTop = scrollY;
            if (doc.body) doc.body.scrollTop = scrollY;
          });
        }
      } catch {
        iframe.srcdoc = html;
      }
    }
  }, [html]);

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
            ref={iframeRef}
            title="live-preview"
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

  const store = useArticleStore();
  const { collect, loadArticle, reset, titleEs, docType } = store;

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

  // Live preview — calls backend for exact same HTML as the PDF
  const [previewHtml, setPreviewHtml] = useState("");
  const previewDeps = JSON.stringify(collect());
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!showPreview) return;
      try {
        const res = await api.post("/preview-html", collect(), { responseType: "text" });
        setPreviewHtml(res.data);
      } catch {
        // Silent fail on preview
      }
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDeps, showPreview]);

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
