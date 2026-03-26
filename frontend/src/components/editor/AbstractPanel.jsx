import { useMemo } from "react";
import useArticleStore from "../../stores/articleStore";

function countKeywords(str) {
  if (!str || !str.trim()) return 0;
  return str
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean).length;
}

export default function AbstractPanel() {
  const store = useArticleStore();

  const kwEsCount = useMemo(() => countKeywords(store.kwEs), [store.kwEs]);
  const kwEnCount = useMemo(() => countKeywords(store.kwEn), [store.kwEn]);

  const kwEsValid = kwEsCount >= 3 && kwEsCount <= 6;
  const kwEnValid = kwEnCount >= 3 && kwEnCount <= 6;

  return (
    <div className="space-y-8">
      {/* Spanish */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-primary-500 uppercase tracking-wide">
          Español
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resumen <span className="text-red-500">*</span>
          </label>
          <textarea
            value={store.absEs}
            onChange={(e) => store.setField("absEs", e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            placeholder="Escriba el resumen del artículo en español..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Palabras clave <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={store.kwEs}
            onChange={(e) => store.setField("kwEs", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              store.kwEs && !kwEsValid
                ? "border-amber-400 bg-amber-50"
                : "border-gray-300"
            }`}
            placeholder="palabra1, palabra2, palabra3"
          />
          <p
            className={`text-xs mt-1 ${
              store.kwEs && !kwEsValid ? "text-amber-600" : "text-gray-400"
            }`}
          >
            Separadas por comas — mínimo 3, máximo 6 ({kwEsCount}/6)
          </p>
        </div>
      </div>

      {/* English */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-primary-500 uppercase tracking-wide">
          English <span className="text-red-500">*</span>
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Abstract <span className="text-red-500">*</span>
          </label>
          <textarea
            value={store.absEn}
            onChange={(e) => store.setField("absEn", e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            placeholder="Write the article abstract in English..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={store.kwEn}
            onChange={(e) => store.setField("kwEn", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              store.kwEn && !kwEnValid
                ? "border-amber-400 bg-amber-50"
                : "border-gray-300"
            }`}
            placeholder="keyword1, keyword2, keyword3"
          />
          <p
            className={`text-xs mt-1 ${
              store.kwEn && !kwEnValid ? "text-amber-600" : "text-gray-400"
            }`}
          >
            Separated by commas — min 3, max 6 ({kwEnCount}/6)
          </p>
        </div>
      </div>
    </div>
  );
}
