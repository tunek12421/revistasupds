import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ListPlus,
  BookOpen,
} from "lucide-react";
import useArticleStore from "../../stores/articleStore";
import SectionEditor from "./SectionEditor";
import { getBodyStatus, getRefsStatus } from "../../lib/validations";

const COUNTER_COLORS = {
  empty: "text-gray-400",
  warn: "text-amber-600",
  ok: "text-green-600",
  error: "text-red-600",
};

export default function BodyPanel() {
  const sections = useArticleStore((s) => s.sections);
  const refs = useArticleStore((s) => s.refs);
  const docType = useArticleStore((s) => s.docType);
  const bodyStatus = useMemo(() => getBodyStatus(sections, docType), [sections, docType]);
  const refsStatus = useMemo(() => getRefsStatus(refs, docType), [refs, docType]);
  const addSection = useArticleStore((s) => s.addSection);
  const removeSection = useArticleStore((s) => s.removeSection);
  const addSubsection = useArticleStore((s) => s.addSubsection);
  const removeSubsection = useArticleStore((s) => s.removeSubsection);
  const updateSubsection = useArticleStore((s) => s.updateSubsection);
  const updateSection = useArticleStore((s) => s.updateSection);
  const addRef = useArticleStore((s) => s.addRef);
  const removeRef = useArticleStore((s) => s.removeRef);
  const updateRef = useArticleStore((s) => s.updateRef);

  const [collapsed, setCollapsed] = useState({});
  const [showRefs, setShowRefs] = useState(true);

  const toggleCollapse = (index) =>
    setCollapsed((p) => ({ ...p, [index]: !p[index] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Contenido</h2>
          <p className="text-xs text-gray-500">
            Secciones, figuras, notas al pie y referencias
          </p>
          <p className={`text-xs mt-0.5 ${COUNTER_COLORS[bodyStatus.status]}`}>
            {bodyStatus.words} palabras · rango {bodyStatus.limits.min}-{bodyStatus.limits.max} para "{docType}"
          </p>
        </div>
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 bg-[#223b87] hover:bg-[#1a2f6b] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
        >
          <Plus size={14} /> Sección
        </button>
      </div>

      {sections.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-400 text-sm">No hay secciones</p>
          <button
            onClick={addSection}
            className="mt-2 text-sm text-[#223b87] hover:underline font-medium"
          >
            Añadir la primera sección
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, sIdx) => {
          const isCollapsed = collapsed[sIdx];
          const blocks = section.blocks || [{ type: "text", content: section.content || "" }];

          return (
            <div key={sIdx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={() => toggleCollapse(sIdx)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#223b87] transition"
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span className="text-[#223b87]">{sIdx + 1}.</span>
                  {section.title || <span className="text-gray-400 font-normal">Sin título</span>}
                </button>
                <button
                  onClick={() => removeSection(sIdx)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {!isCollapsed && (
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(sIdx, "title", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
                    placeholder="Título de la sección (ej: Introducción, Metodología...)"
                  />

                  {/* Section Tiptap Editor */}
                  <div className="mt-2">
                    <SectionEditor 
                      blocks={blocks} 
                      onChange={(newBlocks) => updateSection(sIdx, "blocks", newBlocks)}
                    />
                  </div>

                  {/* Subsections */}
                  {section.subs && section.subs.length > 0 && (
                    <div className="ml-3 border-l-2 border-[#223b87]/20 pl-3 space-y-3 pt-2">
                      {section.subs.map((sub, subIdx) => {
                        const subBlocks = sub.blocks || [{ type: "text", content: sub.content || "" }];
                        return (
                          <div key={subIdx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#223b87]">
                                {sIdx + 1}.{subIdx + 1}
                              </span>
                              <button
                                onClick={() => removeSubsection(sIdx, subIdx)}
                                className="p-1 text-gray-400 hover:text-red-500 transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) => updateSubsection(sIdx, subIdx, "title", e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#223b87]"
                              placeholder="Título de subsección"
                            />
                            <div className="mt-1">
                              <SectionEditor 
                                blocks={subBlocks} 
                                onChange={(newBlocks) => updateSubsection(sIdx, subIdx, "blocks", newBlocks)}
                                hideFootnotes={true}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => addSubsection(sIdx)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#223b87] font-medium transition"
                  >
                    <ListPlus size={13} /> Añadir subsección
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* References */}
      {sections.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <button
              onClick={() => setShowRefs((p) => !p)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#223b87] transition"
            >
              {showRefs ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <BookOpen size={14} />
              Referencias bibliográficas
              <span className={`text-xs font-normal ${COUNTER_COLORS[refsStatus.status]}`}>
                {refsStatus.count}/{refsStatus.limits.min}-{refsStatus.limits.max}
              </span>
            </button>
            <button
              onClick={addRef}
              className="flex items-center gap-1 text-xs text-[#223b87] hover:underline font-medium"
            >
              <Plus size={13} /> Añadir
            </button>
          </div>
          {showRefs && (
            <div className="p-4 space-y-2">
              {refs.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">
                  No hay referencias. Haz clic en "Añadir" para empezar.
                </p>
              )}
              {refs.map((ref, rIdx) => (
                <div key={rIdx} className="flex items-start gap-2">
                  <span className="text-[10px] text-gray-400 mt-2 font-mono min-w-[20px]">
                    [{rIdx + 1}]
                  </span>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => updateRef(rIdx, e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#223b87]"
                    placeholder="Apellido, N. (año). Título. Ciudad: Editorial."
                  />
                  <button
                    onClick={() => removeRef(rIdx)}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
