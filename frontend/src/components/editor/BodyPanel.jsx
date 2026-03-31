import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ListPlus,
  ImagePlus,
  TableProperties,
  BarChart3,
  Footprints,
  BookOpen,
  Upload,
  X,
} from "lucide-react";
import useArticleStore from "../../stores/articleStore";

function ResizableImage({ src, width, height, onResize }) {
  const containerRef = useRef(null);
  const dragging = useRef(null);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const handle = dragging.current;
      let newW = startPos.current.w;
      let newH = startPos.current.h;
      const ratio = startPos.current.w / startPos.current.h;

      if (handle === "e") newW = Math.max(40, startPos.current.w + dx);
      else if (handle === "s") newH = Math.max(30, startPos.current.h + dy);
      else if (handle === "se") {
        newW = Math.max(40, startPos.current.w + dx);
        newH = newW / ratio;
      } else if (handle === "w") newW = Math.max(40, startPos.current.w - dx);
      else if (handle === "sw") {
        newW = Math.max(40, startPos.current.w - dx);
        newH = newW / ratio;
      } else if (handle === "ne") {
        newW = Math.max(40, startPos.current.w + dx);
        newH = newW / ratio;
      } else if (handle === "nw") {
        newW = Math.max(40, startPos.current.w - dx);
        newH = newW / ratio;
      } else if (handle === "n") newH = Math.max(30, startPos.current.h - dy);

      onResize(Math.round(newW), Math.round(newH));
    };

    const handleUp = () => {
      dragging.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [onResize]);

  const startDrag = (handle, e) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = handle;
    const img = containerRef.current;
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      w: img.offsetWidth,
      h: img.offsetHeight,
    };
    document.body.style.cursor =
      handle === "e" || handle === "w" ? "ew-resize" :
      handle === "n" || handle === "s" ? "ns-resize" :
      handle === "se" || handle === "nw" ? "nwse-resize" : "nesw-resize";
    document.body.style.userSelect = "none";
  };

  const handleStyle = (pos) => {
    const base = "absolute w-2.5 h-2.5 bg-white border-2 border-[#223b87] rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity";
    const positions = {
      nw: "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
      n: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
      ne: "top-0 right-0 translate-x-1/2 -translate-y-1/2",
      e: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
      se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
      s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
      sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
      w: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
    };
    return `${base} ${positions[pos]}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block group"
      style={{ width: width || "auto", height: height || "auto" }}
    >
      <img
        src={src}
        alt=""
        className="block rounded"
        style={{ width: "100%", height: "100%", objectFit: "fill" }}
        draggable={false}
      />
      {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((pos) => (
        <div
          key={pos}
          className={handleStyle(pos)}
          style={{ cursor: pos === "e" || pos === "w" ? "ew-resize" : pos === "n" || pos === "s" ? "ns-resize" : pos === "se" || pos === "nw" ? "nwse-resize" : "nesw-resize" }}
          onMouseDown={(e) => startDrag(pos, e)}
        />
      ))}
    </div>
  );
}

function FigureBlock({ block, sectionIndex, blockIndex }) {
  const updateBlock = useArticleStore((s) => s.updateBlock);
  const removeBlock = useArticleStore((s) => s.removeBlock);
  const [naturalSize, setNaturalSize] = useState(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        updateBlock(sectionIndex, blockIndex, {
          src: e.target.result,
          imgW: null,
          imgH: null,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const applyScale = (pct) => {
    const nw = block.naturalW || naturalSize?.w || 400;
    const nh = block.naturalH || naturalSize?.h || 300;
    updateBlock(sectionIndex, blockIndex, {
      imgW: Math.round(nw * pct / 100),
      imgH: Math.round(nh * pct / 100),
    });
  };

  const currentScale = () => {
    if (!block.imgW || !block.naturalW) return 100;
    return Math.round(block.imgW / block.naturalW * 100);
  };

  return (
    <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 my-1 relative group">
      <button
        onClick={() => removeBlock(sectionIndex, blockIndex)}
        className="absolute top-2 right-2 p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 transition"
        title="Eliminar"
      >
        <X size={12} />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
          {block.tipo} {block.num}
        </span>
      </div>
      <input
        type="text"
        value={block.title}
        onChange={(e) =>
          updateBlock(sectionIndex, blockIndex, { title: e.target.value })
        }
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#223b87] mb-2"
        placeholder="Título de la figura"
      />
      {block.src ? (
        <div className="border border-green-200 bg-green-50/50 rounded p-2">
          <div className="flex justify-center">
            <ResizableImage
              src={block.src}
              width={block.imgW || null}
              height={block.imgH || null}
              onResize={(w, h) => updateBlock(sectionIndex, blockIndex, { imgW: w, imgH: h })}
            />
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-gray-400">Escala:</span>
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => applyScale(pct)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                  currentScale() === pct
                    ? "bg-[#223b87] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {pct}%
              </button>
            ))}
            <span className="text-[10px] text-gray-400 ml-1">
              {block.imgW ? `${block.imgW}×${block.imgH}px (${currentScale()}%)` : "Original"}
            </span>
            {block.imgW && (
              <button
                onClick={() => updateBlock(sectionIndex, blockIndex, { imgW: null, imgH: null })}
                className="text-[10px] text-gray-400 hover:text-[#223b87] underline"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => document.getElementById(`fig-up-${sectionIndex}-${blockIndex}`).click()}
              className="text-[10px] text-gray-400 hover:text-[#223b87] underline ml-auto"
            >
              Cambiar imagen
            </button>
          </div>
          <input
            id={`fig-up-${sectionIndex}-${blockIndex}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded p-3 text-center text-xs cursor-pointer transition border-gray-300 text-gray-400 hover:border-[#223b87] hover:text-[#223b87]"
          onClick={() => document.getElementById(`fig-up-${sectionIndex}-${blockIndex}`).click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        >
          <span className="flex items-center justify-center gap-1">
            <Upload size={13} /> Arrastra o clic para subir imagen
          </span>
          <input
            id={`fig-up-${sectionIndex}-${blockIndex}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}
      <input
        type="text"
        value={block.caption}
        onChange={(e) =>
          updateBlock(sectionIndex, blockIndex, { caption: e.target.value })
        }
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#223b87] mt-2"
        placeholder="Fuente: ..."
      />
    </div>
  );
}

function FootnoteBlock({ block, sectionIndex, blockIndex, fnNumber }) {
  const updateBlock = useArticleStore((s) => s.updateBlock);
  const removeBlock = useArticleStore((s) => s.removeBlock);

  return (
    <div className="border border-amber-200 bg-amber-50/50 rounded-lg px-3 py-2 my-1 flex items-start gap-2 group relative">
      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
        <sup>{fnNumber}</sup>
      </span>
      <input
        type="text"
        value={block.text}
        onChange={(e) => updateBlock(sectionIndex, blockIndex, { text: e.target.value })}
        className="flex-1 rounded border border-amber-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
        placeholder="Texto que aparecerá al pie de página..."
      />
      <button
        onClick={() => removeBlock(sectionIndex, blockIndex)}
        className="p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
        title="Eliminar nota"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function TextBlock({ block, sectionIndex, blockIndex }) {
  const updateBlock = useArticleStore((s) => s.updateBlock);

  return (
    <textarea
      value={block.content}
      onChange={(e) =>
        updateBlock(sectionIndex, blockIndex, { content: e.target.value })
      }
      rows={3}
      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent resize-y my-0.5"
      placeholder="Escriba el texto..."
    />
  );
}

function InsertBar({ sectionIndex, afterBlockIndex }) {
  const insertFigureBlock = useArticleStore((s) => s.insertFigureBlock);
  const insertFootnoteBlock = useArticleStore((s) => s.insertFootnoteBlock);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative h-5 flex items-center justify-center">
      <div className="absolute inset-x-4 top-1/2 h-px bg-gray-200" />
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative z-10 w-5 h-5 rounded-full bg-white border flex items-center justify-center transition ${
          open
            ? "border-[#223b87] text-[#223b87]"
            : "border-gray-300 text-gray-400 hover:border-[#223b87] hover:text-[#223b87]"
        }`}
      >
        {open ? <X size={10} /> : <Plus size={12} />}
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 flex items-center gap-1 py-1.5 px-3 bg-white rounded-lg shadow-lg border border-gray-200 whitespace-nowrap">
          {[
            { tipo: "Figura", icon: ImagePlus, color: "text-blue-600 hover:bg-blue-50" },
            { tipo: "Cuadro", icon: TableProperties, color: "text-emerald-600 hover:bg-emerald-50" },
            { tipo: "Gráfico", icon: BarChart3, color: "text-purple-600 hover:bg-purple-50" },
          ].map(({ tipo, icon: Icon, color }) => (
            <button
              key={tipo}
              onClick={() => {
                insertFigureBlock(sectionIndex, afterBlockIndex, tipo);
                setOpen(false);
              }}
              className={`flex items-center gap-1 text-xs font-medium ${color} px-2 py-1 rounded transition`}
            >
              <Icon size={13} /> {tipo}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            onClick={() => {
              insertFootnoteBlock(sectionIndex, afterBlockIndex);
              setOpen(false);
            }}
            className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:bg-amber-50 px-2 py-1 rounded transition"
          >
            <Footprints size={13} /> Nota
          </button>
        </div>
      )}
    </div>
  );
}

export default function BodyPanel() {
  const sections = useArticleStore((s) => s.sections);
  const refs = useArticleStore((s) => s.refs);
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
                <div className="p-4 space-y-2">
                  {/* Title */}
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(sIdx, "title", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87] focus:border-transparent"
                    placeholder="Título de la sección (ej: Introducción, Metodología...)"
                  />

                  {/* Content blocks */}
                  <div className="space-y-0">
                    {(() => {
                      let fnCount = 0;
                      return blocks.map((block, bIdx) => {
                        if (block.type === "footnote") fnCount++;
                        return (
                          <div key={bIdx}>
                            {block.type === "text" && (
                              <TextBlock block={block} sectionIndex={sIdx} blockIndex={bIdx} />
                            )}
                            {block.type === "figure" && (
                              <FigureBlock block={block} sectionIndex={sIdx} blockIndex={bIdx} />
                            )}
                            {block.type === "footnote" && (
                              <FootnoteBlock block={block} sectionIndex={sIdx} blockIndex={bIdx} fnNumber={fnCount} />
                            )}
                            <InsertBar sectionIndex={sIdx} afterBlockIndex={bIdx} />
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Subsections */}
                  {section.subs && section.subs.length > 0 && (
                    <div className="ml-3 border-l-2 border-[#223b87]/20 pl-3 space-y-2 pt-2">
                      {section.subs.map((sub, subIdx) => (
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
                          <textarea
                            value={sub.content}
                            onChange={(e) => updateSubsection(sIdx, subIdx, "content", e.target.value)}
                            rows={3}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#223b87] resize-y"
                            placeholder="Contenido..."
                          />
                        </div>
                      ))}
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
              {refs.filter(Boolean).length > 0 && (
                <span className="text-xs text-gray-400 font-normal">
                  ({refs.filter(Boolean).length})
                </span>
              )}
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
