# Insurance Sprint I7 handoff

I7 establishes the operations API, feature flags, read-only dashboard,
support lookup, evidence retrieval, and controlled use of existing provider
and handoff domain services. Configuration warnings are dynamic and bounded;
no large operations read-model table was added.

The next sprint can refine operation list/detail pages, action confirmations,
loading/empty/error states, responsive tables, keyboard workflows, and visual
consistency without changing the operations security boundary.

Before enabling remediation in production, add a real contracted provider
adapter with idempotent quote retry and callback replay, complete focused
integration tests, and validate the admin routes against a running PostgreSQL
and Redis environment.
