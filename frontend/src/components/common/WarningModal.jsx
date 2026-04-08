import { AlertTriangle, X } from "lucide-react";

export default function WarningModal({ open, title, messages, onContinue, onCancel, continueLabel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {title || "Advertencia de validación"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                El contenido no cumple con los estándares profesionales recomendados
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <ul className="space-y-2">
            {(messages || []).map((msg, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
              >
                <span className="text-amber-600 mt-0.5">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-4">
            Puedes corregir el contenido o continuar bajo tu responsabilidad. Estos
            límites están basados en estándares de SciELO, Latindex y Redalyc.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-white transition"
          >
            Corregir
          </button>
          <button
            onClick={onContinue}
            className="text-sm bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            {continueLabel || "Continuar de todas formas"}
          </button>
        </div>
      </div>
    </div>
  );
}
