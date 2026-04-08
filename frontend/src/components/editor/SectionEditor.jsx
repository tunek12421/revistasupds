import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { FigureNode, FootnoteNode } from "./tiptapUtils";
import { tiptapToBlocks, blocksToTiptapJSON } from "./tiptapToBlocks";
import {
  ImagePlus,
  TableProperties,
  BarChart3,
  Footprints,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded transition ${
        active
          ? "bg-[#223b87] text-white"
          : "text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5" />;
}

export default function SectionEditor({ blocks, onChange, hideFootnotes = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Subscript,
      Superscript,
      FigureNode,
      FootnoteNode,
    ],
    content: blocksToTiptapJSON(blocks),
    onUpdate: ({ editor }) => {
      // Auto-renumber figures and footnotes within this editor instance
      const tr = editor.state.tr;
      const counts = { Figura: 1, Cuadro: 1, "Gráfico": 1, footnote: 1 };
      let changed = false;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "figureNode") {
          const t = node.attrs.tipo || "Figura";
          if (!counts[t]) counts[t] = 1;
          if (node.attrs.num !== counts[t]) {
            tr.setNodeMarkup(pos, null, { ...node.attrs, num: counts[t] });
            changed = true;
          }
          counts[t]++;
        } else if (node.type.name === "footnoteNode") {
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
      if (onChange) onChange(newBlocks);
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-content focus:outline-none min-h-[150px] max-h-[400px] overflow-y-auto p-4 text-sm text-gray-800",
      },
    },
  });

  if (!editor) return null;

  const insertFigure = (tipo) => {
    editor
      .chain()
      .focus()
      .insertContent({ type: "figureNode", attrs: { tipo, num: 9999 } })
      .run();
  };

  const insertFootnote = () => {
    editor.chain().focus().insertContent({ type: "footnoteNode" }).run();
  };

  const promptLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("URL del enlace", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Formatting Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-1.5 flex items-center gap-0.5 flex-wrap">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Negrita (Ctrl+B)"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Cursiva (Ctrl+I)"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Subrayado (Ctrl+U)"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Tachado"
        >
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive("subscript")}
          title="Subíndice"
        >
          <SubscriptIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive("superscript")}
          title="Superíndice"
        >
          <SuperscriptIcon size={14} />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Alinear izquierda"
        >
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Centrar"
        >
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Alinear derecha"
        >
          <AlignRight size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justificar"
        >
          <AlignJustify size={14} />
        </ToolbarButton>

        <Divider />

        {/* Lists & blockquote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Lista con viñetas"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Cita en bloque"
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={promptLink}
          active={editor.isActive("link")}
          title="Insertar/editar enlace"
        >
          <LinkIcon size={14} />
        </ToolbarButton>

        <Divider />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rehacer (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </ToolbarButton>

        <Divider />

        {/* Insert special blocks */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertFigure("Figura")}
          className="flex items-center gap-1 px-2 h-7 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded transition"
          title="Insertar Figura"
        >
          <ImagePlus size={13} /> Figura
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertFigure("Cuadro")}
          className="flex items-center gap-1 px-2 h-7 text-xs font-medium text-emerald-600 hover:bg-emerald-100 rounded transition"
          title="Insertar Cuadro"
        >
          <TableProperties size={13} /> Cuadro
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertFigure("Gráfico")}
          className="flex items-center gap-1 px-2 h-7 text-xs font-medium text-purple-600 hover:bg-purple-100 rounded transition"
          title="Insertar Gráfico"
        >
          <BarChart3 size={13} /> Gráfico
        </button>
        {!hideFootnotes && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertFootnote}
            className="flex items-center gap-1 px-2 h-7 text-xs font-medium text-amber-600 hover:bg-amber-100 rounded transition"
            title="Insertar Nota al pie"
          >
            <Footprints size={13} /> Nota al pie
          </button>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
