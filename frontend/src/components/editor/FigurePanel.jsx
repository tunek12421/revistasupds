import { useState, useCallback } from "react";
import { Plus, Trash2, Upload, ImageIcon } from "lucide-react";
import useArticleStore from "../../stores/articleStore";

const TYPE_COLORS = {
  Figura: { bg: "bg-blue-100", text: "text-blue-700" },
  Cuadro: { bg: "bg-amber-100", text: "text-amber-700" },
  "Gráfico": { bg: "bg-emerald-100", text: "text-emerald-700" },
};

function FigureCard({ fig, index }) {
  const updateFigure = useArticleStore((s) => s.updateFigure);
  const removeFigure = useArticleStore((s) => s.removeFigure);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        updateFigure(index, "src", e.target.result);
      };
      reader.readAsDataURL(file);
    },
    [index, updateFigure]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const marker = `[${fig.tipo.toUpperCase()} ${fig.num}]`;
  const colors = TYPE_COLORS[fig.tipo] || TYPE_COLORS.Figura;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}
          >
            {fig.tipo}
          </span>
          <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
            {marker}
          </code>
        </div>
        <button
          onClick={() => removeFigure(index)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número
          </label>
          <input
            type="number"
            min={1}
            value={fig.num}
            onChange={(e) =>
              updateFigure(index, "num", parseInt(e.target.value) || 1)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            value={fig.title}
            onChange={(e) => updateFigure(index, "title", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Título de la figura"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Leyenda / Caption
        </label>
        <input
          type="text"
          value={fig.caption}
          onChange={(e) => updateFigure(index, "caption", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Descripción de la figura"
        />
      </div>

      {/* Image upload / drop zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imagen
        </label>
        {fig.src ? (
          <div className="relative group">
            <img
              src={fig.src}
              alt={`${fig.tipo} ${fig.num}`}
              className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-lg">
              <button
                onClick={() => updateFigure(index, "src", "")}
                className="bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg shadow"
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              dragActive
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2">
              {dragActive ? (
                <Upload className="text-primary-500" size={32} />
              ) : (
                <ImageIcon className="text-gray-300" size={32} />
              )}
              <p className="text-sm text-gray-500">
                {dragActive
                  ? "Suelta la imagen aquí"
                  : "Arrastra una imagen o haz clic para seleccionar"}
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, SVG
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Usa <code className="bg-gray-100 px-1 rounded">{marker}</code> en el
        cuerpo del texto para insertar esta figura.
      </p>
    </div>
  );
}

export default function FigurePanel() {
  const figs = useArticleStore((s) => s.figs);
  const addFigure = useArticleStore((s) => s.addFigure);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Figuras, Cuadros y Gráficos
          </h2>
          <p className="text-sm text-gray-500">
            Elementos visuales del artículo
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => addFigure("Figura")}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Añadir Figura
        </button>
        <button
          onClick={() => addFigure("Cuadro")}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Añadir Cuadro
        </button>
        <button
          onClick={() => addFigure("Gráfico")}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Añadir Gráfico
        </button>
      </div>

      {figs.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <ImageIcon className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="text-gray-400">
            No hay figuras, cuadros ni gráficos
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Usa los botones de arriba para añadir elementos visuales
          </p>
        </div>
      )}

      <div className="space-y-4">
        {figs.map((fig, index) => (
          <FigureCard key={index} fig={fig} index={index} />
        ))}
      </div>
    </div>
  );
}
