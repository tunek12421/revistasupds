import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { X, Upload } from 'lucide-react';
import { ResizableImage } from './ResizableImage';

export default function FigureNodeView(props) {
  const { node, updateAttributes, deleteNode } = props;
  const attrs = node.attrs;
  const [naturalSize, setNaturalSize] = useState(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        updateAttributes({
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
    const nw = attrs.naturalW || naturalSize?.w || 400;
    const nh = attrs.naturalH || naturalSize?.h || 300;
    updateAttributes({
      imgW: Math.round(nw * pct / 100),
      imgH: Math.round(nh * pct / 100),
    });
  };

  const currentScale = () => {
    if (!attrs.imgW || !attrs.naturalW) return 100;
    return Math.round(attrs.imgW / attrs.naturalW * 100);
  };

  const uuid = Math.random().toString(36).substring(7);

  return (
    <NodeViewWrapper className="figure-node-wrapper block my-2" contentEditable="false">
      <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 relative group">
        <button
          onClick={deleteNode}
          className="absolute top-2 right-2 p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 transition shadow-sm z-10"
          title="Eliminar"
        >
          <X size={12} />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
            {attrs.tipo} {attrs.num}
          </span>
        </div>
        <input
          type="text"
          value={attrs.title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#223b87] mb-2 bg-white"
          placeholder="Título de la figura"
        />
        {attrs.src ? (
          <div className="border border-green-200 bg-green-50/50 rounded p-2">
            <div className="flex justify-center">
              <ResizableImage
                src={attrs.src}
                width={attrs.imgW || null}
                height={attrs.imgH || null}
                onResize={(w, h) => updateAttributes({ imgW: w, imgH: h })}
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
                {attrs.imgW ? `${attrs.imgW}×${attrs.imgH}px (${currentScale()}%)` : "Original"}
              </span>
              {attrs.imgW && (
                <button
                  onClick={() => updateAttributes({ imgW: null, imgH: null })}
                  className="text-[10px] text-gray-400 hover:text-[#223b87] underline"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => document.getElementById(`fig-up-${uuid}`).click()}
                className="text-[10px] text-gray-400 hover:text-[#223b87] underline ml-auto"
              >
                Cambiar imagen
              </button>
            </div>
            <input
              id={`fig-up-${uuid}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded p-3 text-center text-xs cursor-pointer transition border-gray-300 text-gray-400 hover:border-[#223b87] hover:text-[#223b87] bg-white"
            onClick={() => document.getElementById(`fig-up-${uuid}`).click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <span className="flex items-center justify-center gap-1">
              <Upload size={13} /> Arrastra o clic para subir imagen
            </span>
            <input
              id={`fig-up-${uuid}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        )}
        <input
          type="text"
          value={attrs.caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#223b87] mt-2 bg-white"
          placeholder="Fuente: ..."
        />
      </div>
    </NodeViewWrapper>
  );
}
