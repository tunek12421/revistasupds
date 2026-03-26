import { Plus, Trash2 } from "lucide-react";
import useArticleStore from "../../stores/articleStore";

export default function ReferencesPanel() {
  const refs = useArticleStore((s) => s.refs);
  const addRef = useArticleStore((s) => s.addRef);
  const removeRef = useArticleStore((s) => s.removeRef);
  const updateRef = useArticleStore((s) => s.updateRef);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Referencias
          </h2>
          <p className="text-sm text-gray-500">
            Lista de referencias bibliográficas en formato APA
          </p>
        </div>
        <button
          onClick={addRef}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Añadir referencia
        </button>
      </div>

      {refs.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-400">No hay referencias añadidas</p>
          <button
            onClick={addRef}
            className="mt-2 text-sm text-primary-500 hover:text-primary-700 font-medium"
          >
            Añadir la primera referencia
          </button>
        </div>
      )}

      <div className="space-y-3">
        {refs.map((ref, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-sm font-mono text-gray-400 mt-2.5 min-w-[32px] text-right">
              [{index + 1}]
            </span>
            <textarea
              value={ref}
              onChange={(e) => updateRef(index, e.target.value)}
              rows={2}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
              placeholder="Apellido, N. (Año). Título del artículo. Revista, volumen(número), páginas. https://doi.org/..."
            />
            <button
              onClick={() => removeRef(index)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition mt-1"
              title="Eliminar referencia"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {refs.length > 0 && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
          <p className="text-xs font-medium text-primary-700 mb-1">
            Formato APA 7ma edición — Ejemplo:
          </p>
          <p className="text-xs text-primary-600 font-mono leading-relaxed">
            García, J. M., & López, A. R. (2023). Análisis de datos en
            investigación educativa. Revista de Educación Superior, 52(3),
            45-67. https://doi.org/10.1234/res.2023.001
          </p>
        </div>
      )}
    </div>
  );
}
