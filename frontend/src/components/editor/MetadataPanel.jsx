import useArticleStore from "../../stores/articleStore";

const DOC_TYPES = [
  "Artículo",
  "Artículo de revisión",
  "Ensayo",
  "Nota técnica",
  "Reseña",
  "Editorial",
];

const LICENSES = [
  { id: "CC BY 4.0", name: "CC BY 4.0", desc: "Atribución" },
  { id: "CC BY-SA 4.0", name: "CC BY-SA 4.0", desc: "Atribución - CompartirIgual" },
  { id: "CC BY-ND 4.0", name: "CC BY-ND 4.0", desc: "Atribución - SinDerivadas" },
  { id: "CC BY-NC 4.0", name: "CC BY-NC 4.0", desc: "Atribución - NoComercial" },
  { id: "CC BY-NC-SA 4.0", name: "CC BY-NC-SA 4.0", desc: "Atribución - NoComercial - CompartirIgual" },
  { id: "CC BY-NC-ND 4.0", name: "CC BY-NC-ND 4.0", desc: "Atribución - NoComercial - SinDerivadas" },
];

export default function MetadataPanel() {
  const store = useArticleStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Metadatos</h2>
        <p className="text-sm text-gray-500">
          Información general del artículo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Doc Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de documento
          </label>
          <select
            value={store.docType}
            onChange={(e) => store.setField("docType", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Page Start */}
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Titles */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título en español <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={store.titleEs}
            onChange={(e) => store.setField("titleEs", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Título del artículo en español"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título en inglés <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={store.titleEn}
            onChange={(e) => store.setField("titleEn", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Article title in English"
          />
        </div>
      </div>

      {/* DOI and Cite Ref */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DOI
          </label>
          <input
            type="text"
            value={store.doi}
            onChange={(e) => store.setField("doi", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="10.xxxxx/xxxxx"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Apellido, N. (2024). Título..."
          />
        </div>
      </div>

      {/* Dates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Fechas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recibido
            </label>
            <input
              type="date"
              value={store.dateReceived}
              onChange={(e) =>
                store.setField("dateReceived", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aceptado
            </label>
            <input
              type="date"
              value={store.dateAccepted}
              onChange={(e) =>
                store.setField("dateAccepted", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publicado
            </label>
            <input
              type="date"
              value={store.datePublished}
              onChange={(e) =>
                store.setField("datePublished", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* License */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Licencia Creative Commons
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LICENSES.map((lic) => {
            const isSelected = store.lic === lic.id;
            return (
              <button
                key={lic.id}
                type="button"
                onClick={() => store.setField("lic", lic.id)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    isSelected ? "text-primary-500" : "text-gray-800"
                  }`}
                >
                  {lic.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{lic.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
