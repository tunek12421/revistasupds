import { generateHTML, generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Paragraph from "@tiptap/extension-paragraph";
import { Node } from "@tiptap/core";

const IndentParagraph = Paragraph.extend({
  addAttributes() {
    return {
      indent: {
        default: 0,
        parseHTML: element => {
          const indent = element.style.marginLeft || element.style.textIndent;
          return indent ? parseInt(indent, 10) : 0;
        },
        renderHTML: attributes => {
          if (!attributes.indent) return {};
          return { style: `text-indent: ${attributes.indent}px` };
        },
      },
    };
  },
});

// Simple footnote node extension for HTML generation
const FootnoteHTMLNode = Node.create({
  name: "footnoteNode",
  group: "inline",
  atom: true,
  inline: true,
  addAttributes() {
    return {
      text: { default: "" },
      num: { default: 1 },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-footnote]' }];
  },
  renderHTML() {
    return ["span", { "data-footnote": "true" }, "[fn]"];
  },
});

// Extensions used to convert between Tiptap JSON and HTML.
// Include FootnoteHTMLNode so footnotes render as [fn] in HTML
const HTML_EXTENSIONS = [
  StarterKit,
  IndentParagraph,
  Underline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Link.configure({ openOnClick: false }),
  Subscript,
  Superscript,
  FootnoteHTMLNode,
];

/**
 * Convert a Tiptap document JSON into the block array used by the article store.
 * 
 * Key behavior:
 * - Inline footnotes (within paragraphs in Tiptap) are extracted and created as separate blocks
 * - This maintains compatibility with collect() which processes block-type footnotes
 * - Result: store sees footnotes as separate blocks, but UI shows them inline without line breaks
 */
export function tiptapToBlocks(json) {
  const blocks = [];
  let currentNodes = [];
  let pendingFootnotes = [];

  const flushText = () => {
    if (currentNodes.length === 0) return;
    try {
      let html = generateHTML(
        { type: "doc", content: currentNodes },
        HTML_EXTENSIONS
      );
      // Strip out the placeholder attributes to keep the clean [fn] the backend expects
      html = html.replace(/<span[^>]*data-footnote[^>]*>\[fn\]<\/span>/g, "[fn]");
      blocks.push({ type: "text", content: html });
    } catch (e) {
      blocks.push({ type: "text", content: "<p></p>" });
    }
    currentNodes = [];
  };

  // Helper: extract footnotes from node, removing them from the tree (but staying in chronological order)
  const extractFootnotesFromNode = (node) => {
    if (!node) return null;
    
    if (node.type === "footnoteNode") {
      pendingFootnotes.push(node.attrs);
      // We return the special HTML node so generateHTML renders the [fn] 
      // but we ALSO store it in pendingFootnotes to create a real block later.
      return node;
    }
    
    if (node.content && Array.isArray(node.content)) {
      const newContent = [];
      for (const child of node.content) {
        const processed = extractFootnotesFromNode(child);
        if (processed !== null) {
          newContent.push(processed);
        }
      }
      return { ...node, content: newContent };
    }
    
    return node;
  };

  for (const node of json.content || []) {
    if (node.type === "figureNode") {
      flushText();
      // Add pending footnotes before figure
      for (const fn of pendingFootnotes) {
        blocks.push({ type: "footnote", ...fn });
      }
      pendingFootnotes = [];
      blocks.push({ type: "figure", ...node.attrs });
    } else if (node.type === "footnoteNode") {
      flushText();
      // Add pending footnotes before this block-level footnote
      for (const fn of pendingFootnotes) {
        blocks.push({ type: "footnote", ...fn });
      }
      pendingFootnotes = [];
      blocks.push({ type: "footnote", ...node.attrs });
    } else {
      // Extract inline footnotes from this node
      const processed = extractFootnotesFromNode(node);
      if (processed) {
        currentNodes.push(processed);
      }
    }
  }

  flushText();

  // Add any remaining footnotes
  for (const fn of pendingFootnotes) {
    blocks.push({ type: "footnote", ...fn });
  }

  if (blocks.length === 0) {
    blocks.push({ type: "text", content: "" });
  }
  return blocks;
}

/**
 * Convert the block array back to Tiptap JSON for editor consumption.
 * Text blocks (which now contain HTML) are parsed back to JSON nodes.
 * Figure and footnote blocks become custom nodes.
 */
export function blocksToTiptapJSON(blocks) {
  const content = [];

  // Recolectar las notas al pie de todo este conjunto de bloques
  const footnotesQueue = blocks.filter(b => b.type === "footnote");

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "text") {
      // Migrate legacy plain-text content to HTML on the fly
      const html = b.content || "";
      const isHtml = /<\/?[a-z][\s\S]*>/i.test(html);
      const finalHtml = isHtml
        ? html
        : html
            .split("\n")
            .map((p) => `<p>${escapeHtml(p)}</p>`)
            .join("");
      if (finalHtml) {
        try {
          const parsed = generateJSON(finalHtml, HTML_EXTENSIONS);
          if (parsed.content) {
            // Función para recorrer e inyectar notas al pie donde esté el texto "[fn]"
            const injectFootnotes = (nodes) => {
              const result = [];
              for (const node of nodes) {
                if (node.type === "text" && node.text.includes("[fn]")) {
                  const parts = node.text.split("[fn]");
                  for (let p = 0; p < parts.length; p++) {
                    if (parts[p]) {
                      result.push({ type: "text", text: parts[p] });
                    }
                    // Insertar el footnoteNode entre las partes (excepto después de la última parte)
                    if (p < parts.length - 1) {
                      const fnData = footnotesQueue.shift() || { text: "", num: 1 };
                      result.push({
                        type: "footnoteNode",
                        attrs: { text: fnData.text || "", num: fnData.num || 1 }
                      });
                    }
                  }
                } else if (node.content) {
                  result.push({ ...node, content: injectFootnotes(node.content) });
                } else {
                  result.push(node);
                }
              }
              return result;
            };

            content.push(...injectFootnotes(parsed.content));
          }
        } catch {
          content.push({ type: "paragraph" });
        }
      } else {
        content.push({ type: "paragraph" });
      }
    } else if (b.type === "figure") {
      content.push({
        type: "figureNode",
        attrs: {
          tipo: b.tipo || "Figura",
          num: b.num || 1,
          title: b.title || "",
          caption: b.caption || "",
          src: b.src || null,
          imgW: b.imgW || null,
          imgH: b.imgH || null,
          naturalW: b.naturalW || null,
          naturalH: b.naturalH || null,
        },
      });
    } else if (b.type === "footnote") {
      // Ignorar aquí, porque ya fueron extraídas al principio a `footnotesQueue`
      // y se inyectaron exactamente donde estaba el "[fn]"
      
      // Manejar el caso de notas al pie antiguas que no tienen "[fn]" en el texto
      // Si sobran notas al pie en la cola que corresponden a este bloque (por el orden),
      // las inyectamos al final del texto anterior.
      if (footnotesQueue.length > 0 && footnotesQueue[0] === b) {
        const fnData = footnotesQueue.shift();
        if (content.length === 0 || content[content.length - 1].type !== "paragraph") {
          content.push({ type: "paragraph", content: [] });
        }
        const lastParagraph = content[content.length - 1];
        if (!lastParagraph.content) {
          lastParagraph.content = [];
        }
        lastParagraph.content.push({
          type: "footnoteNode",
          attrs: { text: fnData.text || "", num: fnData.num || 1 },
        });
      }
    }
  }
  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
