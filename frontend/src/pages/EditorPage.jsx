import { useEffect, useState, useRef } from "react";
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
  RefreshCw,
} from "lucide-react";
import useArticleStore from "../stores/articleStore";
import api from "../lib/api";
import { validateTitle, validateAbstract, validateOrcid, validateDoi, validateEmail, validateKeywords, validateBody, validateRefs, LIMITS as VLIMITS } from "../lib/validations";
import StepIndicator from "../components/editor/StepIndicator";
import TitlePanel from "../components/editor/TitlePanel";
import AuthorsPanel from "../components/editor/AuthorsPanel";
import AbstractPanel from "../components/editor/AbstractPanel";
import BodyPanel from "../components/editor/BodyPanel";
import ReviewPanel from "../components/editor/ReviewPanel";
import WarningModal from "../components/common/WarningModal";

const TOTAL_STEPS = 5;

function countKw(str) {
  if (!str || !str.trim()) return 0;
  return str.split(",").map((k) => k.trim()).filter(Boolean).length;
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [articleId, setArticleId] = useState(id || null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [warningModal, setWarningModal] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState(null);
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
          const currentState = collect();
          setLastSavedState(JSON.stringify(currentState));
          setHasUnsavedChanges(false);
        })
        .catch(() => {
          alert("No se pudo cargar el artículo");
          navigate("/dashboard");
        })
        .finally(() => setLoadingArticle(false));
    } else {
      reset();
      const currentState = collect();
      setLastSavedState(JSON.stringify(currentState));
      setHasUnsavedChanges(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Monitor changes in the store
  useEffect(() => {
    if (lastSavedState === null) return;
    const currentState = JSON.stringify(collect());
    setHasUnsavedChanges(currentState !== lastSavedState);
  }, [
    store.pageStart,
    store.pageEnd,
    store.docType,
    store.titleEs,
    store.titleEn,
    store.doi,
    store.citeRef,
    store.volume,
    store.number,
    store.dateReceived,
    store.dateAccepted,
    store.datePublished,
    store.lic,
    store.authors,
    store.absEs,
    store.kwEs,
    store.absEn,
    store.kwEn,
    store.sections,
    store.refs,
  ]);

  // Validate current step — returns an array of warnings (empty = ok)
  const validateStep = (s) => {
    const data = collect();
    const warnings = [];
    const push = (msg) => { if (msg) warnings.push(msg); };

    switch (s) {
      case 1: {
        push(validateTitle(data.titleEs, "Título en español"));
        push(validateTitle(data.titleEn, "Título en inglés"));
        const doiErr = validateDoi(data.doi);
        if (doiErr) push(`DOI: ${doiErr}`);
        break;
      }
      case 2: {
        if (data.authors.length === 0) {
          push("Añade al menos un autor");
        } else {
          if (data.authors.length > VLIMITS.authors.max)
            push(`Máximo ${VLIMITS.authors.max} autores (actual: ${data.authors.length})`);
          if (data.authors.some((a) => !a.name.trim()))
            push("Todos los autores deben tener nombre");
          for (let i = 0; i < data.authors.length; i++) {
            const orcidErr = validateOrcid(data.authors[i].orcid);
            if (orcidErr) push(`Autor ${i + 1}: ${orcidErr}`);
            const emailErr = validateEmail(data.authors[i].email);
            if (emailErr) push(`Autor ${i + 1}: ${emailErr}`);
          }
        }
        break;
      }
      case 3: {
        push(validateAbstract(data.absEs, "Resumen en español"));
        push(validateAbstract(data.absEn, "Abstract en inglés"));
        push(validateKeywords(data.kwEs, "Palabras clave en español"));
        push(validateKeywords(data.kwEn, "Keywords en inglés"));
        break;
      }
      case 4: {
        if (data.sections.length === 0) {
          push("Añade al menos una sección");
        } else if (data.sections.some((sec) => !sec.title.trim())) {
          push("Todas las secciones deben tener título");
        }
        break;
      }
      default:
        break;
    }
    return warnings;
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

  const goToNextStep = async () => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    contentRef.current?.scrollTo(0, 0);
  };

  const handleNext = async () => {
    const warnings = validateStep(step);
    if (warnings.length > 0) {
      setWarningModal({
        title: "Antes de continuar",
        messages: warnings,
        continueLabel: "Continuar de todas formas",
        onContinue: async () => {
          setWarningModal(null);
          await goToNextStep();
        },
        onCancel: () => setWarningModal(null),
      });
      return;
    }
    await goToNextStep();
  };

  const handleBack = () => {
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
      const currentState = collect();
      setLastSavedState(JSON.stringify(currentState));
      setHasUnsavedChanges(false);
      setSaveMessage("Guardado correctamente");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const actuallyGeneratePdf = async () => {
    // Open the new tab synchronously is not possible here because we lost
    // the user gesture; rely on download fallback if popup is blocked.
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.document.write(
        '<html><head><title>Generando PDF...</title></head><body style="font-family:Arial;text-align:center;padding-top:40vh;color:#666"><h2>Generando PDF...</h2></body></html>'
      );
    }
    setGenerating(true);
    try {
      const res = await api.post("/generate-pdf", collect(), { responseType: "blob" });
      // Read auto-calculated pageEnd from response header
      const pageEndHeader = res.headers["x-page-end"];
      if (pageEndHeader) {
        store.setField("pageEnd", parseInt(pageEndHeader));
      }
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      if (newTab) {
        newTab.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = "articulo_earl.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      if (newTab) newTab.close();
      alert("Error al generar el PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePdf = async () => {
    // Collect all warnings across all steps
    const allWarnings = [];
    for (let s = 1; s <= 4; s++) {
      const stepWarnings = validateStep(s);
      allWarnings.push(...stepWarnings);
    }
    // Body word count and refs count for the chosen docType
    const data = collect();
    const bodyErr = validateBody(useArticleStore.getState().sections, data.docType);
    if (bodyErr) allWarnings.push(bodyErr);
    const refsErr = validateRefs(data.refs, data.docType);
    if (refsErr) allWarnings.push(refsErr);

    if (allWarnings.length > 0) {
      setWarningModal({
        title: "Antes de generar el PDF",
        messages: allWarnings,
        continueLabel: "Generar de todas formas",
        onContinue: async () => {
          setWarningModal(null);
          await actuallyGeneratePdf();
        },
        onCancel: () => setWarningModal(null),
      });
      return;
    }
    await actuallyGeneratePdf();
  };

  // PDF preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const handlePreview = async () => {
    setGeneratingPreview(true);
    try {
      const res = await api.post("/generate-pdf", collect(), { responseType: "blob" });
      const pageEndHeader = res.headers["x-page-end"];
      if (pageEndHeader) store.setField("pageEnd", parseInt(pageEndHeader));
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      setPdfPreviewUrl(url);
      if (!showPreview) setShowPreview(true);
    } catch {
      alert("Error al generar la vista previa");
    } finally {
      setGeneratingPreview(false);
    }
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
              onClick={() => {
                if (hasUnsavedChanges) {
                  setWarningModal({
                    title: "Cambios sin guardar",
                    messages: ["Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?"],
                    continueLabel: "Salir sin guardar",
                    onContinue: () => {
                      setWarningModal(null);
                      navigate("/dashboard");
                    },
                    onCancel: () => setWarningModal(null),
                  });
                } else {
                  navigate("/dashboard");
                }
              }}
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
            {showPreview && (
              <button
                onClick={handlePreview}
                disabled={generatingPreview}
                className="flex items-center gap-1.5 text-sm font-medium text-[#223b87] hover:bg-[#223b87]/10 border border-[#223b87]/30 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                title="Actualizar / Recargar vista previa"
              >
                <RefreshCw size={15} className={generatingPreview ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            )}
            <button
              onClick={() => {
                if (showPreview) {
                  setShowPreview(false);
                } else {
                  handlePreview();
                }
              }}
              disabled={generatingPreview}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#223b87] border border-gray-300 hover:border-[#223b87]/30 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              title={showPreview ? "Ocultar vista previa" : "Generar vista previa PDF"}
            >
              {generatingPreview ? (
                <Loader2 size={15} className="animate-spin" />
              ) : showPreview ? (
                <PanelRightClose size={15} />
              ) : (
                <PanelRightOpen size={15} />
              )}
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

        {/* PDF preview panel */}
        {showPreview && (
          <aside className="w-1/2 border-l border-gray-200 bg-gray-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Vista previa PDF
              </span>
              <button
                onClick={handlePreview}
                disabled={generatingPreview}
                className="flex items-center gap-1 text-[10px] text-[#223b87] hover:underline font-medium disabled:opacity-50"
              >
                {generatingPreview ? (
                  <><Loader2 size={10} className="animate-spin" /> Generando...</>
                ) : (
                  pdfPreviewUrl ? "Actualizar" : "Generar"
                )}
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex items-center justify-center">
              {generatingPreview ? (
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-[#223b87] mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Generando PDF...</p>
                </div>
              ) : pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  title="pdf-preview"
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="text-center px-6">
                  <FileDown size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-3">
                    Haz clic en "Vista previa" para generar el PDF
                  </p>
                  <button
                    onClick={handlePreview}
                    className="text-sm bg-[#223b87] hover:bg-[#1a2f6b] text-white px-4 py-2 rounded-lg transition"
                  >
                    Generar vista previa
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Warning modal — replaces blocking errors */}
      <WarningModal
        open={!!warningModal}
        title={warningModal?.title}
        messages={warningModal?.messages}
        continueLabel={warningModal?.continueLabel}
        onContinue={warningModal?.onContinue}
        onCancel={warningModal?.onCancel}
      />

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
