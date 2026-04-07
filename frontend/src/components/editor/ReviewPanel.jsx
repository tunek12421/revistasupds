import { CheckCircle, AlertCircle, FileDown } from "lucide-react";
import useArticleStore from "../../stores/articleStore";

function SummaryItem({ label, value, ok }) {
  return (
    <div className="flex items-start gap-2 py-2">
      {ok ? (
        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
          {label}
        </span>
        <p className={`text-sm break-words ${ok ? "text-gray-800" : "text-amber-600"}`}>
          {value || "Sin completar"}
        </p>
      </div>
    </div>
  );
}

function countKw(str) {
  if (!str || !str.trim()) return 0;
  return str.split(",").map((k) => k.trim()).filter(Boolean).length;
}

export default function ReviewPanel() {
  const store = useArticleStore();
  const kwEsN = countKw(store.kwEs);
  const kwEnN = countKw(store.kwEn);
  const figCount = store.sections.reduce(
    (n, sec) => n + (sec.blocks || []).filter((b) => b.type === "figure").length,
    0
  );
  const refsCount = store.refs.filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">Revisión final</h2>
        <p className="text-sm text-gray-500 mt-1">
          Verifica el contenido y haz clic en "Generar PDF" para descargar el artículo formateado.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-semibold text-[#223b87] uppercase tracking-wide mb-3">
          Información del artículo
        </h3>
        <div className="divide-y divide-gray-100">
          <SummaryItem label="Tipo" value={store.docType} ok={!!store.docType} />
          <SummaryItem label="Título (ES)" value={store.titleEs} ok={!!store.titleEs.trim()} />
          <SummaryItem label="Título (EN)" value={store.titleEn} ok={!!store.titleEn.trim()} />
          <SummaryItem
            label="Autores"
            value={
              store.authors.length > 0
                ? store.authors.map((a) => a.name).filter(Boolean).join(", ") || "Nombres vacíos"
                : null
            }
            ok={store.authors.length > 0 && store.authors.every((a) => a.name.trim())}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-semibold text-[#223b87] uppercase tracking-wide mb-3">
          Contenido
        </h3>
        <div className="divide-y divide-gray-100">
          <SummaryItem label="Resumen (ES)" value={store.absEs ? `${store.absEs.slice(0, 80)}...` : null} ok={!!store.absEs.trim()} />
          <SummaryItem label="Abstract (EN)" value={store.absEn ? `${store.absEn.slice(0, 80)}...` : null} ok={!!store.absEn.trim()} />
          <SummaryItem
            label="Palabras clave (ES)"
            value={store.kwEs ? `${kwEsN} palabras clave` : null}
            ok={kwEsN >= 3 && kwEsN <= 6}
          />
          <SummaryItem
            label="Keywords (EN)"
            value={store.kwEn ? `${kwEnN} keywords` : null}
            ok={kwEnN >= 3 && kwEnN <= 6}
          />
          <SummaryItem
            label="Secciones"
            value={store.sections.length > 0 ? `${store.sections.length} secciones` : null}
            ok={store.sections.length > 0}
          />
          <SummaryItem
            label="Figuras/Cuadros/Gráficos"
            value={figCount > 0 ? `${figCount} elementos` : "Ninguno (opcional)"}
            ok
          />
          <SummaryItem
            label="Referencias"
            value={refsCount > 0 ? `${refsCount} referencias` : "Ninguna (opcional)"}
            ok
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-semibold text-[#223b87] uppercase tracking-wide mb-3">
          Datos editoriales
        </h3>
        <div className="divide-y divide-gray-100">
          <SummaryItem label="DOI" value={store.doi || null} ok={!!store.doi} />
          <SummaryItem label="Cita" value={store.citeRef || null} ok={!!store.citeRef} />
          <SummaryItem label="Fecha publicado" value={store.datePublished || null} ok={!!store.datePublished} />
          <SummaryItem label="Licencia" value={store.lic} ok={!!store.lic} />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Edita estos campos en el primer paso (Información general).
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <FileDown size={28} className="mx-auto text-[#223b87] mb-2" />
        <p className="text-sm text-gray-700">
          Si todo está correcto, haz clic en <strong className="text-[#223b87]">"Generar PDF"</strong> abajo para descargar el artículo formateado.
        </p>
      </div>
    </div>
  );
}
