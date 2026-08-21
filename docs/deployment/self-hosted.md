# Self-hosted production deployment

Setu production is designed for a self-hosted Linux server running Docker
Compose. GitHub Actions validates code, builds immutable commit-SHA images,
publishes them to GitHub Container Registry (GHCR), and invokes the server-side
deployment script over SSH. The server pulls images; it never builds application
source.

## Architecture

```text
Internet -> Caddy (80/443) -> web, admin, API, signed-object endpoint
                                  |      |    |         |
                             PostgreSQL Redis MinIO ----+
```

`infrastructure/docker/docker-compose.production.yml` creates an isolated
`setu-network`. Caddy is the only service that publishes host ports. PostgreSQL,
Redis, MinIO, and the Node application ports have no host port mappings.

The public and admin hosts also proxy `/api/*` internally. This allows the web
applications to use the stable runtime-safe value `NEXT_PUBLIC_API_URL=/api/v1`
while retaining the separate API hostname for integrations and health checks.

## Server layout

Use a dedicated deployment user such as `setu-deploy`, not `root`, and prepare:

```text
/opt/setu/
  compose.prod.yml
  Caddyfile
  .env
  api.env
  web.env
  admin.env
  scripts/
  backups/postgres/
  releases/
  runtime/
```

Copy the Compose file, Caddyfile, and scripts from `infrastructure/` during the
initial server bootstrap. Keep `/opt/setu/.env`, `api.env`, `web.env`, and
`admin.env` owned by the deployment user with mode `600`.

## Environment files

Start from `.env.production.example` and the three application templates under
`infrastructure/docker/`. Never commit the resulting server files.

The Compose environment contains domains, GHCR owner, image tag, database and
Redis credentials, MinIO credentials, deployment paths, and smoke-test URLs.
`api.env` contains API secrets and feature flags; `web.env` and `admin.env`
contain only runtime values needed by their applications. MinIO credentials are
injected into the API container as the standard S3-compatible variables.

Production validation rejects local storage, local CORS origins, known local
secrets, development fixtures, and insurance feature activation without the
explicit production approval flag.

## DNS and TLS

Create DNS A/AAAA records for the configured `PUBLIC_DOMAIN`, `ADMIN_DOMAIN`,
`API_DOMAIN`, and `STORAGE_DOMAIN`, all pointing to the server before starting
Caddy. Caddy obtains
and renews certificates automatically. Do not put a CDN or an HTTP-only proxy in
front of Caddy until its TLS mode and forwarded-header behaviour are configured
deliberately.

Use an email address in `CADDY_EMAIL` that can receive certificate notices.
The admin domain remains separate, keeps its noindex/robots protections, and
continues to require the existing MFA-backed admin authentication.

## First deployment

1. Complete [server bootstrap](server-bootstrap.md), DNS, and firewall setup.
2. Create `/opt/setu`, copy the production Compose/Caddy/script files, and run
   `chmod 700 /opt/setu/scripts/*.sh`.
3. Create `.env`, `api.env`, `web.env`, and `admin.env` from the templates;
   set strong unique credentials and production URLs.
4. Authenticate the server to GHCR with a package-read-only credential.
5. Validate configuration:

   ```bash
   cd /opt/setu
   docker compose --env-file .env -f compose.prod.yml config -q
   ```

6. Run `/opt/setu/scripts/deploy.sh <40-character-commit-sha>`.
7. Confirm the smoke test, HTTPS, and intended feature flags. Insurance stays
   disabled unless a separate approved release intentionally enables it.

## GitHub Actions configuration

The pipeline has three stages:

1. `CI` validates every push and pull request.
2. `Container images` builds immutable API, web, and admin images on pushes to
   `main`, then publishes them to GitHub Container Registry (GHCR).
3. `Deploy production` is manually started from the Actions tab with the exact
   40-character commit SHA produced by the image build. Protect the GitHub
   `production` environment and require an approval before this job can use its
   secrets.

Create a repository Actions variable (not a secret):

| Name                     | Value                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`        | The public HTTPS URL, for example `https://setu.example.com`                           |
| `GOOGLE_OAUTH_CLIENT_ID` | The public Google Identity Services web-client ID, if public Google sign-in is enabled |

