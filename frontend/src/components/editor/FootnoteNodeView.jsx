import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { X } from 'lucide-react';

export default function FootnoteNodeView(props) {
  const { node, updateAttributes, deleteNode } = props;
  const attrs = node.attrs;

  return (
    <NodeViewWrapper className="footnote-node-wrapper inline-block mx-1 align-middle" contentEditable="false">
      <div className="border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 flex items-center gap-2 group relative shadow-sm">
        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded flex-shrink-0">
          FN {attrs.num || 1}
        </span>
        <input
          type="text"
          value={attrs.text}
          onChange={(e) => updateAttributes({ text: e.target.value })}
          className="w-32 rounded border border-amber-200 bg-white px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-400"
          placeholder="Texto al pie..."
        />
        <button
          onClick={deleteNode}
          className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-white transition"
          title="Eliminar nota"
        >
          <X size={10} />
        </button>
      </div>
    </NodeViewWrapper>
  );
}
