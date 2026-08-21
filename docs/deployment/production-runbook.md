# Production runbook

Run these commands as the dedicated deployment user from `/opt/setu`.

## Verify

```bash
docker compose --env-file .env -f compose.prod.yml ps
./scripts/smoke-test.sh
docker compose --env-file .env -f compose.prod.yml logs --tail=200 api
```

## Manual deploy

Only deploy an immutable SHA image that has passed CI and staging:

```bash
./scripts/deploy.sh <40-character-commit-sha>
```

The script takes a backup before migration. If the backup, image pull, migration,
or smoke test fails, treat the deployment as failed. A health failure attempts an
application-image rollback when prior metadata exists.

## Roll back application containers

```bash
./scripts/rollback.sh
```

This returns application containers to the previous recorded SHA and performs
smoke validation. It does **not** reverse Prisma migrations. For an incompatible
schema change, restore a verified backup or deploy a forward fix according to the
incident plan.

## Restart and logs

```bash
docker compose --env-file .env -f compose.prod.yml restart api
docker compose --env-file .env -f compose.prod.yml logs -f --tail=200 caddy api
```

Check disk usage before and after incidents: `docker system df`, `df -h`, and
the backup/MinIO/PostgreSQL volume paths. Do not use `docker system prune` or
volume deletion without a reviewed recovery plan.

## Provider and insurance safety controls

Provider integrations and all insurance capabilities remain controlled by their
existing production flags. A deployment never enables them. To disable a
provider, use the existing authenticated admin operations flow and audit trail.
To stop insurance functionality, use the documented feature flags and restart
the API only after the approved incident decision.

## Certificate issues

Confirm DNS points at the server, ports 80/443 are reachable, and Caddy logs do
not show an ACME failure. Do not delete Caddy's data volume casually; it holds
certificate state and unnecessary deletion can trigger certificate rate limits.
