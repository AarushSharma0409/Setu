#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${SETU_DEPLOY_ROOT:-/opt/setu}"
COMPOSE_FILE="${SETU_COMPOSE_FILE:-$DEPLOY_ROOT/compose.prod.yml}"
ENV_FILE="${SETU_ENV_FILE:-$DEPLOY_ROOT/.env}"

[[ -r "$ENV_FILE" ]] || { echo "Production environment file is not readable: $ENV_FILE" >&2; exit 1; }
[[ -r "$COMPOSE_FILE" ]] || { echo "Production Compose file is not readable: $COMPOSE_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

backup_dir="${POSTGRES_BACKUP_DIR:-$DEPLOY_ROOT/backups/postgres}"
retention_count="${POSTGRES_BACKUP_RETENTION_COUNT:-14}"
[[ "$retention_count" =~ ^[1-9][0-9]*$ ]] || { echo "POSTGRES_BACKUP_RETENTION_COUNT must be a positive integer" >&2; exit 1; }

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

umask 077
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
target="$backup_dir/setu-$timestamp.dump.gz"
temporary="$target.partial"

compose exec -T postgres sh -ec 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' | gzip -c > "$temporary"
[[ -s "$temporary" ]] || { rm -f "$temporary"; echo "PostgreSQL backup is empty" >&2; exit 1; }
mv "$temporary" "$target"

if [[ "${OFFSITE_BACKUP_REQUIRED:-true}" == "true" ]]; then
  : "${OFFSITE_POSTGRES_BACKUP_S3_URI:?set OFFSITE_POSTGRES_BACKUP_S3_URI}"
  command -v aws >/dev/null 2>&1 || { echo "aws CLI is required for off-server PostgreSQL backups" >&2; exit 1; }
  s3_target="${OFFSITE_POSTGRES_BACKUP_S3_URI%/}/$(basename "$target")"
  aws_args=(s3 cp "$target" "$s3_target" --only-show-errors)
  if [[ -n "${OFFSITE_POSTGRES_S3_SSE:-}" ]]; then
    aws_args+=(--sse "$OFFSITE_POSTGRES_S3_SSE")
  fi
  if [[ -n "${OFFSITE_POSTGRES_S3_SSE_KMS_KEY_ID:-}" ]]; then
    aws_args+=(--sse-kms-key-id "$OFFSITE_POSTGRES_S3_SSE_KMS_KEY_ID")
  fi
  aws "${aws_args[@]}"
  printf 'Uploaded off-server PostgreSQL backup to %s\n' "$s3_target"
fi

mapfile -t backups < <(find "$backup_dir" -maxdepth 1 -type f -name 'setu-*.dump.gz' -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)
if (( ${#backups[@]} > retention_count )); then
  for expired_backup in "${backups[@]:retention_count}"; do
    rm -f -- "$expired_backup"
  done
fi

printf '%s\n' "$target"
