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

Browser-exposed values must use `NEXT_PUBLIC_`. Database, Redis, JWT,
encryption, seed, and object-storage credentials are API-only.
