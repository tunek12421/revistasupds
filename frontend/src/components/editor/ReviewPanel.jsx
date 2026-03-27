import { CheckCircle, AlertCircle } from "lucide-react";
import useArticleStore from "../../stores/articleStore";

const LICENSES = [
  { id: "CC BY 4.0", name: "CC BY 4.0", desc: "Atribución" },
  { id: "CC BY-SA 4.0", name: "CC BY-SA 4.0", desc: "Atribución - CompartirIgual" },
  { id: "CC BY-ND 4.0", name: "CC BY-ND 4.0", desc: "Atribución - SinDerivadas" },
  { id: "CC BY-NC 4.0", name: "CC BY-NC 4.0", desc: "Atribución - NoComercial" },
  { id: "CC BY-NC-SA 4.0", name: "CC BY-NC-SA 4.0", desc: "Atribución - NoComercial - CompartirIgual" },
  { id: "CC BY-NC-ND 4.0", name: "CC BY-NC-ND 4.0", desc: "Atribución - NoComercial - SinDerivadas" },
];

function SummaryItem({ label, value, ok }) {
  return (
    <div className="flex items-start gap-2 py-2">
      {ok ? (
        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
      )}
      <div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <p className={`text-sm ${ok ? "text-gray-800" : "text-amber-600"}`}>
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

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#223b87] uppercase tracking-wide mb-4">
          Resumen del artículo
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
            value={(() => {
              const count = store.sections.reduce((n, sec) => n + (sec.blocks || []).filter(b => b.type === "figure").length, 0);
              return count > 0 ? `${count} elementos` : "Ninguno (opcional)";
            })()}
            ok
          />
          <SummaryItem
            label="Referencias"
            value={store.refs.length > 0 ? `${store.refs.filter(Boolean).length} referencias` : "Ninguna (opcional)"}
            ok
          />
        </div>
      </div>

      {/* Editorial metadata */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-[#223b87] uppercase tracking-wide">
          Datos editoriales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DOI
            </label>
            <input
              type="text"
              value={store.doi}
              onChange={(e) => store.setField("doi", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
              placeholder="https://doi.org/10.xxxxx/xxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia de cita
            </label>
            <input
              type="text"
              value={store.citeRef}
              onChange={(e) => store.setField("citeRef", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
              placeholder="Estudios Ambientales Revista Latinoamericana, Vol(Num), pp-pp"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha recibido
            </label>
            <input
              type="date"
              value={store.dateReceived}
              onChange={(e) => store.setField("dateReceived", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha aceptado
            </label>
            <input
              type="date"
              value={store.dateAccepted}
              onChange={(e) => store.setField("dateAccepted", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha publicado
            </label>
            <input
              type="date"
              value={store.datePublished}
              onChange={(e) => store.setField("datePublished", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Página de inicio
            </label>
            <input
              type="number"
              min={1}
              value={store.pageStart}
              onChange={(e) =>
                store.setField("pageStart", parseInt(e.target.value) || 1)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Número de página dentro del volumen de la revista
            </p>
          </div>
        </div>

        {/* License */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Licencia Creative Commons
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LICENSES.map((lic) => {
              const isSelected = store.lic === lic.id;
              return (
                <button
                  key={lic.id}
                  type="button"
                  onClick={() => store.setField("lic", lic.id)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    isSelected
                      ? "border-[#223b87] bg-[#223b87]/5"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className={`text-xs font-semibold ${isSelected ? "text-[#223b87]" : "text-gray-700"}`}>
                    {lic.name}
                  </p>
                  <p className="text-xs text-gray-400">{lic.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
