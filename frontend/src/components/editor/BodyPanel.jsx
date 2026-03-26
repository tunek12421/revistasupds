import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ListPlus,
  Footprints,
} from "lucide-react";
import useArticleStore from "../../stores/articleStore";

export default function BodyPanel() {
  const sections = useArticleStore((s) => s.sections);
  const addSection = useArticleStore((s) => s.addSection);
  const removeSection = useArticleStore((s) => s.removeSection);
  const updateSection = useArticleStore((s) => s.updateSection);
  const addSubsection = useArticleStore((s) => s.addSubsection);
  const removeSubsection = useArticleStore((s) => s.removeSubsection);
  const updateSubsection = useArticleStore((s) => s.updateSubsection);
  const addFootnote = useArticleStore((s) => s.addFootnote);
  const removeFootnote = useArticleStore((s) => s.removeFootnote);
  const updateFootnote = useArticleStore((s) => s.updateFootnote);

  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (index) => {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Cuerpo del artículo
          </h2>
          <p className="text-sm text-gray-500">
            Secciones, subsecciones y notas al pie
          </p>
        </div>
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Añadir sección
        </button>
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-400">No hay secciones</p>
          <button
            onClick={addSection}
            className="mt-2 text-sm text-primary-500 hover:text-primary-700 font-medium"
          >
            Añadir la primera sección
          </button>
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, sIdx) => {
          const isCollapsed = collapsed[sIdx];
          return (
            <div
              key={sIdx}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={() => toggleCollapse(sIdx)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary-500 transition"
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  Sección {sIdx + 1}
                  {section.title && (
                    <span className="font-normal text-gray-500">
                      — {section.title}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => removeSection(sIdx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar sección"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Section content */}
              {!isCollapsed && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título de la sección
                    </label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) =>
                        updateSection(sIdx, "title", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ej: Introducción, Metodología, Resultados..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido
                    </label>
                    <textarea
                      value={section.content}
                      onChange={(e) =>
                        updateSection(sIdx, "content", e.target.value)
                      }
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y font-mono"
                      placeholder="Escriba el contenido de la sección..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Marcadores disponibles:{" "}
                      <code className="bg-gray-100 px-1 rounded">[fn]</code>{" "}
                      para notas al pie,{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        [FIGURA X]
                      </code>
                      ,{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        [CUADRO X]
                      </code>
                      ,{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        [GRAFICO X]
                      </code>
                    </p>
                  </div>

                  {/* Subsections */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-600">
                        Subsecciones
                      </h4>
                      <button
                        onClick={() => addSubsection(sIdx)}
                        className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 font-medium"
                      >
                        <ListPlus size={14} />
                        Añadir subsección
                      </button>
                    </div>
                    {section.subs && section.subs.length > 0 && (
                      <div className="space-y-3 ml-4 border-l-2 border-primary-100 pl-4">
                        {section.subs.map((sub, subIdx) => (
                          <div
                            key={subIdx}
                            className="bg-gray-50 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-500">
                                Subsección {sIdx + 1}.{subIdx + 1}
                              </span>
                              <button
                                onClick={() =>
                                  removeSubsection(sIdx, subIdx)
                                }
                                className="p-1 text-gray-400 hover:text-red-500 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) =>
                                updateSubsection(
                                  sIdx,
                                  subIdx,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Título de subsección"
                            />
                            <textarea
                              value={sub.content}
                              onChange={(e) =>
                                updateSubsection(
                                  sIdx,
                                  subIdx,
                                  "content",
                                  e.target.value
                                )
                              }
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y font-mono"
                              placeholder="Contenido de la subsección..."
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footnotes */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-600">
                        Notas al pie
                      </h4>
                      <button
                        onClick={() => addFootnote(sIdx)}
                        className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 font-medium"
                      >
                        <Footprints size={14} />
                        Añadir nota
                      </button>
                    </div>
                    {section.fns && section.fns.length > 0 && (
                      <div className="space-y-2">
                        {section.fns.map((fn, fnIdx) => (
                          <div
                            key={fnIdx}
                            className="flex items-start gap-2"
                          >
                            <span className="text-xs text-gray-400 mt-2.5 font-mono min-w-[24px]">
                              [{fnIdx + 1}]
                            </span>
                            <input
                              type="text"
                              value={fn}
                              onChange={(e) =>
                                updateFootnote(
                                  sIdx,
                                  fnIdx,
                                  e.target.value
                                )
                              }
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Texto de la nota al pie..."
                            />
                            <button
                              onClick={() =>
                                removeFootnote(sIdx, fnIdx)
                              }
                              className="p-2 text-gray-400 hover:text-red-500 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Use <code className="bg-gray-100 px-1 rounded">[fn]</code>{" "}
                      en el contenido para marcar dónde va cada nota al pie.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
