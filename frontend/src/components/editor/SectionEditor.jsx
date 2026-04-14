import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Paragraph from "@tiptap/extension-paragraph";
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
  Indent,
  Outdent,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";

// Extension for independent paragraph indentation modes.
// Values are stored in centimeters for print-oriented editorial control.
const DEFAULT_FIRST_LINE_CM = 1.25;
const DEFAULT_BLOCK_CM = 2.5;
const BASE_FONT_SIZE_PX = 13.333;
const PX_PER_CM = 37.7952755906;
const MAX_INDENT_CM = 6;

function clampIndentCm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_INDENT_CM, n));
}

function toIndentCm(value) {
  if (!value) return 0;
  const raw = String(value).trim();
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return 0;
  if (raw.endsWith("cm")) return numeric;
  if (raw.endsWith("mm")) return numeric / 10;
  if (raw.endsWith("em")) return (numeric * BASE_FONT_SIZE_PX) / PX_PER_CM;
  if (raw.endsWith("px") || /^\d+(\.\d+)?$/.test(raw)) {
    return numeric / PX_PER_CM;
  }
  return clampIndentCm(numeric);
}

function formatIndentCm(value) {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}cm`;
}

const IndentParagraph = Paragraph.extend({
  addAttributes() {
    return {
      firstLineIndent: {
        default: 0,
        parseHTML: element => {
          const indent = element.style.textIndent;
          return toIndentCm(indent);
        },
        renderHTML: attributes => {
          if (!attributes.firstLineIndent) return {};
          return { style: `text-indent: ${formatIndentCm(attributes.firstLineIndent)}` };
        },
      },
      blockIndent: {
        default: 0,
        parseHTML: element => {
          const indent = element.style.marginLeft;
          return toIndentCm(indent);
        },
        renderHTML: attributes => {
          if (!attributes.blockIndent) return {};
          return { style: `margin-left: ${formatIndentCm(attributes.blockIndent)}` };
        },
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      toggleFirstLineIndent: () => ({ editor }) => {
        const currentIndent = editor.getAttributes("paragraph").firstLineIndent || 0;
        return editor.commands.updateAttributes('paragraph', {
          firstLineIndent: currentIndent > 0 ? 0 : DEFAULT_FIRST_LINE_CM,
        });
      },
      toggleBlockIndent: () => ({ editor }) => {
        const currentIndent = editor.getAttributes("paragraph").blockIndent || 0;
        return editor.commands.updateAttributes('paragraph', {
          blockIndent: currentIndent > 0 ? 0 : DEFAULT_BLOCK_CM,
        });
      },
      setFirstLineIndentCm: (value) => ({ editor }) => {
        return editor.commands.updateAttributes('paragraph', {
          firstLineIndent: clampIndentCm(value),
        });
      },
      setBlockIndentCm: (value) => ({ editor }) => {
        return editor.commands.updateAttributes('paragraph', {
          blockIndent: clampIndentCm(value),
        });
      },
    };
  },
});

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

export default function SectionEditor({ blocks, onChange, hideFootnotes = false, figureOffset = {} }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      IndentParagraph,
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
      // Start counting from the global offset so numbers are correct across sections
      const counts = {
        Figura: (figureOffset.Figura || 0) + 1,
        Cuadro: (figureOffset.Cuadro || 0) + 1,
        "Gráfico": (figureOffset["Gráfico"] || 0) + 1,
        footnote: (figureOffset.footnote || 0) + 1,
      };
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

  const [firstLineCmInput, setFirstLineCmInput] = useState(String(DEFAULT_FIRST_LINE_CM));
  const [blockCmInput, setBlockCmInput] = useState(String(DEFAULT_BLOCK_CM));

  useEffect(() => {
    if (!editor) return;

    const syncIndentInputs = () => {
      const attrs = editor.getAttributes("paragraph");
      const firstLine = attrs.firstLineIndent || 0;
      const block = attrs.blockIndent || 0;
      setFirstLineCmInput(String(Math.round(firstLine * 100) / 100));
      setBlockCmInput(String(Math.round(block * 100) / 100));
    };

    syncIndentInputs();
    editor.on("selectionUpdate", syncIndentInputs);
    editor.on("update", syncIndentInputs);

    return () => {
      editor.off("selectionUpdate", syncIndentInputs);
      editor.off("update", syncIndentInputs);
    };
  }, [editor]);

  if (!editor) return null;

  const parseCmInput = (value, fallback = 0) => {
    const parsed = Number.parseFloat(String(value).replace(",", "."));
    if (!Number.isFinite(parsed)) return fallback;
    return clampIndentCm(parsed);
  };

  const applyFirstLineCm = () => {
    const cm = parseCmInput(firstLineCmInput, 0);
    setFirstLineCmInput(String(cm));
    editor.chain().focus().setFirstLineIndentCm(cm).run();
  };

  const applyBlockCm = () => {
    const cm = parseCmInput(blockCmInput, 0);
    setBlockCmInput(String(cm));
    editor.chain().focus().setBlockIndentCm(cm).run();
  };

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
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleFirstLineIndent().run()}
          active={editor.getAttributes("paragraph").firstLineIndent > 0}
          title="Sangría de primera línea"
        >
          <Indent size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockIndent().run()}
          active={editor.getAttributes("paragraph").blockIndent > 0}
          title="Sangría de bloque"
        >
          <Outdent size={14} />
        </ToolbarButton>
        <div className="mx-1 flex items-center gap-1 text-[11px] text-gray-600">
          <span>1ra:</span>
          <input
            type="number"
            min="0"
            max={String(MAX_INDENT_CM)}
            step="0.1"
            value={firstLineCmInput}
            onChange={(e) => setFirstLineCmInput(e.target.value)}
            onBlur={applyFirstLineCm}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFirstLineCm();
            }}
            className="h-7 w-14 rounded border border-gray-300 px-1 text-right text-xs"
            title="Sangría primera línea (cm)"
          />
          <span>cm</span>
        </div>
        <div className="mx-1 flex items-center gap-1 text-[11px] text-gray-600">
          <span>Bloque:</span>
          <input
            type="number"
            min="0"
            max={String(MAX_INDENT_CM)}
            step="0.1"
            value={blockCmInput}
            onChange={(e) => setBlockCmInput(e.target.value)}
            onBlur={applyBlockCm}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyBlockCm();
            }}
            className="h-7 w-14 rounded border border-gray-300 px-1 text-right text-xs"
            title="Sangría de bloque (cm)"
          />
          <span>cm</span>
        </div>

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
