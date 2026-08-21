#!/usr/bin/env bash
set -Eeuo pipefail

backup_file="${1:-}"
[[ -r "$backup_file" ]] || { echo "Usage: $0 <path-to-setu-*.dump.gz>" >&2; exit 64; }

DEPLOY_ROOT="${SETU_DEPLOY_ROOT:-/opt/setu}"
COMPOSE_FILE="${SETU_COMPOSE_FILE:-$DEPLOY_ROOT/compose.prod.yml}"
ENV_FILE="${SETU_ENV_FILE:-$DEPLOY_ROOT/.env}"
SCRIPTS_DIR="${SETU_SCRIPTS_DIR:-$DEPLOY_ROOT/scripts}"
[[ -r "$ENV_FILE" && -r "$COMPOSE_FILE" ]] || { echo "Production configuration is missing" >&2; exit 1; }

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

echo "Stopping application writes before restore"
compose stop api web admin caddy
gzip -dc -- "$backup_file" | compose exec -T postgres sh -ec 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner'
compose up -d api web admin caddy
"$SCRIPTS_DIR/smoke-test.sh"
echo "Restore completed. Validate Prisma migration state before accepting writes."
