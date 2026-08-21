# Insurance launch security checklist

Do not mark an item complete without deployment evidence.

- [ ] Test-only accounts and fixtures disabled
- [ ] No fake pricing, test organization, or offline adapter exposed
- [ ] Production secrets loaded from a managed secret store and key rotation recorded
- [ ] Admin MFA enforced and admin ingress restricted
- [ ] Provider host allowlist, production credentials, and contract-specific webhook validation verified
- [ ] TLS, HSTS, CORS, CSP, security headers, and rate limiting verified in the deployed environment
- [ ] Private object storage, malware scanning, retention, deletion, and signed-URL controls verified
- [ ] Backups enabled and a restore test signed off
- [ ] Monitoring, redacted logging, alert routing, and incident owner verified
- [ ] Feature flags, migrations, rollback, and production smoke tests approved
