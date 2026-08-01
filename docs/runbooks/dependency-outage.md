# Dependency outage runbook

If readiness fails, inspect PostgreSQL and Redis separately. Liveness should
remain available while either dependency is unavailable. Redis rate-limit
errors must be surfaced and monitored; do not silently disable limits in
production. Restore the dependency, verify readiness, then run a read-only
smoke test. Do not reset databases or volumes during an incident.
