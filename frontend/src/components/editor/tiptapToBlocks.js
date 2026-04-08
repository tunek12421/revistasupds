import { generateHTML, generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";

// Extensions used to convert between Tiptap JSON and HTML.
// Custom node views (FigureNode, FootnoteNode) are NOT included here
// because we extract them as separate blocks before HTML conversion.
const HTML_EXTENSIONS = [
  StarterKit,
  Underline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Link.configure({ openOnClick: false }),
  Subscript,
  Superscript,
];

/**
 * Convert a Tiptap document JSON into the block array used by the article store.
 * Text-like content (paragraphs, lists, blockquotes, headings) is grouped into
 * "text" blocks whose `content` is HTML. Figure and footnote nodes become their
 * own blocks.
 */
export function tiptapToBlocks(json) {
  const blocks = [];
  let currentNodes = [];

  const flushText = () => {
    if (currentNodes.length === 0) return;
    const html = generateHTML(
      { type: "doc", content: currentNodes },
      HTML_EXTENSIONS
    );
    blocks.push({ type: "text", content: html });
    currentNodes = [];
  };

  for (const node of json.content || []) {
    if (node.type === "figureNode") {
      flushText();
      blocks.push({ type: "figure", ...node.attrs });
    } else if (node.type === "footnoteNode") {
      flushText();
      blocks.push({ type: "footnote", ...node.attrs });
    } else {
      currentNodes.push(node);
    }
  }
  flushText();

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
  for (const b of blocks) {
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
            content.push(...parsed.content);
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
      content.push({
        type: "footnoteNode",
        attrs: { text: b.text || "", num: b.num || 1 },
      });
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
