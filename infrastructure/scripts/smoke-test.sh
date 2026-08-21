#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${SETU_DEPLOY_ROOT:-/opt/setu}"
ENV_FILE="${SETU_ENV_FILE:-$DEPLOY_ROOT/.env}"
[[ -r "$ENV_FILE" ]] || { echo "Production environment file is not readable: $ENV_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${SMOKE_PUBLIC_URL:?set SMOKE_PUBLIC_URL}"
: "${SMOKE_ADMIN_URL:?set SMOKE_ADMIN_URL}"
: "${SMOKE_API_URL:?set SMOKE_API_URL}"

check() {
  local name="$1"
  local url="$2"
  curl --fail --silent --show-error --location --max-time 20 "$url" >/dev/null
  printf 'PASS %s\n' "$name"
}

check "public homepage" "$SMOKE_PUBLIC_URL"
check "insurance landing" "$SMOKE_PUBLIC_URL/insurance"
check "API readiness" "$SMOKE_API_URL/health/ready"
check "admin login shell" "$SMOKE_ADMIN_URL"
