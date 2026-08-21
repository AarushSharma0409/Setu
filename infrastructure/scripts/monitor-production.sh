#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${SETU_DEPLOY_ROOT:-/opt/setu}"
ENV_FILE="${SETU_ENV_FILE:-$DEPLOY_ROOT/.env}"
STATE_FILE="${MONITOR_STATE_FILE:-$DEPLOY_ROOT/runtime/monitor.state}"
[[ -r "$ENV_FILE" ]] || { echo "Production environment file is not readable: $ENV_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${SMOKE_PUBLIC_URL:?set SMOKE_PUBLIC_URL}"
: "${SMOKE_ADMIN_URL:?set SMOKE_ADMIN_URL}"
: "${SMOKE_API_URL:?set SMOKE_API_URL}"

failures=()
check() {
  local name="$1" url="$2"
  if ! curl --fail --silent --show-error --location --max-time "${MONITOR_HTTP_TIMEOUT_SECONDS:-15}" "$url" >/dev/null; then
    failures+=("$name")
  fi
}

check "public" "$SMOKE_PUBLIC_URL"
check "admin" "$SMOKE_ADMIN_URL"
check "api-readiness" "$SMOKE_API_URL/health/ready"

mkdir -p "$(dirname "$STATE_FILE")"
previous="$(cat "$STATE_FILE" 2>/dev/null || true)"
if (( ${#failures[@]} > 0 )); then
  current="DOWN:${failures[*]}"
  printf '%s\n' "$current" > "$STATE_FILE"
  if [[ "$current" != "$previous" && -n "${ALERT_WEBHOOK_URL:-}" ]]; then
    message="Setu production check failed: ${failures[*]}"
    curl --fail --silent --show-error --max-time 15 \
      -H 'content-type: application/json' \
      --data "{\"text\":\"$message\"}" \
      "$ALERT_WEBHOOK_URL" >/dev/null || true
  fi
  printf 'FAIL %s\n' "$current" >&2
  exit 1
fi

printf '%s\n' "UP" > "$STATE_FILE"
if [[ "$previous" == DOWN:* && -n "${ALERT_WEBHOOK_URL:-}" ]]; then
  curl --fail --silent --show-error --max-time 15 \
    -H 'content-type: application/json' \
    --data '{"text":"Setu production checks recovered"}' \
    "$ALERT_WEBHOOK_URL" >/dev/null || true
fi
echo "PASS production checks"
