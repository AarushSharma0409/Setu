# Deployment guide

## Repository release gate

Run this from the final release commit before building or publishing images:

```bash
pnpm release:verify
```

It performs formatting validation, Prisma client generation, separate uncached
workspace check and production-build phases, and a high-severity dependency
audit. Separating the check and build phases prevents Next.js build output from
changing while TypeScript reads its generated route types. A passing result
verifies repository artifacts only; the operational checklist in
`docs/launch-checklist.md` must also be completed and recorded for the target
environment.

Build the three applications from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @setu/api build
pnpm --filter @setu/web build
pnpm --filter @setu/admin build
```

Production containers are defined in `infrastructure/docker/` and use the
same workspace build. Set image tags and runtime environment values through a
secret manager or deployment platform; do not bake secrets into images.

Deploy the API privately behind TLS, expose only the public and admin web
domains, and allow only those origins in `CORS_ALLOWED_ORIGINS`. Keep the
admin hostname separate and apply gateway authentication/IP controls as an
additional layer. The application-level admin routes remain the authoritative
security boundary.

Run `pnpm db:migrate:deploy` once per release before starting the API. Verify
`/api/v1/health/live` and `/api/v1/health/ready`, then run the non-destructive
smoke procedure in `docs/smoke-test.md`.
