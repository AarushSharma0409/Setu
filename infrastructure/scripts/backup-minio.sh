#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${SETU_DEPLOY_ROOT:-/opt/setu}"
COMPOSE_FILE="${SETU_COMPOSE_FILE:-$DEPLOY_ROOT/compose.prod.yml}"
ENV_FILE="${SETU_ENV_FILE:-$DEPLOY_ROOT/.env}"
[[ -r "$ENV_FILE" && -r "$COMPOSE_FILE" ]] || { echo "Production configuration is missing" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ "${OFFSITE_BACKUP_REQUIRED:-true}" != "true" ]]; then
  echo "Off-server backup is disabled; refusing to run object-storage backup" >&2
  exit 1
fi
: "${OFFSITE_MINIO_ENDPOINT:?set OFFSITE_MINIO_ENDPOINT}"
: "${OFFSITE_MINIO_ACCESS_KEY:?set OFFSITE_MINIO_ACCESS_KEY}"
: "${OFFSITE_MINIO_SECRET_KEY:?set OFFSITE_MINIO_SECRET_KEY}"
: "${OFFSITE_MINIO_BUCKET:?set OFFSITE_MINIO_BUCKET}"
: "${MINIO_BUCKET:?set MINIO_BUCKET}"

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }
timestamp="$(date -u +%Y-%m-%dT%H%M%SZ)"

compose run --rm --no-deps \
  -e OFFSITE_MINIO_ENDPOINT \
  -e OFFSITE_MINIO_ACCESS_KEY \
  -e OFFSITE_MINIO_SECRET_KEY \
  -e OFFSITE_MINIO_BUCKET \
  -e OFFSITE_MINIO_PREFIX="${OFFSITE_MINIO_PREFIX:-setu-object-storage}" \
  -e BACKUP_TIMESTAMP="$timestamp" \
  minio-init /bin/sh -ec '
    mc alias set source http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
    mc alias set offsite "$OFFSITE_MINIO_ENDPOINT" "$OFFSITE_MINIO_ACCESS_KEY" "$OFFSITE_MINIO_SECRET_KEY" >/dev/null
    mc mb --ignore-existing "offsite/$OFFSITE_MINIO_BUCKET" >/dev/null
    mc version enable "offsite/$OFFSITE_MINIO_BUCKET" >/dev/null 2>&1 || true
    mc mirror --overwrite --preserve "source/$MINIO_BUCKET" "offsite/$OFFSITE_MINIO_BUCKET/$OFFSITE_MINIO_PREFIX/$BACKUP_TIMESTAMP"
  '

printf 'Uploaded MinIO object backup to %s/%s/%s\n' "$OFFSITE_MINIO_ENDPOINT" "$OFFSITE_MINIO_BUCKET" "${OFFSITE_MINIO_PREFIX:-setu-object-storage}/$timestamp"
