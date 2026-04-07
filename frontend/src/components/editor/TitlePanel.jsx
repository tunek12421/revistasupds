import useArticleStore from "../../stores/articleStore";
import { getTitleStatus, LIMITS } from "../../lib/validations";

const DOC_TYPES = [
  "Artículo",
  "Revisión Bibliográfica",
  "Artículo de reflexión",
];

function TitleCounter({ status }) {
  const colors = {
    empty: "text-gray-400",
    ok: "text-green-600",
    warn: "text-amber-600",
    error: "text-red-600",
  };
  return (
    <div className={`text-xs mt-1 ${colors[status.status]}`}>
      {status.words} palabras ({LIMITS.title.minWords}-{LIMITS.title.maxWords}) ·{" "}
      {status.chars}/{LIMITS.title.maxChars} caracteres
    </div>
  );
}

function inputClass(status) {
  const base =
    "w-full rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent";
  if (status.status === "error")
    return `${base} border-red-300 focus:ring-red-500 bg-red-50/30`;
  if (status.status === "warn")
    return `${base} border-amber-300 focus:ring-amber-500`;
  if (status.status === "ok")
    return `${base} border-green-300 focus:ring-[#223b87]`;
  return `${base} border-gray-300 focus:ring-[#223b87]`;
}

export default function TitlePanel() {
  const store = useArticleStore();
  const esStatus = getTitleStatus(store.titleEs);
  const enStatus = getTitleStatus(store.titleEn);

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
            className={inputClass(esStatus)}
            placeholder="Ingrese el título del artículo en español"
            autoFocus
          />
          <TitleCounter status={esStatus} />
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
            className={inputClass(enStatus)}
            placeholder="Enter the article title in English"
          />
          <TitleCounter status={enStatus} />
          <p className="text-xs text-gray-400 mt-1">
            Obligatorio para indexación en SciELO, Redalyc y Latindex
          </p>
        </div>
      </div>
    </div>
  );
}
