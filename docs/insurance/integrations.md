# Provider integrations

Sprint I6 keeps provider-specific protocols behind `InsuranceProviderAdapter` and `ProviderAdapterRegistry`. An integration record is environment-scoped and stores only an HTTPS endpoint, capability declarations, timeout/retry policy, and an optional managed-secret reference. It never stores secret values, provider access tokens, request bodies, or response bodies.

The repository has no approved insurer or broker contract. `SETU_MOCK` is an offline test adapter only; it makes no network calls and must not be represented as an insurer integration. Real providers require an approved contract, sandbox credentials in a secret manager, an adapter implementation, mapping fixtures, and security review before activation.

Integration activation requires an active organization with a valid licence, a managed credential reference, an active mapping, purchase-handoff capability, a supported adapter, and a successful safe health check.
