# EARL — Formateador de Artículos Científicos

Formateador web para **Estudios Ambientales Revista Latinoamericana (EARL)** — UPDS.

## Deploy en Render.com

1. Sube este repositorio a GitHub
2. En [render.com](https://render.com) → New Web Service → conecta el repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
5. Plan: Free

## Uso local

```bash
pip install -r requirements.txt
python app.py
# Abrir http://localhost:5000
```

## Marcadores en el texto

- `[FIGURA 1]` — inserta Figura 1 en ese punto
- `[CUADRO 2]` — inserta Cuadro 2 en ese punto  
- `[GRÁFICO 3]` — inserta Gráfico 3 en ese punto
- `[fn]` — nota al pie (numeradas consecutivamente)
