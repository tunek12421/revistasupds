// Centralized validation rules based on SciELO/Latindex/Redalyc/DOAJ standards.
// See VALIDATIONS.md for the full reference.

export const LIMITS = {
  title: { minWords: 5, maxWords: 20, maxChars: 200 },
  abstract: { minWords: 150, maxWords: 300, maxChars: 2000 },
  keyword: { maxChars: 50, maxWords: 4 },
  keywords: { min: 3, max: 6 },
  authors: { max: 10 },
  body: {
    "Artículo": { min: 3500, max: 7000 },
    "Revisión Bibliográfica": { min: 6000, max: 10000 },
    "Artículo de reflexión": { min: 2000, max: 5000 },
  },
  refs: {
    "Artículo": { min: 15, max: 60 },
    "Revisión Bibliográfica": { min: 50, max: 150 },
    "Artículo de reflexión": { min: 10, max: 40 },
  },
};

export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateTitle(title, label = "Título") {
  if (!title || !title.trim()) return `${label} es obligatorio`;
  if (title.length > LIMITS.title.maxChars) {
    return `${label}: máximo ${LIMITS.title.maxChars} caracteres (actual: ${title.length})`;
  }
  if (/[\n\r\t]/.test(title)) {
    return `${label}: no debe contener saltos de línea ni tabulaciones`;
  }
  if (/\.$/.test(title.trim())) {
    return `${label}: no debe terminar con punto`;
  }
  if (title === title.toUpperCase() && title.length > 10) {
    return `${label}: no debe estar todo en mayúsculas`;
  }
  const words = countWords(title);
  if (words < LIMITS.title.minWords) {
    return `${label}: mínimo ${LIMITS.title.minWords} palabras (actual: ${words})`;
  }
  if (words > LIMITS.title.maxWords) {
    return `${label}: máximo ${LIMITS.title.maxWords} palabras (actual: ${words})`;
  }
  return null;
}

export function getTitleStatus(title) {
  const words = countWords(title);
  const chars = (title || "").length;
  if (!title) return { words, chars, status: "empty" };
  if (
    words >= LIMITS.title.minWords &&
    words <= LIMITS.title.maxWords &&
    chars <= LIMITS.title.maxChars
  ) {
    return { words, chars, status: "ok" };
  }
  if (
    words > LIMITS.title.maxWords ||
    chars > LIMITS.title.maxChars
  ) {
    return { words, chars, status: "error" };
  }
  return { words, chars, status: "warn" };
}

export function validateAbstract(text, label = "Resumen") {
  if (!text || !text.trim()) return `${label} es obligatorio`;
  if (text.length > LIMITS.abstract.maxChars) {
    return `${label}: máximo ${LIMITS.abstract.maxChars} caracteres (actual: ${text.length})`;
  }
  // Detect double line breaks (paragraph breaks)
  if (/\n\s*\n/.test(text)) {
    return `${label}: debe ser un único párrafo (sin saltos de párrafo)`;
  }
  const words = countWords(text);
  if (words < LIMITS.abstract.minWords) {
    return `${label}: mínimo ${LIMITS.abstract.minWords} palabras (actual: ${words})`;
  }
  if (words > LIMITS.abstract.maxWords) {
    return `${label}: máximo ${LIMITS.abstract.maxWords} palabras (actual: ${words})`;
  }
  return null;
}

// ORCID: 16 digits in 4-4-4-4 format, last char can be X (checksum)
const ORCID_REGEX = /^(\d{4}-){3}\d{3}[\dX]$/;
const ORCID_URL_REGEX = /^(https?:\/\/orcid\.org\/)?(\d{4}-){3}\d{3}[\dX]$/;

export function validateOrcid(value) {
  if (!value || !value.trim()) return null; // Optional
  const trimmed = value.trim();
  if (!ORCID_URL_REGEX.test(trimmed)) {
    return "Formato inválido. Ejemplo: 0000-0002-1825-0097";
  }
  return null;
}

