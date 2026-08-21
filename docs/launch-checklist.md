# MVP launch checklist

## Product

- [ ] Categories and cities confirmed
- [ ] Reviewed provider records loaded; development fixtures and placeholder contacts removed
- [ ] Vendor-facing wording reviewed
- [ ] Inquiry workflow and support process reviewed

## Security

- [ ] Production secrets generated and stored securely
- [ ] Test-only accounts and fixtures disabled
- [ ] Admin MFA enrollment verified
- [ ] CORS and security headers verified
- [ ] Storage bucket private
- [ ] Signed URL expiry verified
- [ ] Rate limits configured
- [ ] Audit logs verified
- [ ] External penetration test scheduled/completed
- [ ] ClamAV health, clean-file, infected-file, and outage behavior verified in staging
- [ ] Security review evidence recorded in `docs/security-review.md`

## Database and infrastructure

- [ ] Migration reviewed and applied
- [ ] Backup created
- [ ] PostgreSQL backup copied off-server
- [ ] MinIO backup copied to an independent destination
- [ ] Restore test completed
- [ ] TLS and DNS configured
- [ ] Health checks and alerts configured
- [ ] External uptime check configured
- [ ] Log retention configured

## Testing and operations

- [ ] Unit, integration, and E2E suites pass
- [ ] Accessibility and browser checks completed
- [ ] Smoke test completed
- [ ] Runbooks available
- [ ] On-call ownership and incident contacts assigned
- [ ] SMTP verification email delivered and received
- [ ] Rollback procedure tested
