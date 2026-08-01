# Rollback procedure

1. Stop traffic at the gateway or deployment platform and record the incident.
2. Roll back application images to the last known-good version.
3. Roll back configuration only after reviewing secret and schema compatibility.
4. Verify liveness, readiness, authentication, and a read-only smoke test.
5. Do not destructively roll back Prisma migrations. Use a forward fix unless
   the migration owner has approved a tested reversal.
6. Restore traffic gradually and monitor 5xx, readiness, authentication, and
   rate-limit alerts.
