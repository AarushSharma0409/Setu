# Insurance threat model

## Assets and boundaries

Setu treats customer accounts, need profiles, health-sensitive answers, consent
and disclosure evidence, quotes, rate cards, product/ranking configuration,
provider credentials/callbacks, handoff sessions, admin accounts, and audit
records as protected assets. Customer, organization, admin, provider, object
storage, and database boundaries are distinct; provider credentials are never
part of a browser payload or database record.

## Threats and implemented mitigations

| Threat                               | Primary mitigation                                                                                                                          | Residual risk                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Broken access control or enumeration | Separate public/admin JWT audiences and guards, ownership predicates, UUIDs, and permission guard                                           | Full route-by-route external review remains required                  |
| Credential theft and session replay  | Short access TTLs, HttpOnly refresh cookies, hashed rotating sessions, family revocation on reuse, MFA-backed admin access                  | Browser access token is session-scoped and still requires XSS defense |
| Privilege escalation                 | Centralized admin permission matrix; organization roles cannot grant admin privileges                                                       | Super-admin operations require operational review                     |
| Sensitive-data leakage               | Classification-driven field encryption, DTO shaping, cache controls, and centralized redaction                                              | Production key custody requires a managed KMS/HSM                     |
| Injection and mass assignment        | Global whitelist/forbid validation, DTOs, Prisma parameterization, and explicit service fields                                              | New endpoints must follow the same pattern                            |
| SSRF and redirect abuse              | HTTPS-only public endpoint validation, private/reserved address rejection, exact configured-host allowlist, and same-host handoff redirects | DNS rebinding needs network egress controls in production             |
| Webhook forgery/replay               | No live callback adapter is shipped; event uniqueness and payload hashes are modeled                                                        | A provider-specific signature verifier is a launch gate               |
| Brute force, DoS, and scraping       | Redis-backed endpoint limits with production fail-closed behavior                                                                           | Edge/WAF and load validation are not configured here                  |
| Malicious upload                     | Type, extension, signature, size and private-key validation                                                                                 | Malware scanning is a required production integration                 |
| Insider/audit tampering              | Append-only audit model, permission-gated reads, safe metadata sanitization                                                                 | Immutable external audit export is not configured                     |

## Threat actors

The controls above are designed for an unauthenticated attacker, compromised
customer, malicious organization user, compromised insurer/provider or admin
account, scraper, network attacker, and insider. A production deployment must
also restrict admin ingress, provider egress, and secret-manager access.