export function normalizeOrcid(value) {
  if (!value) return "";
  // Strip URL prefix if present
  return value.trim().replace(/^https?:\/\/orcid\.org\//, "");
}

export function getOrcidStatus(value) {
  if (!value || !value.trim()) return "empty";
  return ORCID_URL_REGEX.test(value.trim()) ? "ok" : "error";
}

// DOI: Crossref recommended pattern. Accepts optional URL prefix.
const DOI_REGEX = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
const DOI_URL_REGEX = /^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;

export function validateDoi(value) {
  if (!value || !value.trim()) return null; // Optional
  if (!DOI_URL_REGEX.test(value.trim())) {
    return "Formato inválido. Ejemplo: 10.1234/abc.2024.001";
  }
  return null;
}

export function normalizeDoi(value) {
  if (!value) return "";
  return value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
}

export function getDoiStatus(value) {
  if (!value || !value.trim()) return "empty";
  return DOI_URL_REGEX.test(value.trim()) ? "ok" : "error";
}

// Email: simplified RFC 5322
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(value) {
  if (!value || !value.trim()) return null; // Optional
  if (!EMAIL_REGEX.test(value.trim())) {
    return "Formato inválido. Ejemplo: autor@universidad.edu";
  }
  return null;
}

export function getEmailStatus(value) {
  if (!value || !value.trim()) return "empty";
  return EMAIL_REGEX.test(value.trim()) ? "ok" : "error";
}

// Count words across all sections (text blocks + subsection content)
export function countBodyWords(sections) {
  if (!sections || sections.length === 0) return 0;
  let total = 0;
  for (const sec of sections) {
    total += countWords(sec.title || "");
    if (sec.blocks) {
      for (const b of sec.blocks) {
        if (b.type === "text") total += countWords(b.content || "");
        else if (b.type === "footnote") total += countWords(b.text || "");
      }
    } else if (sec.content) {
      total += countWords(sec.content);
    }
    if (sec.subs) {
      for (const sub of sec.subs) {
        total += countWords(sub.title || "");
        total += countWords(sub.content || "");
      }
    }
  }
  return total;
}

export function validateBody(sections, docType) {
  const limits = LIMITS.body[docType] || LIMITS.body["Artículo"];
  const words = countBodyWords(sections);
  if (words === 0) return "El cuerpo del artículo está vacío";
  if (words < limits.min) {
    return `Cuerpo: mínimo ${limits.min} palabras para "${docType}" (actual: ${words})`;
  }
  if (words > limits.max) {
    return `Cuerpo: máximo ${limits.max} palabras para "${docType}" (actual: ${words})`;
  }
  return null;
}

export function getBodyStatus(sections, docType) {
  const limits = LIMITS.body[docType] || LIMITS.body["Artículo"];
  const words = countBodyWords(sections);
  if (words === 0) return { words, limits, status: "empty" };
  if (words >= limits.min && words <= limits.max) {
    return { words, limits, status: "ok" };
  }
  if (words > limits.max) return { words, limits, status: "error" };
  return { words, limits, status: "warn" };
}

export function parseKeywords(str) {
  if (!str || !str.trim()) return [];
  return str.split(",").map((k) => k.trim()).filter(Boolean);
}

export function validateKeywords(str, label = "Palabras clave") {
  const kws = parseKeywords(str);
  if (kws.length < LIMITS.keywords.min) {
    return `${label}: mínimo ${LIMITS.keywords.min} (actual: ${kws.length})`;
  }
  if (kws.length > LIMITS.keywords.max) {
    return `${label}: máximo ${LIMITS.keywords.max} (actual: ${kws.length})`;
  }
  for (const kw of kws) {
    if (kw.length > LIMITS.keyword.maxChars) {
      return `${label}: "${kw.slice(0, 30)}..." excede ${LIMITS.keyword.maxChars} caracteres`;
    }
    const words = kw.split(/\s+/).filter(Boolean).length;
    if (words > LIMITS.keyword.maxWords) {
      return `${label}: "${kw}" tiene ${words} palabras (máx ${LIMITS.keyword.maxWords})`;
    }
  }
  return null;
}

export function getAbstractStatus(text) {
  const words = countWords(text);
  const chars = (text || "").length;
  if (!text) return { words, chars, status: "empty" };
  if (
    words >= LIMITS.abstract.minWords &&
    words <= LIMITS.abstract.maxWords &&
    chars <= LIMITS.abstract.maxChars
  ) {
    return { words, chars, status: "ok" };
  }
  if (
    words > LIMITS.abstract.maxWords ||
    chars > LIMITS.abstract.maxChars
  ) {
    return { words, chars, status: "error" };
  }
  // Below minimum: warn (not error) so user can keep typing
  return { words, chars, status: "warn" };
}
