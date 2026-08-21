# Setu security review

**Review date:** 21 August 2026  
**Scope:** repository controls, production configuration, authentication,
vendor documents, public referral flows, backups, and operational controls.

## Controls verified in the repository

- Public and admin identities, token audiences, refresh sessions, password
  reset, admin MFA, authorization guards, request validation, CORS, rate
  limiting, redacted logging, and security headers are separated and enforced.
- Production validation rejects local secrets, local origins, local storage,
  public fixtures, and unapproved finance/insurance feature activation.
- Vendor documents are MIME/signature checked, scanned through ClamAV before
  storage, stored privately, and exposed only through short-lived signed URLs.
  Production fails closed when the scanner is disabled or unavailable.
- PostgreSQL and MinIO backups are required to be copied off-server by the
  deployment scripts. Restore testing remains an operational requirement.
- Finance and insurance are referral-only in the public product flow. Setu does
  not sell, compare, price, issue, or advise on products.

## Release evidence required

Run these commands on the final commit and retain the CI artifacts:

```bash
pnpm release:verify
pnpm audit --audit-level high
```

On staging, verify a clean PDF/image, an EICAR test file, a scanner outage, a
private object URL, a signed URL expiry, an admin MFA login, a vendor approval,
an inquiry, SMTP delivery, and both backup/restore paths. The EICAR test must
use a disposable staging environment and must never be uploaded to production.

## External review still required before launch

The repository cannot independently approve legal text, infrastructure
hardening, credential rotation, data-retention periods, vendor contracts, or a
penetration test. The named security contact must record those approvals in the
release evidence and keep production insurance/finance flags disabled until the
business and legal owners approve the referral model and provider data.
