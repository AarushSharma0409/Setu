# Environment configuration

Use `.env.example` only as a variable inventory. Generate real production
values with a password manager or a cryptographically secure generator; never
copy local example secrets into production.

Useful PowerShell secret examples:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

For production, configure `NODE_ENV=production`, non-local CORS origins,
`OBJECT_STORAGE_PROVIDER=s3`, private bucket credentials, unique JWT and
challenge secrets, and a base64-encoded 32-byte `ADMIN_2FA_ENCRYPTION_KEY`.
The API rejects local placeholder secrets, local origins, local object
storage, and development fixtures in production.

Provider integrations additionally require `INSURANCE_PROVIDER_ALLOWED_HOSTS`,
a comma-separated exact host allowlist. Provider URLs must be HTTPS public
destinations and are rejected when they point to loopback, private, link-local,
or reserved network addresses. Leave the allowlist empty only while provider
integrations remain disabled.

Insurance feature flags additionally require
`INSURANCE_PRODUCTION_APPROVED=true` in production. This is an explicit
release-control gate, not proof that legal, provider, backup, monitoring, or
operational launch requirements have been met.

Browser-exposed values must use `NEXT_PUBLIC_`. Database, Redis, JWT,
encryption, seed, and object-storage credentials are API-only.

`SEED_INSURANCE_DEMO_MODE=true` is permitted only for a local development seed.
It creates an explicitly example-only active operating model so the local
insurance user interface can be demonstrated. Keep it `false` for normal
development fixtures and never use it for a production seed.
