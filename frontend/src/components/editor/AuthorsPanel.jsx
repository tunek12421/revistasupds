import { Plus, Trash2, GripVertical } from "lucide-react";
import useArticleStore from "../../stores/articleStore";

export default function AuthorsPanel() {
  const authors = useArticleStore((s) => s.authors);
  const addAuthor = useArticleStore((s) => s.addAuthor);
  const removeAuthor = useArticleStore((s) => s.removeAuthor);
  const updateAuthor = useArticleStore((s) => s.updateAuthor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Autores
          </h2>
          <p className="text-sm text-gray-500">
            Añade los autores del artículo
          </p>
        </div>
        <button
          onClick={addAuthor}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Añadir autor
        </button>
      </div>

      {authors.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-400">No hay autores añadidos</p>
          <button
            onClick={addAuthor}
            className="mt-2 text-sm text-primary-500 hover:text-primary-700 font-medium"
          >
            Añadir el primer autor
          </button>
        </div>
      )}

      <div className="space-y-4">
        {authors.map((author, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-gray-300" />
                <span className="text-sm font-semibold text-primary-500">
                  Autor {index + 1}
                </span>
              </div>
              <button
                onClick={() => removeAuthor(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                title="Eliminar autor"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={author.name}
                  onChange={(e) =>
                    updateAuthor(index, "name", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre Apellido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institución
                </label>
                <input
                  type="text"
                  value={author.inst}
                  onChange={(e) =>
                    updateAuthor(index, "inst", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Universidad / Organización"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={author.email}
                  onChange={(e) =>
                    updateAuthor(index, "email", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="autor@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ORCID
                </label>
                <input
                  type="text"
                  value={author.orcid}
                  onChange={(e) =>
                    updateAuthor(index, "orcid", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0000-0002-1825-0097"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Solo el número (ej: 0000-0002-1825-0097)
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
