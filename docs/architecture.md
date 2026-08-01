# Setu production architecture

Setu remains a modular monolith with three deployable applications:

- Public web: `apps/web` on the public web domain.
- Admin web: `apps/admin` on a separate restricted admin domain.
- API: `apps/api` behind TLS and an allowlisted CORS policy.

PostgreSQL is the source of truth. Redis provides health checks and the
principal/IP-aware rate-limit counters. Verification documents are written
through the private object-storage abstraction. The local adapter is for
development only; production must use a private S3-compatible bucket and a
malware-scanning pipeline.

The admin application is isolated at deployment time. The API still enforces
the admin audience, active account, role, permission, and MFA claim on every
protected admin request.
