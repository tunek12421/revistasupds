# Checklist de Validaciones Profesionales — EARL

Validaciones basadas en estándares de **SciELO**, **Latindex**, **Redalyc** y **DOAJ** para revistas científicas latinoamericanas.

---

## Fase 1 — Validaciones de Formato (Crítico para indexación)

### Título
- [x] **Mínimo 5 palabras, máximo 20 palabras** (ES e EN)
- [x] **Máximo 200 caracteres** (ES e EN)
- [x] Sin saltos de línea, sin tabulaciones
- [x] Sin punto final, sin todo en mayúsculas
- [x] Mensaje de error claro indicando rango actual vs requerido

### Resumen (Abstract)
- [x] **Mínimo 150 palabras, máximo 300 palabras** (ES e EN)
- [x] **Máximo 2000 caracteres**
- [x] Debe ser un único párrafo (sin saltos de línea dobles)
- [x] Contador en vivo `(180/300 palabras)` mientras escribe
- [x] Color del contador cambia: gris (válido) → amber (cerca del límite) → rojo (fuera de rango)

### ORCID
- [x] Validación con regex: `^(\d{4}-){3}\d{3}[\dX]$`
- [x] Acepta opcionalmente prefijo URL: `^(https?://orcid\.org/)?(\d{4}-){3}\d{3}[\dX]$`
- [x] Mensaje de error: "Formato inválido. Ejemplo: 0000-0002-1825-0097"
- [x] Validación inline (al perder foco)

### DOI
- [x] Validación con regex Crossref: `^10\.\d{4,9}/[-._;()/:A-Za-z0-9]+$`
- [x] Acepta opcionalmente prefijo `https://doi.org/`
- [x] Almacenar el DOI bare (sin URL)
- [x] Mostrar como link en el PDF: `https://doi.org/{doi}`
- [x] Mensaje de error: "Formato inválido. Ejemplo: 10.1234/abc.2024.001"

### Email
- [x] Validación server-side con Pydantic `EmailStr` (ya implementado en auth)
- [x] Validación inline en el frontend del campo del autor
- [x] Mensaje de error claro

---

## Fase 2 — Validaciones de Cantidad y Estructura

### Palabras Clave
- [x] Mínimo 3, máximo 6 (ya implementado)
- [x] Máximo 50 caracteres por keyword
- [x] Máximo 4 palabras por keyword (no permitir frases largas)
- [ ] No duplicar palabras del título (advertencia, no error)
- [x] Validación independiente para ES y EN

### Autores
- [x] **Mínimo 1, máximo 10 autores**
- [ ] Cada autor debe tener: nombre completo (obligatorio), institución (obligatorio)
- [x] Email opcional pero validado si se ingresa
- [x] ORCID opcional pero validado si se ingresa
- [ ] Marcar al menos un autor como "corresponsal"

### Cuerpo del Artículo (según `docType`)

| Tipo | Mínimo | Máximo |
|------|--------|--------|
| Artículo | 3,500 palabras | 7,000 palabras |
| Revisión Bibliográfica | 6,000 palabras | 10,000 palabras |
| Artículo de reflexión | 2,000 palabras | 5,000 palabras |

- [ ] Contador de palabras del cuerpo en el step "Revisar"
- [ ] Validación al generar PDF según `docType`
- [ ] Mensaje informativo durante la edición

### Referencias (según `docType`)

| Tipo | Mínimo | Máximo |
|------|--------|--------|
| Artículo | 15 | 60 |
| Revisión Bibliográfica | 50 | 150 |
| Artículo de reflexión | 10 | 40 |

- [ ] Validación de cantidad según `docType`
- [ ] Cada referencia debe tener mínimo 30 caracteres
- [ ] Cada referencia debe contener un año entre paréntesis `(YYYY)` (advertencia)
- [ ] Mensaje de error en el panel de referencias

### Figuras y Tablas
- [ ] Máximo 10 figuras/cuadros/gráficos combinados
- [ ] Cada figura debe tener título obligatorio
- [ ] Imagen obligatoria para Figura y Gráfico (Cuadro puede ser solo texto)

---

## Fase 3 — Campos Faltantes para Indexación SciELO/DOAJ

### Declaraciones obligatorias (SciELO 2020+)
- [ ] **Conflicto de intereses**: campo de texto libre o checkbox "no hay conflicto"
- [ ] **Financiamiento**: fuente de fondos del estudio (texto libre)
- [ ] **Contribución de autores (CRediT)**: taxonomía estándar de 14 roles por autor
  - Conceptualización
  - Curación de datos
  - Análisis formal
  - Adquisición de fondos
  - Investigación
  - Metodología
  - Administración del proyecto
  - Recursos
  - Software
  - Supervisión
  - Validación
  - Visualización
  - Escritura - borrador original
  - Escritura - revisión y edición

### Datos del autor extendidos
- [ ] **País** del autor (por afiliación)
- [ ] Marcar autor **corresponsal**

---

## Fase 4 — Validaciones de Estructura (IMRAD)

### Para Artículos de Investigación
- [ ] Sugerencia de secciones obligatorias: Introducción, Métodos, Resultados, Discusión, Conclusiones
- [ ] Detección de palabras clave en títulos de sección para sugerir IMRAD
- [ ] Advertencia (no bloqueo) si faltan secciones estándar

### Para Revisiones Bibliográficas
- [ ] Secciones sugeridas: Introducción, Metodología de la Revisión, Desarrollo, Discusión, Conclusiones
- [ ] Recomendar PRISMA en metodología

---

## Fase 5 — Mejoras de UX

- [ ] Contadores en vivo en cada campo con limit (palabras/caracteres)
- [ ] Indicadores visuales de validación: verde (ok), amber (cerca del límite), rojo (fuera de rango)
- [ ] Tooltip con ayuda contextual sobre cada límite
- [ ] Resumen de validaciones en el step "Revisar" con checklist visual
- [ ] No bloquear el guardado de borradores (solo validar al generar PDF)

---

## Referencias

- [SciELO Publication Guidelines](https://blog.scielo.org/en/about/publication-guidelines/)
- [Latindex Catálogo 2.0](https://www.latindex.org/lat/documentos/Caracteristicas_de_calidad_para_revistas_impresas.pdf)
- [DOAJ Guide to Applying](https://doaj.org/apply/guide/)
- [APA Style 7th edition](https://apastyle.apa.org/instructional-aids/abstract-keywords-guide.pdf)
- [Crossref DOI Regex](https://www.crossref.org/blog/dois-and-matching-regular-expressions/)
- [ORCID Identifier Structure](https://support.orcid.org/hc/en-us/articles/360006897674-Structure-of-the-ORCID-Identifier)
- [CRediT Taxonomy](https://credit.niso.org/)
