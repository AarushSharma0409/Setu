# Penetration-test preparation

Provide testers with a staging-only account set covering anonymous users,
public users, vendors in each lifecycle state, reviewer/operations/super-admin
roles, MFA challenge tokens, and disabled accounts. Include the authorization
matrix, API route inventory, upload type/size policy, signed URL expiry, CORS
allowlist, and log-redaction policy.

Do not provide production secrets or real customer documents. Capture findings
with request IDs and reproduce them in staging before applying fixes.
