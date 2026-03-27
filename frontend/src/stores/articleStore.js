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

  // Insert footnote marker
  insertFootnote: (sectionIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex ? { ...sec, fns: [...sec.fns, ""] } : sec
      ),
    })),

  // Subsections
  addSubsection: (sectionIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, subs: [...sec.subs, { title: "", content: "" }] }
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
      for (const block of sec.blocks || []) {
        if (block.type === "text") {
          content += (content && !content.endsWith("\n") ? "\n" : "") + block.content;
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
        }
      }
      return {
        title: sec.title,
        content,
        fns: sec.fns,
        subs: sec.subs,
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
    const sections = (data.sections || []).map((sec) => {
      const blocks = [];
      const lines = (sec.content || "").split("\n");
      let textBuf = "";
      for (const line of lines) {
        const match = line.trim().match(/^\[(FIGURA|CUADRO|GRÁFICO|GRAFICO)\s+(\d+)\]$/i);
        if (match) {
          if (textBuf.trim()) {
            blocks.push({ type: "text", content: textBuf.trim() });
            textBuf = "";
          }
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
          textBuf += (textBuf ? "\n" : "") + line;
        }
      }
      if (textBuf.trim()) blocks.push({ type: "text", content: textBuf.trim() });
      if (blocks.length === 0) blocks.push({ type: "text", content: "" });
      return { title: sec.title, blocks, fns: sec.fns || [], subs: sec.subs || [] };
    });
    set({ ...data, sections, figs: undefined });
  },
}));

export default useArticleStore;
