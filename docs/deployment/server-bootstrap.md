# Server bootstrap

This guide prepares a fresh self-hosted Linux production server. It intentionally
does not assume a particular Linux distribution; use your distribution's official
Docker Engine and Docker Compose plugin installation instructions.

## Requirements

- A supported Linux server with capacity for PostgreSQL, Redis, MinIO, Docker
  images, logs, and retained backups.
- Docker Engine and the Docker Compose plugin.
- `curl`, OpenSSH client utilities, and a firewall tool such as `ufw` or
  `firewalld`.
- DNS control for public, admin, and API hostnames.
- A dedicated non-root deployment user (for example `setu-deploy`) that belongs
  to the `docker` group only after the operational risk of Docker-group access
  is understood.

## Bootstrap steps

1. Apply operating-system security updates and create `setu-deploy` with an SSH
   key. Disable password SSH and root SSH login when your access plan supports
   it.
2. Install Docker Engine and `docker compose`; verify with:

   ```bash
   docker --version
   docker compose version
   ```

3. Create `/opt/setu` and its required subdirectories, owned by `setu-deploy`.
4. Install the Compose file as `/opt/setu/compose.prod.yml`, the Caddyfile as
   `/opt/setu/Caddyfile`, and the deployment scripts under `/opt/setu/scripts`.
5. Create production environment files from the repository templates. Run
   `chmod 600 /opt/setu/.env /opt/setu/api.env /opt/setu/web.env /opt/setu/admin.env`
   and `chmod 700 /opt/setu/scripts/*.sh`.
6. Create DNS records and configure the firewall. Public inbound ports are 80
   and 443. SSH is normally 22 but should be restricted. Do not allow database,
   Redis, MinIO, or internal application ports.
7. Add a pinned server host key to the GitHub environment secret
   `DEPLOY_KNOWN_HOSTS`. Do not rely on disabled SSH verification.
8. Create a minimum-privilege GHCR package-read token on the server and log in
   once, or let the deployment workflow provide it through standard input.
9. Validate the deployment files with `docker compose --env-file .env -f
compose.prod.yml config -q`, then perform the first deployment.

## Staging on the same server

Staging is optional. If it shares a server, it must use a separate Compose
project, domains, `.env` files, PostgreSQL volume/database, Redis instance or
namespace, MinIO bucket/volume, backup path, and secrets. It must never share
the production PostgreSQL data directory or credentials.
