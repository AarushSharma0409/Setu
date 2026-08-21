#!/usr/bin/env bash
set -Eeuo pipefail

image_tag="${1:-}"
[[ "$image_tag" =~ ^[0-9a-f]{7,64}$ ]] || { echo "Usage: $0 <immutable Git commit SHA>" >&2; exit 64; }

DEPLOY_ROOT="${SETU_DEPLOY_ROOT:-/opt/setu}"
COMPOSE_FILE="${SETU_COMPOSE_FILE:-$DEPLOY_ROOT/compose.prod.yml}"
ENV_FILE="${SETU_ENV_FILE:-$DEPLOY_ROOT/.env}"
SCRIPTS_DIR="${SETU_SCRIPTS_DIR:-$DEPLOY_ROOT/scripts}"
RELEASE_DIR="${SETU_RELEASE_DIR:-$DEPLOY_ROOT/releases}"
CURRENT_FILE="$RELEASE_DIR/current.env"
PREVIOUS_FILE="$RELEASE_DIR/previous.env"

[[ -r "$ENV_FILE" ]] || { echo "Production environment file is not readable: $ENV_FILE" >&2; exit 1; }
[[ -r "$COMPOSE_FILE" ]] || { echo "Production Compose file is not readable: $COMPOSE_FILE" >&2; exit 1; }
[[ -x "$SCRIPTS_DIR/backup-postgres.sh" ]] || { echo "Backup script is not executable" >&2; exit 1; }
[[ -x "$SCRIPTS_DIR/backup-minio.sh" ]] || { echo "MinIO backup script is not executable" >&2; exit 1; }
[[ -x "$SCRIPTS_DIR/smoke-test.sh" ]] || { echo "Smoke-test script is not executable" >&2; exit 1; }

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

mkdir -p "$RELEASE_DIR"
compose config -q

if [[ -f "$CURRENT_FILE" ]]; then
  cp "$CURRENT_FILE" "$PREVIOUS_FILE"
fi

export SETU_IMAGE_TAG="$image_tag"
compose up -d postgres redis minio
compose run --rm minio-init
"$SCRIPTS_DIR/backup-postgres.sh"
"$SCRIPTS_DIR/backup-minio.sh"
compose pull api web admin
compose run --rm --no-deps api pnpm --filter @setu/api db:deploy
compose up -d --remove-orphans

if ! "$SCRIPTS_DIR/smoke-test.sh"; then
  if [[ -f "$PREVIOUS_FILE" ]]; then
    "$SCRIPTS_DIR/rollback.sh" || true
  fi
  echo "Deployment health validation failed" >&2
  exit 1
fi

umask 077
cat > "$CURRENT_FILE" <<EOF
SETU_IMAGE_TAG=$image_tag
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MIGRATIONS=deployed
EOF

printf 'Deployed Setu image tag %s\n' "$image_tag"
