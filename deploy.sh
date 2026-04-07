#!/usr/bin/env bash
#
# Deploy script para EARL
#
# Construye la(s) imagen(es) sin cache, las exporta como tarball,
# las sube al VPS via scp y reinicia los contenedores.
#
# Uso:
#   source .deploy.env && ./deploy.sh             # frontend + backend
#   source .deploy.env && ./deploy.sh frontend    # solo frontend
#   source .deploy.env && ./deploy.sh backend     # solo backend
#
# Variables de entorno REQUERIDAS (ver .deploy.env.example):
#   VPS_HOST          IP o dominio del VPS
#   VPS_USER          Usuario SSH
#   VPS_PROJECT_DIR   Directorio del proyecto en el VPS
#   IMAGE_PREFIX      Prefix de las imágenes (ej: ghcr.io/tu_usuario)
#
# Variables OPCIONALES:
#   SSHPASS           Password SSH (si no usas llave). Requiere `sshpass`.
#                     RECOMENDADO: usar llave SSH (ssh-copy-id) en vez de password.
#

set -euo pipefail

# Required variables - fail loudly if missing
: "${VPS_HOST:?ERROR: Define VPS_HOST. Crea .deploy.env basado en .deploy.env.example}"
: "${VPS_USER:?ERROR: Define VPS_USER. Crea .deploy.env basado en .deploy.env.example}"
: "${VPS_PROJECT_DIR:?ERROR: Define VPS_PROJECT_DIR. Crea .deploy.env basado en .deploy.env.example}"

COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yaml}"
# Image prefix must match the image name in compose.production.yaml on the VPS
: "${IMAGE_PREFIX:?ERROR: Define IMAGE_PREFIX. Ej: IMAGE_PREFIX=ghcr.io/tu_usuario}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TARGET="${1:-all}"
case "$TARGET" in
    frontend|backend|all) ;;
    *)
        echo "Uso: $0 [frontend|backend|all]" >&2
        exit 1
        ;;
esac

# Detecta si usar sshpass o ssh con llave
if [[ -n "${SSHPASS:-}" ]]; then
    if ! command -v sshpass >/dev/null 2>&1; then
        echo "ERROR: SSHPASS está definido pero sshpass no está instalado" >&2
        exit 1
    fi
    SSH_CMD=(sshpass -e ssh -o ConnectTimeout=30)
    SCP_CMD=(sshpass -e scp -o ConnectTimeout=30)
else
    SSH_CMD=(ssh -o ConnectTimeout=30)
    SCP_CMD=(scp -o ConnectTimeout=30)
fi

deploy_service() {
    local service="$1"
    local image="${IMAGE_PREFIX}/earl-${service}:latest"
    local tarfile="/tmp/earl-${service}.tar.gz"

    echo ""
    echo "============================================"
    echo " Deploying: ${service}"
    echo "============================================"

    if [[ ! -d "./${service}" ]]; then
        echo "ERROR: directorio ./${service} no existe" >&2
        exit 1
    fi

    echo "[1/5] Construyendo imagen (sin cache)..."
    docker build --no-cache -t "$image" "./${service}"

    echo "[2/5] Exportando imagen a ${tarfile}..."
    docker save "$image" | gzip > "$tarfile"
    local size
    size=$(du -h "$tarfile" | cut -f1)
    echo "       Tamaño: ${size}"

    echo "[3/5] Subiendo al VPS (${VPS_USER}@${VPS_HOST})..."
    "${SCP_CMD[@]}" "$tarfile" "${VPS_USER}@${VPS_HOST}:/tmp/"

    echo "[4/5] Cargando imagen y reiniciando contenedor..."
    "${SSH_CMD[@]}" "${VPS_USER}@${VPS_HOST}" "
        set -e
        docker load < ${tarfile}
        cd ${VPS_PROJECT_DIR}
        docker compose -f ${COMPOSE_FILE} up -d ${service}
        rm -f ${tarfile}
    "

    echo "[5/5] Verificando health del contenedor..."
    sleep 5
    local health
    health=$("${SSH_CMD[@]}" "${VPS_USER}@${VPS_HOST}" "cd ${VPS_PROJECT_DIR} && docker compose -f ${COMPOSE_FILE} ps --format '{{.Status}}' ${service}")
    if [[ "$health" == *"Up"* ]]; then
        echo "       OK -> ${service} corriendo: $health"
    else
        echo "       WARNING -> ${service} estado: $health" >&2
    fi

    rm -f "$tarfile"
    echo "OK -> ${service} desplegado"
}

if [[ "$TARGET" == "all" || "$TARGET" == "frontend" ]]; then
    deploy_service frontend
fi

if [[ "$TARGET" == "all" || "$TARGET" == "backend" ]]; then
    deploy_service backend
fi

echo ""
echo "============================================"
echo " Deploy completado"
echo "============================================"
