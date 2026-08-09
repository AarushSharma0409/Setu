# Provider operations

Provider operations expose safe integration metadata, central health state,
and existing integration health checks. Credentials, secret references, and
raw provider payloads are never returned.

Suspension and reactivation call the integration domain service, require a
reason and dedicated super-admin permission, and retain historical records.
Health checks do not create a customer quote. A provider is never
auto-reactivated just because a check succeeds.
