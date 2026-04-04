import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FigureNode, FootnoteNode } from './tiptapUtils';
import { tiptapToBlocks, blocksToTiptapJSON } from './tiptapToBlocks';
import { ImagePlus, TableProperties, BarChart3, Footprints, ChevronDown, Check } from 'lucide-react';
import useArticleStore from '../../stores/articleStore';

export default function SectionEditor({ blocks, onChange, hideFootnotes = false }) {
  const updateSection = useArticleStore((s) => s.updateSection);
  const addBlock = useArticleStore((s) => s.addBlock);

  const editor = useEditor({
    extensions: [StarterKit, FigureNode, FootnoteNode],
    content: blocksToTiptapJSON(blocks),
    onUpdate: ({ editor }) => {
      // Autorenumber every time content changes globally
      const tr = editor.state.tr;
      let counts = { Figura: 1, Cuadro: 1, 'Gráfico': 1, footnote: 1 };
      let changed = false;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'figureNode') {
          const t = node.attrs.tipo || 'Figura';
          if (!counts[t]) counts[t] = 1;
          if (node.attrs.num !== counts[t]) {
            tr.setNodeMarkup(pos, null, { ...node.attrs, num: counts[t] });
            changed = true;
          }
          counts[t]++;
        } else if (node.type.name === 'footnoteNode') {
          if (node.attrs.num !== counts.footnote) {
            tr.setNodeMarkup(pos, null, { ...node.attrs, num: counts.footnote });
            changed = true;
          }
          counts.footnote++;
        }
      });

      if (changed) {
        editor.view.dispatch(tr);
      }

      const json = editor.getJSON();
      const newBlocks = tiptapToBlocks(json);
      if (onChange) {
        onChange(newBlocks);
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[150px] max-h-[400px] overflow-y-auto p-4 text-sm text-gray-800',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const insertFigure = (tipo) => {
    editor.chain().focus().insertContent({
      type: 'figureNode',
      attrs: { tipo, num: 9999 } // temporary dummy number
    }).run();
  };

  const insertFootnote = () => {
    editor.chain().focus().insertContent({
      type: 'footnoteNode',
    }).run();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Permanent visual menu */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2">
        <button
          onClick={() => insertFigure('Figura')}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded transition"
          title="Insertar Figura"
        >
          <ImagePlus size={14} /> Figura
        </button>
        <button
          onClick={() => insertFigure('Cuadro')}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100 rounded transition"
          title="Insertar Cuadro"
        >
          <TableProperties size={14} /> Cuadro
        </button>
        <button
          onClick={() => insertFigure('Gráfico')}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100 rounded transition"
          title="Insertar Gráfico"
        >
          <BarChart3 size={14} /> Gráfico
        </button>
        {!hideFootnotes && (
          <>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              onClick={insertFootnote}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-100 rounded transition"
              title="Insertar Nota al pie"
            >
              <Footprints size={14} /> Nota al pie
            </button>
          </>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
