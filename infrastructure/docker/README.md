# Docker Development

The root `docker-compose.yml` owns Sprint 1 infrastructure:

- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- Persistent named volumes for both services

Application processes run outside Docker during local development.

Production-oriented Dockerfiles are provided for the API, public web, and
admin web in this directory. Build them from the repository root:

```bash
docker build -f infrastructure/docker/Dockerfile.api -t setu-api:latest .
docker build -f infrastructure/docker/Dockerfile.web -t setu-web:latest .
docker build -f infrastructure/docker/Dockerfile.admin -t setu-admin:latest .
```

`docker-compose.production.yml` is a deployment template. Supply production
environment files and secrets through the deployment platform; never commit
them or use the local compose credentials in production.

The API service includes a liveness health check. The public web and admin
services wait for that check before starting, which makes a staging smoke test
fail fast when API startup cannot complete. Run database migrations as a
separate deployment job before starting application services.
