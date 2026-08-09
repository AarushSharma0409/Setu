# Insurance launch checklist

This checklist is deliberately unmarked until its evidence is produced in the
approved target environment.

## Product and compliance

- [ ] Approved operating model, launch policy types, products, documents, rate cards, and disclosures
- [ ] Required consent and disclosure evidence reconstructed from a synthetic journey
- [ ] Pricing and ranking reproducibility verified

## Security and infrastructure

- [ ] Development login, fixtures, mock provider, and fake pricing disabled
- [ ] Managed secrets, MFA, admin ingress controls, TLS, CSP, CORS, and rate limits verified
- [ ] Private object storage, malware scanning, retention, and signed access verified
- [ ] PostgreSQL/Redis readiness, migration deploy, backup, and restore verified

## Integrations and operations

- [ ] Provider sandbox auth, quote, handoff, callback, and production configuration verified per provider
- [ ] Provider kill switch, global flags, wrong-pricing/ranking response, and rollback drill verified
- [ ] Monitoring signals, alerts, logs, audit trail, support lookup, and incident runbooks verified

## Quality and rollout

- [ ] Customer/admin/operations golden paths passed in browsers and mobile viewports
- [ ] Accessibility, reduced-motion, performance, and load checks passed
- [ ] Immutable release commit/image, staged rollout, on-call/escalation, and post-launch monitoring window approved
