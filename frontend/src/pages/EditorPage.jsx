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

    const modifiedHtml = html.replace('</body>', `
      <style>
        body { background: #e5e7eb; padding: 20px 0; margin: 0; display: flex; flex-direction: column; align-items: center; gap: 20px; overflow-x: hidden; }
        .body-wrap img { max-height: 800px; max-width: 100%; object-fit: contain; }
        .page-inner {
          display: flex;
          flex-direction: column;
        }
        .body-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .fn-area {
          margin-top: auto !important;
        }
        .page, .page-inner {
          flex-shrink: 0;
          background-color: white;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
        }
      </style>
      <script>
        var isPaginating = false;

        function resizeFlowPages() {
          if (isPaginating) return;
          isPaginating = true;
          
          var currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

          var originalPage = document.querySelector('.page-inner:not(.cloned-page)');
          if (originalPage) {
              var originalBodyWrap = originalPage.querySelector('.body-wrap');
              if (originalBodyWrap) {
                  document.querySelectorAll('.cloned-page').forEach(function(p) {
                      var bw = p.querySelector('.body-wrap');
                      if (bw) {
                          while (bw.firstChild) {
                              originalBodyWrap.appendChild(bw.firstChild);
                          }
                      }
                      p.remove();
                  });

                  var fnMap = {};
                  originalPage.querySelectorAll('.fn-area').forEach(function(fna) {
                      fna.querySelectorAll('.fn-item').forEach(function(item) {
                          var sup = item.querySelector('sup');
                          if (sup) fnMap[sup.textContent.trim()] = item.cloneNode(true);
                      });
                      fna.remove();
                  });

                  var childrenArr = Array.from(originalBodyWrap.childNodes);
                  var children = childrenArr.filter(function(c) { 
                      return !(c.classList && c.classList.contains('fn-area')); 
                  });

                  var fragment = document.createDocumentFragment();
                  children.forEach(function(c) { fragment.appendChild(c); });

                  var currentPage = originalPage;
                  var currentBodyWrap = originalBodyWrap;
                  
                  var pgNumEl = currentPage.querySelector('.pg-num');
                  var pgNum = (pgNumEl && pgNumEl.textContent) ? (parseInt(pgNumEl.textContent, 10) || 2) : 2;
                  if (pgNumEl && !pgNumEl.textContent) pgNumEl.textContent = pgNum.toString().padStart(2, "0");
                  
                  for (var i = 0; i < children.length; i++) {
                      var node = children[i];
                      currentBodyWrap.appendChild(node);
                      
                      var addedNotes = [];
                      if (node.nodeType === 1 && node.querySelectorAll) {
                          node.querySelectorAll('sup').forEach(function(sup) {
                              var num = sup.textContent.trim();
                              if (fnMap[num]) addedNotes.push(num);
                          });
                      }
                      
                      if (addedNotes.length > 0) {
                          var fna = currentBodyWrap.querySelector('.fn-area');
                          if (!fna) { 
                              fna = document.createElement('div'); 
                              fna.className = 'fn-area'; 
                              currentBodyWrap.appendChild(fna); 
                          }
                          addedNotes.forEach(function(num) {
                              fna.appendChild(fnMap[num].cloneNode(true));
                          });
                      }
                      
                      var currentFna = currentBodyWrap.querySelector('.fn-area');
                      if (currentFna) currentBodyWrap.appendChild(currentFna);
                      
                      var hasOtherContent = false;
                      for (var c = 0; c < currentBodyWrap.childNodes.length; c++) {
                          var childNode = currentBodyWrap.childNodes[c];
                          if (childNode !== node && childNode !== currentFna) hasOtherContent = true;
                      }

                      if (currentPage.scrollHeight > 1124 && hasOtherContent) {
                          currentBodyWrap.removeChild(node);
                          
                          if (currentFna && addedNotes.length > 0) {
                              for(var k=0; k<addedNotes.length; k++) {
                                  if (currentFna.lastChild) currentFna.removeChild(currentFna.lastChild);
                              }
                              if (currentFna.childNodes.length === 0) currentFna.remove();
                          }
                          
                          var newPage = currentPage.cloneNode(false);
                          newPage.classList.add('cloned-page');
                          newPage.innerHTML = currentPage.innerHTML;
                          
                          var newBodyWrap = newPage.querySelector('.body-wrap');
                          if (newBodyWrap) newBodyWrap.innerHTML = '';
                          
                          var obsoleteFna = newPage.querySelector('.fn-area');
                          if (obsoleteFna) obsoleteFna.remove();
                          
                          pgNum++;
                          var newPgNum = newPage.querySelector('.pg-num');
                          if (newPgNum) newPgNum.textContent = pgNum.toString().padStart(2, '0');
                          
                          currentPage.parentNode.insertBefore(newPage, currentPage.nextSibling);
                          
                          currentPage = newPage;
                          currentBodyWrap = newBodyWrap;
                          
                          currentBodyWrap.appendChild(node);
                          
                          if (addedNotes.length > 0) {
                              var newFna = document.createElement('div');
                              newFna.className = 'fn-area';
                              currentBodyWrap.appendChild(newFna);
                              addedNotes.forEach(function(num) {
                                  newFna.appendChild(fnMap[num].cloneNode(true));
                              });
                          }
                      }
                  }
              }
          }
          
          document.querySelectorAll('.page').forEach(function(page) {
              if (page.classList.contains('page') && !page.classList.contains('page-inner')) {
                 var p1Left = page.querySelector('.p1-left');
                 if (p1Left) {
                    p1Left.style.paddingBottom = '80px';
                 }
              }
          });
          
          window.scrollTo(0, currentScrollY);
          isPaginating = false;
          
          document.querySelectorAll('img').forEach(function(img) {
              if (!img.dataset.resizeListener) {
                  img.dataset.resizeListener = 'true';
                  if (!img.complete) {
                      img.addEventListener('load', function() {
                          resizeFlowPages();
                      });
                  }
              }
          });
        }

        function initPagination() {
            resizeFlowPages();
            document.querySelectorAll('img').forEach(function(img) {
                if (!img.complete) {
                    img.addEventListener('load', resizeFlowPages);
                }
            });
        }

        if (document.readyState === 'complete') {
            initPagination();
        } else {
            window.addEventListener('load', initPagination);
        }
        
        setTimeout(resizeFlowPages, 500);
        setTimeout(resizeFlowPages, 1000);
        setTimeout(resizeFlowPages, 2500);
      </script>
    </body>`);

    if (!initialized.current) {
      // First load: use srcdoc approach
      iframe.srcdoc = modifiedHtml;
      initialized.current = true;
    } else {
      // Subsequent updates: write directly to preserve scroll
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          const scrollY = doc.documentElement?.scrollTop || doc.body?.scrollTop || 0;
          doc.open();
          doc.write(modifiedHtml);
          doc.close();
          // Restore scroll position
          requestAnimationFrame(() => {
            if (doc.documentElement) doc.documentElement.scrollTop = scrollY;
            if (doc.body) doc.body.scrollTop = scrollY;
          });
        }
      } catch {
        iframe.srcdoc = modifiedHtml;
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
  const [warningModal, setWarningModal] = useState(null);
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
    await autoSave();
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
