import useArticleStore from "../../stores/articleStore";

const DOC_TYPES = [
  "Artículo",
  "Revisión Bibliográfica",
  "Artículo de reflexión",
];

export default function TitlePanel() {
  const store = useArticleStore();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        {/* Doc Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de documento
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DOC_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => store.setField("docType", t)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition text-center ${
                  store.docType === t
                    ? "border-[#223b87] bg-[#223b87]/5 text-[#223b87]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Title ES */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título en español <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={store.titleEs}
            onChange={(e) => store.setField("titleEs", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
            placeholder="Ingrese el título del artículo en español"
            autoFocus
          />
        </div>

        {/* Title EN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título en inglés <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={store.titleEn}
            onChange={(e) => store.setField("titleEn", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
            placeholder="Enter the article title in English"
          />
          <p className="text-xs text-gray-400 mt-1">
            Obligatorio para indexación en SciELO, Redalyc y Latindex
          </p>
        </div>
      </div>
    </div>
  );
}
