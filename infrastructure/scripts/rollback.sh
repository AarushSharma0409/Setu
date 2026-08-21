#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${SETU_DEPLOY_ROOT:-/opt/setu}"
COMPOSE_FILE="${SETU_COMPOSE_FILE:-$DEPLOY_ROOT/compose.prod.yml}"
ENV_FILE="${SETU_ENV_FILE:-$DEPLOY_ROOT/.env}"
SCRIPTS_DIR="${SETU_SCRIPTS_DIR:-$DEPLOY_ROOT/scripts}"
RELEASE_DIR="${SETU_RELEASE_DIR:-$DEPLOY_ROOT/releases}"
CURRENT_FILE="$RELEASE_DIR/current.env"
PREVIOUS_FILE="$RELEASE_DIR/previous.env"

[[ -r "$ENV_FILE" && -r "$COMPOSE_FILE" && -r "$PREVIOUS_FILE" ]] || { echo "Rollback metadata or production configuration is missing" >&2; exit 1; }
previous_tag="$(sed -n 's/^SETU_IMAGE_TAG=//p' "$PREVIOUS_FILE" | head -n 1)"
[[ "$previous_tag" =~ ^[0-9a-f]{7,64}$ ]] || { echo "Previous image tag is invalid" >&2; exit 1; }

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }
export SETU_IMAGE_TAG="$previous_tag"
compose pull api web admin
compose up -d --remove-orphans
"$SCRIPTS_DIR/smoke-test.sh"

umask 077
cat > "$CURRENT_FILE" <<EOF
SETU_IMAGE_TAG=$previous_tag
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MIGRATIONS=not-rolled-back
EOF

printf 'Rolled application containers back to %s. Database migrations were not rolled back.\n' "$previous_tag"
