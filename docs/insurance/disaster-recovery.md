# Insurance disaster recovery procedure

The repository defines no production RPO/RTO because no production platform is
configured. Before launch, the accountable operator must set and test them.

For a database outage: disable insurance feature flags, restore the latest
verified backup to an isolated environment, run Prisma validation, verify a
representative encrypted assessment can be decrypted, then promote through the
approved deployment process. For Redis loss: treat rate limiting/session-adjacent
features as degraded; production rate limiting fails closed. For a provider
outage or suspected compromise: suspend the integration/kill switch, preserve
safe event metadata, rotate credentials if needed, and communicate that no
purchase completion is inferred from a redirect.

All recovery drills must be recorded with timestamp, operator, backup source,
data-loss window, verification evidence, and follow-up actions. This sprint did
not execute a backup restore or production disaster-recovery simulation.
