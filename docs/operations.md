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

## Availability checks and alerting

The repository includes `infrastructure/scripts/monitor-production.sh`. Install
`infrastructure/systemd/setu-monitor.service` and
`infrastructure/systemd/setu-monitor.timer` on the production server, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now setu-monitor.timer
systemctl list-timers setu-monitor.timer
```

The monitor checks the public site, admin login shell, and API readiness every
minute. It stores a small state file and sends one alert on a state transition
through `ALERT_WEBHOOK_URL`, followed by a recovery notification. Configure the
webhook in `/opt/setu/.env`; never put it in Git. A separate external uptime
monitor should check `https://<api-domain>/api/v1/health/ready` from outside the
server so a dead server is still observable.

## Incident ownership

Before launch, record named primary and secondary owners in the production
secret inventory and set `INCIDENT_OWNER`, `SECURITY_CONTACT`, and
`BACKUP_OWNER`. The primary owner acknowledges an alert within 15 minutes,
opens an incident record, protects evidence, communicates customer impact, and
documents the follow-up. The security contact owns suspected data exposure;
the backup owner owns restore verification and retention failures.
