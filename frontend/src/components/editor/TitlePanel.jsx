import { Check, AlertCircle } from "lucide-react";
import useArticleStore from "../../stores/articleStore";
import {
  getTitleStatus,
  LIMITS,
  getDoiStatus,
  normalizeDoi,
} from "../../lib/validations";

const DOC_TYPES = [
  "Artículo",
  "Revisión Bibliográfica",
  "Artículo de reflexión",
];

const LICENSES = [
  { id: "CC BY 4.0", name: "CC BY 4.0", desc: "Atribución" },
  { id: "CC BY-SA 4.0", name: "CC BY-SA 4.0", desc: "Atribución - CompartirIgual" },
  { id: "CC BY-ND 4.0", name: "CC BY-ND 4.0", desc: "Atribución - SinDerivadas" },
  { id: "CC BY-NC 4.0", name: "CC BY-NC 4.0", desc: "Atribución - NoComercial" },
  { id: "CC BY-NC-SA 4.0", name: "CC BY-NC-SA 4.0", desc: "Atribución - NoComercial - CompartirIgual" },
  { id: "CC BY-NC-ND 4.0", name: "CC BY-NC-ND 4.0", desc: "Atribución - NoComercial - SinDerivadas" },
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
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ============================ */}
      {/*  INFORMACIÓN DEL ARTÍCULO    */}
      {/* ============================ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
        <h3 className="text-xs font-semibold text-[#223b87] uppercase tracking-wide">
          Información del artículo
        </h3>

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

      {/* ============================ */}
      {/*  DATOS EDITORIALES           */}
      {/* ============================ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
        <h3 className="text-xs font-semibold text-[#223b87] uppercase tracking-wide">
          Datos editoriales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DOI
            </label>
            <div className="relative">
              <input
                type="text"
                value={store.doi}
                onChange={(e) => store.setField("doi", e.target.value)}
                onBlur={(e) => store.setField("doi", normalizeDoi(e.target.value))}
                className={`w-full rounded-lg border px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                  getDoiStatus(store.doi) === "error"
                    ? "border-red-300 focus:ring-red-500 bg-red-50/30"
                    : getDoiStatus(store.doi) === "ok"
                    ? "border-green-300 focus:ring-[#223b87]"
                    : "border-gray-300 focus:ring-[#223b87]"
                }`}
                placeholder="10.1234/abc.2024.001"
              />
              {getDoiStatus(store.doi) === "ok" && (
                <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
              {getDoiStatus(store.doi) === "error" && (
                <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
              )}
            </div>
            <p className={`text-xs mt-1 ${getDoiStatus(store.doi) === "error" ? "text-red-600" : "text-gray-400"}`}>
              {getDoiStatus(store.doi) === "error"
                ? "Formato inválido. Ejemplo: 10.1234/abc.2024.001"
                : "Opcional. Acepta URL completa o solo el DOI"}
            </p>
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
            className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            Número de página dentro del volumen de la revista
          </p>
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
