# Netlify frontend deployment

Deploy Setu as two separate Netlify sites from the same repository:

| Site | Netlify package directory | Build command | Production domain |
| --- | --- | --- | --- |
| Public web | `frontend/web` | `pnpm --filter @setu/web build` | `https://setu.example.com` |
| Internal admin | `frontend/admin` | `pnpm --filter @setu/admin build` | `https://admin.setu.example.com` |

Leave Netlify's base directory unset so it uses the repository root and can
install all pnpm workspace dependencies. Set the package directory for each
site to the corresponding frontend path; Netlify will load the matching
`netlify.toml` from that directory.

## Required Netlify environment variables

Set this value for both sites in the Netlify UI, with scope **Builds**:

```text
NEXT_PUBLIC_API_URL=https://api.setu.example.com/api/v1
```

Set it for production, preview, and branch deploy contexts as appropriate.
Only `NEXT_PUBLIC_API_URL` belongs in Netlify. Never add database URLs, JWT
secrets, Redis URLs, SMTP credentials, object-storage credentials, or admin
seed credentials to either Netlify site.

## API deployment

The NestJS API is not deployed as a Netlify frontend. Run it on a persistent
Node/container host with PostgreSQL, Redis, object storage, and SMTP available.
The existing production Compose deployment is suitable for a VPS. The API must
be reachable over HTTPS before deploying the Netlify sites.

Configure API CORS with the exact final origins:

```text
CORS_ALLOWED_ORIGINS=https://setu.example.com,https://admin.setu.example.com
PUBLIC_SITE_URL=https://setu.example.com
ADMIN_SITE_URL=https://admin.setu.example.com
```

## Deployment order

1. Deploy and migrate the API and verify `https://api.setu.example.com/api/v1/health/live`.
2. Set production API CORS and SMTP environment variables on the API host.
3. Create the public Netlify site and set its package directory and environment variable.
4. Create the admin Netlify site using `frontend/admin` and the same API URL.
5. Attach the public and admin custom domains, then update the API CORS values if they differ.
6. Test public sign-up, vendor onboarding, administrator MFA login, and password-reset delivery.

The admin site remains separate, `noindex`, and inaccessible from the public
navigation. Protect its custom domain further with access controls at the DNS,
gateway, or Netlify level before production use.
