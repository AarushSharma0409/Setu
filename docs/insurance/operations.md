# Insurance operations

Sprint I7 adds a feature-gated, MFA-protected operations boundary at
`/api/v1/admin/insurance/operations`. It is disabled by default. Operations
actions use insurance domain services; they do not expose direct database
editing.

The dashboard uses bounded, server-side time windows (1 hour, 24 hours, 7
days, or 30 days) and reports quote, provider, handoff, callback, and
configuration-warning counts. It intentionally does not report invented
latency percentiles or SLA percentages.

Manual actions require an explicit reason, a dedicated permission, an active
MFA-backed admin token, and audit logging. `SUPER_ADMIN` has remediation
permissions. `OPERATIONS` and `REVIEWER` receive only the documented
read-only permissions.

Required flags:

```text
INSURANCE_FEATURE_ENABLED=true
INSURANCE_ADMIN_ENABLED=true
INSURANCE_OPERATIONS_ENABLED=true
```

Read-only visibility is independent from the separate retry and callback
reprocess flags. See the focused runbooks for action-specific controls.
