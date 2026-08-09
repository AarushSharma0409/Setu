# Insurance staging deployment preparation

**Status:** Prepared for provisioning; no staging cloud resources have been
created from this workspace.

## What is already available

- Container definitions for the API, public web, and admin applications in
  [`infrastructure/docker`](../../infrastructure/docker).
- A production-oriented Compose template at
  [`docker-compose.production.yml`](../../infrastructure/docker/docker-compose.production.yml).
- A production environment validator that rejects local credentials, local
  storage, development fixtures, and unapproved insurance activation.
- API liveness and readiness endpoints at `/api/v1/health/live` and
  `/api/v1/health/ready`.
- A deployment-safe migration command: `pnpm db:migrate:deploy`.
- A CI container-image workflow that builds API, web, and admin images without
  pushing or deploying them.

The Compose file is a container smoke-test template. A real staging deployment
must use managed PostgreSQL and Redis, an external secret manager, private
object storage, HTTPS ingress, and restricted admin access; do not expose its
database or Redis services publicly.

## External choices required before provisioning

1. Select the cloud provider, staging region, and DNS domain.
2. Create separate staging PostgreSQL, Redis, object-storage, and secret-manager resources.
3. Choose the image registry and CI identity permitted to publish images.
4. Decide the admin-access boundary (VPN, identity-aware proxy, or equivalent).
5. Name the 2–3 initial policy types and their intended staging cohort.

## Staging configuration inventory

Store the following only in the staging secret manager. Do not place values in
the repository or browser environment files.

| Area           | Required configuration                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Runtime        | `NODE_ENV=production`, `API_PORT`, non-local `CORS_ALLOWED_ORIGINS`                                         |
| Data           | `DATABASE_URL`, `REDIS_URL`                                                                                 |
| Auth           | unique `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_AUTH_CHALLENGE_SECRET`, `ADMIN_2FA_ENCRYPTION_KEY` |
| Object storage | S3-compatible provider, bucket, region, endpoint where applicable, and scoped credentials                   |
| Insurance      | all feature flags initially `false`; `INSURANCE_PRODUCTION_APPROVED=false`                                  |
| Provider       | disabled flags and an empty allowlist until approved sandbox credentials and exact HTTPS hosts exist        |
| Frontends      | `NEXT_PUBLIC_API_URL` pointing to the staging API HTTPS URL; no API secrets                                 |

## Deployment sequence

1. Build and publish immutable images for API, web, and admin from the same
   reviewed commit. Record their image digests in
   [release-baseline.md](release-baseline.md).
2. Provision managed dependencies and configure secrets externally.
3. Deploy the API with every insurance feature flag disabled.
4. Run `pnpm db:migrate:deploy` as a one-off deployment job against the
   staging database. Never use `pnpm db:migrate` in staging.
5. Deploy web and admin with their staging API base URLs.
6. Restrict admin ingress before sharing its URL.
7. Verify HTTPS, liveness, readiness, graceful shutdown, and redacted logs.
8. Attach the evidence to [launch-checklist.md](launch-checklist.md).

## Local container check

The intended local image commands are:

```powershell
docker build -f infrastructure/docker/Dockerfile.api -t setu-api:staging-check .
docker build -f infrastructure/docker/Dockerfile.web -t setu-web:staging-check .
docker build -f infrastructure/docker/Dockerfile.admin -t setu-admin:staging-check .
```

On 2026-08-08, the API image build began successfully but did not complete
within the three-minute local verification window; no image or application
error was emitted. Re-run it where Docker has sufficient build time and
registry access, then record the image digest.
