# Deployment guide

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
