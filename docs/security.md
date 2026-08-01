# Security controls

## Authentication and authorization

- Public and admin JWTs use different audiences and guards.
- Admin business routes require an active admin, an admin audience, and an
  MFA-authenticated token.
- Public guards re-check the current user account status.
- Refresh tokens are opaque, rotated, hashed at rest, expired, and revoked on
  logout. Reuse revokes the token family.
- Vendor and inquiry services scope every read and mutation to the current
  owner or vendor boundary.

## Requests and abuse

Global validation rejects non-whitelisted fields. JSON and URL-encoded bodies
have explicit limits, uploads are capped to one 10 MiB file, and Redis-backed
limits protect authentication, onboarding, uploads, discovery, inquiry
creation, and messaging. Rate-limited responses include `Retry-After`.

## Documents

Only PDF, JPEG, and PNG signatures are accepted. Storage keys are UUID-based,
files are private, signed reads are capped at 300 seconds, and a failed
metadata write compensates by deleting the uploaded object. Malware scanning
is an explicit integration boundary and is currently `not_configured`; MIME
validation is not a malware verdict.

## Residual risks

Production still requires an S3-compatible private adapter, antivirus
pipeline, gateway/WAF policy, centralized log retention, and an external
penetration test before a public launch.
