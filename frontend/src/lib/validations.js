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
