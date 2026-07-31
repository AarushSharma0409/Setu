# Docker Development

The root `docker-compose.yml` owns Sprint 1 infrastructure:

- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- Persistent named volumes for both services

Application processes run outside Docker during local development.
