# Security hardening and data handling

## Classification and minimization

`PUBLIC` includes approved product content. `PERSONAL` includes account and
contact details. `HEALTH_SENSITIVE` includes need-profile answers classified by
the question schema. `SECRET` includes passwords, access/refresh tokens, MFA
material, provider credentials, state tokens, webhook signatures, signed URLs,
and encryption keys. The application persists only assessment fields required
by the active schema; the browser keeps no assessment or quote content in web
storage. Short-lived access tokens are session-scoped; refresh credentials are
HttpOnly cookies and are never persisted by the frontends.

Health-sensitive answers are encrypted by the insurance sensitive-data service.
`INSURANCE_SENSITIVE_DATA_ENCRYPTION_KEY` and MFA encryption keys are API-only
environment values; production must source distinct 32-byte keys from a secret
manager, record a key version externally, re-encrypt records in batches during
rotation, validate decryptability, then retire the prior key. The repository
does not provide a production KMS/HSM or automatic key rotation.

## Redaction, cache, and audit controls

The API does not log request bodies. Central redaction removes values whose
keys indicate tokens, credentials, health answers, consents, signatures, or
state, and masks bearer strings and URL query strings in error text. Audit
metadata uses the same sanitizer. Audit records are written by services and
have no ordinary update/delete endpoint; they retain actor/action/entity,
request context, and safe metadata only.

Authenticated account, need-assessment, handoff-return, and all admin routes
emit `Cache-Control: no-store`. Insurance API client requests use `no-store`.
No insurance payload is saved to localStorage, sessionStorage, or IndexedDB;
only short-lived access tokens are held in sessionStorage by the established
bearer-token architecture.

## File and provider boundaries

Private insurance documents are validated for allowed MIME/extension/signature
and size, stored using non-guessable keys, and served only through short-lived
signed access. Malware scanning is an explicit production boundary, not a
claimed completed control. Provider credentials remain managed-secret
references, never values. Provider endpoints require HTTPS, an exact configured
host allowlist when enabled, and reject private, link-local, loopback, reserved,
credentialed, and fragment URLs. DNS rebinding remains a deployment concern:
production egress must be restricted to allowlisted DNS/IP destinations.

## Key incidents

On suspected credential or session compromise: disable affected feature flags,
rotate the secret manager value, revoke relevant session families, suspend the
provider integration if applicable, preserve redacted audit evidence, assess
affected records, and notify the incident owner. Never paste tokens, medical
answers, provider payloads, or signed URLs into tickets or chat.