Create the following secrets in the `production` GitHub environment:

| Name                     | Purpose                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| `DEPLOY_HOST`            | Server public IP address or hostname                                          |
| `DEPLOY_PORT`            | SSH port, normally `22`                                                       |
| `DEPLOY_USER`            | Dedicated deployment account, for example `setu-deploy`                       |
| `DEPLOY_PATH`            | `/opt/setu` unless you chose a different server location                      |
| `DEPLOY_SSH_PRIVATE_KEY` | Private key whose public counterpart is authorized for the deployment user    |
| `DEPLOY_KNOWN_HOSTS`     | Pinned `ssh-keyscan -H <server>` output; never use disabled host verification |
| `GHCR_PULL_USERNAME`     | GitHub account or machine-user name with package read access                  |
| `GHCR_PULL_TOKEN`        | Fine-grained token with read-only access to the Setu container packages       |

Store all runtime application secrets only in the protected files on the server
(`.env`, `api.env`, `web.env`, and `admin.env`); do not add them to GitHub
Actions. The pipeline only needs SSH access and a read-only GHCR token.

## Routine deployment

The staging workflow deploys the SHA emitted by the successful `Container
images` workflow. Production is manual and protected by the GitHub `production`
environment. It calls the same server-side script with the already-published
SHA, which:

1. validates Compose and records the prior image tag;
2. starts private dependencies and provisions the private MinIO bucket;
3. creates a verified PostgreSQL backup;
4. pulls API, web, and admin images by immutable SHA;
5. runs `prisma migrate deploy` using the pulled API image;
6. updates the Compose stack and smoke-tests public, insurance, API readiness,
   and the admin login shell;
7. records deployment metadata or rolls application containers back if health
   validation fails.

Never use `prisma migrate dev`, `prisma migrate reset`, `docker compose down -v`,
or a mutable `latest` image tag in production.

## Backup and object storage

`scripts/backup-postgres.sh` writes compressed custom-format PostgreSQL dumps,
checks they are non-empty, and retains the newest
`POSTGRES_BACKUP_RETENTION_COUNT` files. Default retention is 14 deployment
backups and must be adjusted to the organisation's legal requirements.

Backups are now required to leave the server. Configure the `OFFSITE_*` values
in `.env`; `deploy.sh` runs both `backup-postgres.sh` and `backup-minio.sh` and
fails before deployment if the off-server copy cannot be made. The PostgreSQL
script uploads the compressed dump with the configured S3 server-side
encryption. The MinIO script uses the `minio-init` image's `mc` client to mirror
the private bucket to a separate S3-compatible account and timestamped prefix.
Test both copies by restoring them into an isolated recovery environment at
least quarterly. MinIO data is independent of PostgreSQL: restore object data
and database metadata together. The MinIO console is never exposed. Caddy
proxies only the S3 API at `STORAGE_DOMAIN`; the bucket stays private and access
is granted by short-lived signed URLs generated with that public endpoint.

## Monitoring and logs

Docker JSON logs rotate using `DOCKER_LOG_MAX_SIZE` and
`DOCKER_LOG_MAX_FILES`. Install the repository systemd monitor and configure an
external uptime check. Monitor CPU, memory, filesystem capacity, certificate
expiry, container health, PostgreSQL, Redis, MinIO, backup freshness, and API
readiness. Pay particular attention to Docker, PostgreSQL, MinIO, and backup
volumes. Uptime Kuma or an existing monitoring platform is sufficient initially;
this repository does not introduce a mandatory monitoring stack.

## Security baseline

- Allow only SSH, HTTP, and HTTPS at the firewall; restrict SSH to trusted
  networks where possible.
- Do not expose 5432, 6379, 9000, 9001, 3000, 3001, or 4000 as host ports.
  The only object-storage route is the TLS-protected Caddy endpoint for private,
  signed S3 access.
- Use a dedicated SSH deployment user, key authentication, and a pinned
  `known_hosts` entry. The workflows never use `StrictHostKeyChecking=no`.
- Give the GHCR server credential package-read permission only.
- Do not print secrets, enable `set -x`, or store secrets in images, Compose,
  GitHub workflow files, or the repository.

See [production runbook](production-runbook.md) for normal operations and
[restore](restore.md) for an incident restore.
