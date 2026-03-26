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
  figs: [],
  refs: [],
};

const useArticleStore = create((set, get) => ({
  ...defaultState,

  setField: (field, value) => set({ [field]: value }),

  // Authors
  addAuthor: () =>
    set((s) => ({
      authors: [
        ...s.authors,
        { name: "", inst: "", email: "", orcid: "" },
      ],
    })),
  removeAuthor: (index) =>
    set((s) => ({
      authors: s.authors.filter((_, i) => i !== index),
    })),
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
        { title: "", content: "", fns: [], subs: [] },
      ],
    })),
  removeSection: (index) =>
    set((s) => ({
      sections: s.sections.filter((_, i) => i !== index),
    })),
  updateSection: (index, field, value) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === index ? { ...sec, [field]: value } : sec
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

  // Figures
  addFigure: (tipo = "Figura") =>
    set((s) => {
      const existing = s.figs.filter((f) => f.tipo === tipo);
      const nextNum = existing.length > 0 ? Math.max(...existing.map((f) => f.num)) + 1 : 1;
      return {
        figs: [
          ...s.figs,
          { tipo, num: nextNum, title: "", caption: "", src: "" },
        ],
      };
    }),
  removeFigure: (index) =>
    set((s) => ({
      figs: s.figs.filter((_, i) => i !== index),
    })),
  updateFigure: (index, field, value) =>
    set((s) => ({
      figs: s.figs.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      ),
    })),

  // References
  addRef: () =>
    set((s) => ({
      refs: [...s.refs, ""],
    })),
  removeRef: (index) =>
    set((s) => ({
      refs: s.refs.filter((_, i) => i !== index),
    })),
  updateRef: (index, value) =>
    set((s) => ({
      refs: s.refs.map((r, i) => (i === index ? value : r)),
    })),

  // Footnotes
  addFootnote: (sectionIndex) =>
    set((s) => ({
      sections: s.sections.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, fns: [...sec.fns, ""] }
          : sec
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
          ? {
              ...sec,
              fns: sec.fns.map((fn, j) => (j === fnIndex ? value : fn)),
            }
          : sec
      ),
    })),

  // Collect full payload
  collect: () => {
    const s = get();
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
      sections: s.sections,
      figs: s.figs,
      refs: s.refs,
    };
  },

  // Reset store
  reset: () => set({ ...defaultState }),

  // Load article data
  loadArticle: (data) => set({ ...data }),
}));

export default useArticleStore;
