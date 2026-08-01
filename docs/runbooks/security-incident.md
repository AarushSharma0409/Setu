# Security incident runbook

1. Record the incident, current request ID, time, affected principal, and
   deployment version.
2. Revoke affected public/admin sessions and rotate compromised secrets.
3. Restrict the admin gateway and disable the affected route or deployment.
4. Preserve redacted logs and audit entries; do not copy tokens or documents
   into tickets.
5. Review object-storage access logs and rotate storage credentials if needed.
6. Restore from a known-good image/configuration, verify readiness, and run the
   smoke test.
7. Document root cause, impact, remediation, and follow-up testing.
