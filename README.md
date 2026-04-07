# EARL — Formateador de Artículos Científicos

Plataforma web para formatear y generar PDFs de artículos científicos para **Estudios Ambientales Revista Latinoamericana (EARL)** — UPDS.

Cumple con los estándares de indexación de **SciELO**, **Latindex**, **Redalyc** y **DOAJ** para revistas latinoamericanas.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS + Zustand + Tiptap (editor rich text) |
| **Backend** | FastAPI + Pydantic + Uvicorn + SQLAlchemy 2.0 async + asyncpg |
| **Base de datos** | PostgreSQL 16 (JSONB para almacenar artículos) |
| **Auth** | JWT (python-jose) + Argon2 (pwdlib) |
| **PDF** | WeasyPrint ≥ 68.0 (HTML/CSS → PDF) |
| **Deploy** | Docker Compose (single-VPS) + Nginx (reverse proxy del host) |

---

## Características principales

### Flujo de edición
- **Wizard de 5 pasos** con progressive disclosure (Apple HIG)
  1. Tipo y título (ES/EN)
  2. Autores con ORCID
  3. Resumen y palabras clave (ES/EN)
  4. Contenido (secciones, figuras, notas al pie, referencias)
  5. Revisar y generar PDF
- **Vista previa en vivo** lado a lado, idéntica al PDF final
- **Auto-guardado** en cada paso
- **Editor rich text** (Tiptap) con figuras y notas al pie como nodos visuales inline
- **Imágenes redimensionables** con handles tipo Word + presets de escala

### Validaciones profesionales (basadas en estándares SciELO/Latindex)

| Campo | Validación |
|-------|-----------|
| Título ES/EN | 5-20 palabras, máx 200 chars, sin saltos de línea |
| Resumen ES/EN | 150-300 palabras, párrafo único, máx 2000 chars |
| Palabras clave | 3-6 keywords, máx 50 chars y 4 palabras por término |
| Autores | Máx 10, nombre obligatorio |
| ORCID | Regex `^(\d{4}-){3}\d{3}[\dX]$`, normalización de URL |
| Email | RFC 5322 simplificado |
| DOI | Regex Crossref `^10\.\d{4,9}/[-._;()/:A-Za-z0-9]+$` |
| Cuerpo | Por tipo: Artículo 3500-7000, Revisión 6000-10000, Reflexión 2000-5000 |
| Referencias | Por tipo: Artículo 15-60, Revisión 50-150, Reflexión 10-40 |

Ver el checklist completo en [VALIDATIONS.md](VALIDATIONS.md).

### Generación de PDF
- Layout profesional de revista científica con header bilingüe (logos EARL + UPDS)
- Sidebar con citación y datos editoriales
- Notas al pie nativas via WeasyPrint `float: footnote`
- Referencias en página separada
- Figuras con redimensionamiento custom (px exactos o presets %)
- Subnumeración automática de secciones (1, 1.1, 1.2, 2, ...)

---

## Estructura del proyecto

```
revistasupds/
├── backend/                    # FastAPI
│   ├── app/
│   │   ├── api/                # Routers (articles, generate-pdf)
│   │   ├── auth/               # JWT + Argon2 password hashing
│   │   ├── models/             # SQLAlchemy: User, Article (JSONB)
│   │   ├── pdf/                # WeasyPrint builder + logos
│   │   ├── config.py           # Settings (env vars)
│   │   └── database.py         # Async engine
│   ├── alembic/                # Migraciones
│   ├── Dockerfile              # Multi-stage, non-root user
│   └── requirements.txt
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/editor/  # Wizard panels + Tiptap nodes
│   │   ├── lib/validations.js  # Centralized validation rules
│   │   ├── pages/              # Login, Register, Dashboard, Editor
│   │   └── stores/             # Zustand: auth, article
│   ├── nginx.conf              # SPA routing + /api proxy
│   └── Dockerfile              # Multi-stage build → nginx
│
├── nginx/
│   └── earl.conf               # Reverse proxy del VPS host (SSL, headers, rate limit)
│
├── compose.yaml                # Docker Compose (desarrollo)
├── compose.production.yaml     # Overrides de producción
├── .env.example                # Variables de entorno
└── VALIDATIONS.md              # Checklist completo de validaciones
```

---

## Uso local

### Requisitos
- Docker + Docker Compose
- Puerto 5173 (frontend), 8000 (backend), 5433 (postgres) libres

### Levantar el proyecto

```bash
# Clonar
git clone https://github.com/tunek12421/revistasupds.git
cd revistasupds

# Levantar todos los servicios
docker compose up -d

# Crear las tablas de la BD (primera vez)
docker compose exec backend python -c "
import asyncio
from app.database import engine, Base
from app.models import User, Article
async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(init())
"
```

Acceder a:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000
- **Swagger docs**: http://localhost:8000/docs

### Detener

```bash
docker compose down
```

---

## Deploy en VPS (producción)

### 1. Preparar el VPS
- Docker + Docker Compose instalados
- Nginx ya corriendo en el host
- Dominio apuntando al VPS
- Certbot para SSL

### 2. Clonar y configurar

```bash
git clone https://github.com/tunek12421/revistasupds.git
cd revistasupds
cp .env.example .env
# Editar .env con secrets reales (SECRET_KEY, POSTGRES_PASSWORD, CORS_ORIGINS)
```

### 3. Levantar contenedores

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

### 4. Configurar Nginx del host

```bash
sudo cp nginx/earl.conf /etc/nginx/sites-available/earl
# Editar el archivo: cambiar yourdomain.com por tu dominio
sudo ln -s /etc/nginx/sites-available/earl /etc/nginx/sites-enabled/
sudo certbot --nginx -d tudominio.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## Hardening de seguridad

- **CORS** restringido a origins configurados
- **Rate limiting** en Nginx (10 req/s para `/api`)
- **Security headers**: HSTS, CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy
- **PostgreSQL** sin puerto expuesto al exterior (solo red interna Docker)
- **Contenedores non-root** (usuario `appuser` UID 1000)
- **JWT con Argon2** para hashing de passwords
- **WeasyPrint ≥ 68.0** (parche SSRF CVE-2025-68616)
- **Validación Pydantic** server-side en todos los endpoints
- **HTTPS obligatorio** con redirect 301 en Nginx host

---

## Licencia

UPDS — Universidad Privada Domingo Savio
