import { create } from "zustand";

const defaultState = {
  pageStart: 1,
  docType: "Artículo",
  titleEs: "",
  titleEn: "",
  doi: "",
  citeRef: "",
  dateReceived: "",
  dateAccepted: "",
  datePublished: "",
  lic: "CC BY 4.0",
  authors: [],
  absEs: "",
  kwEs: "",
  absEn: "",
  kwEn: "",
  sections: [],
  refs: [],
};

// A section looks like:
// { title: "", blocks: [{type:"text", content:""}, {type:"figure", tipo:"Figura", num:1, title:"", caption:"", src:""}], fns: [], subs: [] }

let figCounter = 0;

const useArticleStore = create((set, get) => ({
  ...defaultState,

  setField: (field, value) => set({ [field]: value }),

  // Authors
  addAuthor: () =>
    set((s) => ({
      authors: [...s.authors, { name: "", inst: "", email: "", orcid: "" }],
    })),
  removeAuthor: (index) =>
    set((s) => ({ authors: s.authors.filter((_, i) => i !== index) })),
  updateAuthor: (index, field, value) =>
    set((s) => ({
      authors: s.authors.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      ),
    })),

  // Sections
  addSection: () =>
    set((s) => ({
      sections: [
        ...s.sections,
        { title: "", blocks: [{ type: "text", content: "" }], fns: [], subs: [] },
      ],
    })),
  removeSection: (index) =>
    set((s) => ({ sections: s.sections.filter((_, i) => i !== index) })),
  updateSection: (index, field, value) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === index ? { ...sec, [field]: value } : sec
      ),
    })),

  // Blocks within a section
  addBlock: (sectionIndex, block) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, blocks: [...sec.blocks, block] }
          : sec
      ),
    })),
  removeBlock: (sectionIndex, blockIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, blocks: sec.blocks.filter((_, j) => j !== blockIndex) }
          : sec
      ),
    })),
  updateBlock: (sectionIndex, blockIndex, updates) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? {
              ...sec,
              blocks: sec.blocks.map((b, j) =>
                j === blockIndex ? { ...b, ...updates } : b
              ),
            }
          : sec
      ),
    })),

  // Insert a figure block after a specific block index
  insertFigureBlock: (sectionIndex, afterBlockIndex, tipo) => {
    figCounter++;
    const allFigs = get().sections.flatMap((sec) =>
      sec.blocks.filter((b) => b.type === "figure" && b.tipo === tipo)
    );
    const num = allFigs.length + 1;
    const figBlock = {
      type: "figure",
      tipo,
      num,
      title: "",
      caption: "",
      src: "",
    };
    set((s) => ({
      sections: s.sections.map((sec, i) => {
        if (i !== sectionIndex) return sec;
        const blocks = [...sec.blocks];
        blocks.splice(afterBlockIndex + 1, 0, figBlock, { type: "text", content: "" });
        return { ...sec, blocks };
      }),
    }));
  },

  // Insert a footnote block after a specific block index (+ text block to continue writing)
  insertFootnoteBlock: (sectionIndex, afterBlockIndex) => {
    set((s) => ({
      sections: s.sections.map((sec, i) => {
        if (i !== sectionIndex) return sec;
        const blocks = [...sec.blocks];
        // Check if next block is already a text block
        const nextBlock = blocks[afterBlockIndex + 1];
        const needsTextAfter = !nextBlock || nextBlock.type !== "text";
        blocks.splice(
          afterBlockIndex + 1,
          0,
          { type: "footnote", text: "" },
          ...(needsTextAfter ? [{ type: "text", content: "" }] : [])
        );
        return { ...sec, blocks };
      }),
    }));
  },

  // Subsections (level 2)
  addSubsection: (sectionIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? {
              ...sec,
              subs: [
                ...sec.subs,
                { title: "", blocks: [{ type: "text", content: "" }], subs: [] },
              ],
            }
          : sec
      ),
    })),
  removeSubsection: (sectionIndex, subIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, subs: sec.subs.filter((_, j) => j !== subIndex) }
          : sec
      ),
    })),
  updateSubsection: (sectionIndex, subIndex, field, value) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? {
              ...sec,
              subs: sec.subs.map((sub, j) =>
                j === subIndex ? { ...sub, [field]: value } : sub
              ),
            }
          : sec
      ),
    })),

  // Sub-subsections (level 3 — 1.1.1)
  addSubsubsection: (sectionIndex, subIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? {
              ...sec,
              subs: sec.subs.map((sub, j) =>
                j === subIndex
                  ? {
                      ...sub,
                      subs: [
                        ...(sub.subs || []),
                        { title: "", blocks: [{ type: "text", content: "" }] },
                      ],
                    }
                  : sub
              ),
            }
          : sec
      ),
    })),
  removeSubsubsection: (sectionIndex, subIndex, subsubIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? {
              ...sec,
              subs: sec.subs.map((sub, j) =>
                j === subIndex
                  ? {
                      ...sub,
                      subs: (sub.subs || []).filter((_, k) => k !== subsubIndex),
                    }
                  : sub
              ),
            }
          : sec
      ),
    })),
  updateSubsubsection: (sectionIndex, subIndex, subsubIndex, field, value) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? {
              ...sec,
              subs: sec.subs.map((sub, j) =>
                j === subIndex
                  ? {
                      ...sub,
                      subs: (sub.subs || []).map((subsub, k) =>
                        k === subsubIndex ? { ...subsub, [field]: value } : subsub
                      ),
                    }
                  : sub
              ),
            }
          : sec
      ),
    })),

  // Footnotes
  addFootnote: (sectionIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex ? { ...sec, fns: [...sec.fns, ""] } : sec
      ),
    })),
  removeFootnote: (sectionIndex, fnIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, fns: sec.fns.filter((_, j) => j !== fnIndex) }
          : sec
      ),
    })),
  updateFootnote: (sectionIndex, fnIndex, value) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, fns: sec.fns.map((fn, j) => (j === fnIndex ? value : fn)) }
          : sec
      ),
    })),

  // References
  addRef: () => set((s) => ({ refs: [...s.refs, ""] })),
  removeRef: (index) =>
    set((s) => ({ refs: s.refs.filter((_, i) => i !== index) })),
  updateRef: (index, value) =>
    set((s) => ({ refs: s.refs.map((r, i) => (i === index ? value : r)) })),

  // Collect — converts blocks back to the flat format the backend expects
  collect: () => {
    const s = get();
    const figs = [];
    const sections = s.sections.map((sec) => {
      let content = "";
      const fns = [];
      let lastWasFootnote = false;
      for (const block of sec.blocks || []) {
        if (block.type === "text") {
          if (lastWasFootnote) {
            // Continue on same line after a footnote (no line break)
            content += block.content;
          } else {
            content += (content && !content.endsWith("\n") ? "\n" : "") + block.content;
          }
          lastWasFootnote = false;
        } else if (block.type === "figure") {
          figs.push({
            tipo: block.tipo,
            num: block.num,
            title: block.title,
            caption: block.caption,
            src: block.src,
            width: block.imgW || null,
            height: block.imgH || null,
          });
          content +=
            (content && !content.endsWith("\n") ? "\n" : "") +
            `[${block.tipo.toUpperCase()} ${block.num}]`;
          lastWasFootnote = false;
        } else if (block.type === "footnote") {
          fns.push(block.text || "");
          // Insert [fn] BEFORE the last </p> so it ends up inline inside the paragraph
          const lastClose = content.lastIndexOf("</p>");
          if (lastClose !== -1) {
            content = content.slice(0, lastClose) + "[fn]" + content.slice(lastClose);
          } else {
            content += "<p>[fn]</p>";
          }
          lastWasFootnote = false;
        }
      }
      // Helper to flatten blocks of a sub or subsub into a content string,
      // pushing footnotes into the parent section's fns array (so they share
      // sequential numbering across section + subs + subsubs).
      const blocksToContent = (rawBlocks) => {
        let str = "";
        let lastFn = false;
        const blocksToProcess =
          rawBlocks && rawBlocks.length > 0
            ? rawBlocks
            : [{ type: "text", content: "" }];
        for (const block of blocksToProcess) {
          if (block.type === "text") {
            if (lastFn) {
              str += block.content;
            } else {
              str += (str && !str.endsWith("\n") ? "\n" : "") + block.content;
            }
            lastFn = false;
          } else if (block.type === "figure") {
            figs.push({
              tipo: block.tipo,
              num: block.num,
              title: block.title,
              caption: block.caption,
              src: block.src,
              width: block.imgW || null,
              height: block.imgH || null,
            });
            str +=
              (str && !str.endsWith("\n") ? "\n" : "") +
              `[${block.tipo.toUpperCase()} ${block.num}]`;
            lastFn = false;
          } else if (block.type === "footnote") {
            fns.push(block.text || "");
            // Insert [fn] BEFORE the last </p> so it ends up inline inside the paragraph
            const lastClose = str.lastIndexOf("</p>");
            if (lastClose !== -1) {
              str = str.slice(0, lastClose) + "[fn]" + str.slice(lastClose);
            } else {
              str += "<p>[fn]</p>";
            }
            lastFn = false;
          }
        }
        return str;
      };

      const subs = (sec.subs || []).map((sub) => ({
        title: sub.title,
        content: blocksToContent(
          sub.blocks && sub.blocks.length > 0
            ? sub.blocks
            : [{ type: "text", content: sub.content || "" }]
        ),
        subs: (sub.subs || []).map((subsub) => ({
          title: subsub.title,
          content: blocksToContent(
            subsub.blocks && subsub.blocks.length > 0
              ? subsub.blocks
              : [{ type: "text", content: subsub.content || "" }]
          ),
        })),
      }));

      return {
        title: sec.title,
        content,
        fns,
        subs,
      };
    });
    return {
      pageStart: s.pageStart,
      docType: s.docType,
      titleEs: s.titleEs,
      titleEn: s.titleEn,
      doi: s.doi,
      citeRef: s.citeRef,
      dateReceived: s.dateReceived,
      dateAccepted: s.dateAccepted,
      datePublished: s.datePublished,
      lic: s.lic,
      authors: s.authors,
      absEs: s.absEs,
      kwEs: s.kwEs,
      absEn: s.absEn,
      kwEn: s.kwEn,
      sections,
      figs,
      refs: s.refs,
    };
  },

  // Reset
  reset: () => {
    figCounter = 0;
    set({ ...defaultState });
  },

  // Load article data — converts flat format back to blocks
  loadArticle: (data) => {
    const figsByKey = {};
    for (const f of data.figs || []) {
      figsByKey[`[${(f.tipo || "FIGURA").toUpperCase()} ${f.num}]`] = f;
    }

    const parseContentToBlocks = (contentStr, fnsArray, fnIdxRef) => {
      const blocks = [];

      // Helper: split a chunk of HTML by [fn] markers, handling both
      // the new format (<p>text[fn]</p>) and the legacy format (</p>[fn])
      const splitFootnotesInChunk = (chunk) => {
        let remaining = chunk;
        let textBuf = "";

        const pushTextIfAny = () => {
          if (textBuf.trim()) {
            blocks.push({ type: "text", content: textBuf.trim() });
            textBuf = "";
          }
        };

        const pushFootnote = () => {
          blocks.push({
            type: "footnote",
            text: fnsArray[fnIdxRef.current] || "",
          });
          fnIdxRef.current++;
        };

        while (true) {
          const fnIdx = remaining.indexOf("[fn]");
          if (fnIdx === -1) {
            textBuf += remaining;
            break;
          }

          const beforeFn = remaining.slice(0, fnIdx);
          const afterFn = remaining.slice(fnIdx + 4);

          // Check if we are inside a paragraph: last <p comes after last </p>
          const combinedBefore = textBuf + beforeFn;
          const lastOpenP = combinedBefore.lastIndexOf("<p");
          const lastCloseP = combinedBefore.lastIndexOf("</p>");
          const insideP = lastOpenP > lastCloseP;

          if (insideP) {
            const closeP = afterFn.indexOf("</p>");
            if (closeP === -1) {
              // Malformed: fall back to legacy behavior
              textBuf += beforeFn;
              pushTextIfAny();
              pushFootnote();
              remaining = afterFn;
            } else {
              // Reconstruct paragraph without the [fn]
              const textInside = afterFn.slice(0, closeP);
              textBuf += beforeFn + textInside + "</p>";
              pushTextIfAny();
              pushFootnote();
              remaining = afterFn.slice(closeP + 4); // skip "</p>"
            }
          } else {
            // Legacy: [fn] outside any paragraph
            textBuf += beforeFn;
            pushTextIfAny();
            pushFootnote();
            remaining = afterFn;
          }
        }

        pushTextIfAny();
      };

      // Split content by lines to handle figure markers (whole-line markers)
      const lines = (contentStr || "").split("\n");
      let chunkBuf = "";

      const flushChunk = () => {
        if (chunkBuf) {
          splitFootnotesInChunk(chunkBuf);
          chunkBuf = "";
        }
      };

      for (const line of lines) {
        const match = line.trim().match(/^\[(FIGURA|CUADRO|GRÁFICO|GRAFICO)\s+(\d+)\]$/i);
        if (match) {
          flushChunk();
          const key = `[${match[1].toUpperCase()} ${match[2]}]`;
          const fig = figsByKey[key];
          blocks.push({
            type: "figure",
            tipo: fig?.tipo || match[1],
            num: parseInt(match[2]),
            title: fig?.title || "",
            caption: fig?.caption || "",
            src: fig?.src || "",
          });
        } else {
          chunkBuf += (chunkBuf ? "\n" : "") + line;
        }
      }
      flushChunk();

      if (blocks.length === 0) blocks.push({ type: "text", content: "" });
      return blocks;
    };

    const sections = (data.sections || []).map((sec) => {
      const secFns = sec.fns || [];
      const fnIdxRef = { current: 0 }; // Using object to pass by reference to the parser

      // Parse main section
      const blocks = parseContentToBlocks(sec.content || "", secFns, fnIdxRef);

      // Parse subsections (and their sub-subsections)
      const parsedSubs = (sec.subs || []).map((sub) => ({
        title: sub.title,
        blocks: parseContentToBlocks(sub.content || "", secFns, fnIdxRef),
        subs: (sub.subs || []).map((subsub) => ({
          title: subsub.title,
          blocks: parseContentToBlocks(subsub.content || "", secFns, fnIdxRef),
        })),
      }));

      return { title: sec.title, blocks, fns: [], subs: parsedSubs };
    });
    set({ ...data, sections, figs: undefined });
  },
}));

export default useArticleStore;
