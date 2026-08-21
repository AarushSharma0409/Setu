# PostgreSQL and MinIO restore

## PostgreSQL

1. Declare an incident and stop application writes.
2. Confirm the selected backup belongs to the correct environment and is intact.
3. Keep a copy of the current database and current backup files before changing
   anything.
4. Run, as the deployment user:

   ```bash
   /opt/setu/scripts/restore-postgres.sh /opt/setu/backups/postgres/setu-<timestamp>.dump.gz
   ```

   The script stops web, admin, API, and Caddy; restores with `pg_restore
--clean --if-exists`; starts the services; then runs the smoke test.

5. Check Prisma migration state, application logs, representative records, and
   API readiness before accepting writes.

Do not use `prisma migrate reset` in production. Application image rollback and
database restoration are separate actions.

## MinIO

PostgreSQL dumps do not contain documents. Restore MinIO from the independently
verified backup method used by your organisation, such as a volume snapshot,
`mc mirror`, replication, or an off-server copy. Restore to an isolated location
first where practical, verify bucket contents and access controls, then switch
or restore the production volume during an approved maintenance window.
