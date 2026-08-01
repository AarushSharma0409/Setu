# Backup and restore

## PostgreSQL

Create an encrypted logical backup using the deployment database credentials:

```bash
pg_dump --format=custom --file=setu-$(date +%Y%m%d-%H%M).dump "$DATABASE_URL"
```

Restore into an empty or approved recovery database, then apply the same
`prisma migrate deploy` command and verify `/api/v1/health/ready`.

```bash
createdb setu_recovery
pg_restore --clean --if-exists --dbname="$RECOVERY_DATABASE_URL" setu-YYYYMMDD-HHMM.dump
```

Do not run restore commands against production without an approved change
window. The repository does not claim a restore test has been completed.

## Object storage and Redis

Object storage must use bucket versioning/retention and a provider backup
policy. PostgreSQL metadata and object keys must be restored together. Redis
is cache/rate-limit state and is rebuilt after restore; it is not the source
of truth.
