# Docker

`../../docker-compose.yml` is deliberately local-development-only. It exposes
PostgreSQL and Redis for `pnpm dev` on a developer machine.

`docker-compose.production.yml` is the canonical self-hosted Linux deployment
stack. It runs Caddy, web, admin, API, PostgreSQL, Redis, and private MinIO on
isolated networks. Only Caddy publishes ports 80 and 443. Application images
are pulled from GHCR using an immutable Git SHA; production servers do not
build source code.

Copy `../../.env.production.example` to `/opt/setu/.env`, then copy the three
application templates in this directory to `/opt/setu/api.env`,
`/opt/setu/web.env`, and `/opt/setu/admin.env`. See
`../../docs/deployment/self-hosted.md` for the required server setup and
operational commands.
