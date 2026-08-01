# Operations guide

## Health

- `GET /api/v1/health/live` checks only process liveness.
- `GET /api/v1/health/ready` checks PostgreSQL and Redis with bounded probes.
- `GET /api/v1/health` returns aggregate dependency state.

Every response includes an `X-Request-Id` (or preserves a validated incoming
ID). Logs are JSON-shaped and omit tokens, passwords, message bodies, and
signed URLs. The exception filter returns a generic 5xx body in production.

## Recommended alerts

- Readiness failures for more than two consecutive checks
- API 5xx rate above the normal baseline
- Repeated refresh-token reuse detections
- Admin login/MFA lockouts
- Upload orphan-detection events
- Redis rate-limit errors
- Database connection exhaustion or migration failure

Retain production logs according to the deployment platform policy and remove
request data that is not needed for incident response.
