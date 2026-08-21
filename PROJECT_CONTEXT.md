# Setu — Project Context and Handoff

**Updated:** 21 August 2026  
**Purpose:** A safe handoff document for continuing Setu work without re-discovering its architecture, product decisions, and operational status.

## Product scope

Setu is a PAN-India discovery platform for approved service providers. It includes a public website, vendor onboarding/workspace, a separate internal admin app, and a NestJS API.

It is currently a marketplace and vendor-directory MVP. Finance and insurance are category exploration/interest features only. Setu must not be presented as an insurer, broker, quote engine, payment platform, policy-issuance platform, or provider of regulated financial advice.

## Repository structure

```text
SETU/
├── frontend/
│   ├── web/                    # Public Next.js app
│   └── admin/                  # Separate internal Next.js app
├── backend/api/                # NestJS API, Prisma, migrations, tests
├── packages/                   # config, types, ui
├── infrastructure/
│   ├── docker/                 # Production Dockerfiles, Compose, Caddy
│   └── scripts/                # Deploy, backup, restore, rollback, smoke
├── .github/workflows/          # CI, image build, staging, production deploy
├── docs/                       # Security, launch, deployment, operations
├── docker-compose.yml          # Local PostgreSQL + Redis only
└── PROJECT_CONTEXT.md          # This document
```

The prior `apps/*` layout has been moved to `frontend/*` and `backend/api`; root pnpm scripts target the new locations.

## Stack

| Area                      | Choice                                                                          |
| ------------------------- | ------------------------------------------------------------------------------- |
| Language                  | TypeScript, strict mode                                                         |
| Frontend                  | Next.js App Router, React, Tailwind, TanStack Query                             |
| Backend                   | NestJS modular monolith                                                         |
| Database                  | PostgreSQL + Prisma                                                             |
| Cache / rate limits       | Redis + ioredis                                                                 |
| Validation                | Zod and class-validator                                                         |
| Authentication            | JWT access token + rotating hashed refresh sessions                             |
| Password hashing          | bcrypt                                                                          |
| Admin MFA                 | TOTP                                                                            |
| Public Google sign-in     | Optional Google Identity Services (GIS)                                         |
| Email                     | Nodemailer through authenticated SMTP                                           |
| File storage              | Local adapter in development; private MinIO/S3-compatible storage in production |
| Local infrastructure      | Docker Compose                                                                  |
| Production infrastructure | Docker Compose + Caddy + GitHub Actions + GHCR + SSH                            |

## Local URLs and commands

| Service    | URL                                   |
| ---------- | ------------------------------------- |
| Public web | `http://localhost:3000`               |
| Admin app  | `http://localhost:3001`               |
| API        | `http://localhost:4000/api/v1`        |
| Health     | `http://localhost:4000/api/v1/health` |

```powershell
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed:dev
pnpm dev
```

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm format:check
```

Prisma Studio:

```powershell
pnpm --filter @setu/api exec prisma studio --schema prisma/schema.prisma
```

## Public web delivered

- Responsive modern/neumorphic public visual system with violet/navy identity.
- Homepage, categories, cities, category-plus-city discovery, search, vendor lists, vendor profile, about, contact, account, inquiries, notifications, and vendor pages.
- Public features are explorable without login; authentication is required only for private/personal actions such as inquiries, saved account data, and vendor onboarding.
- Footer includes navigation, configured support contact, legal links, and one "Powered by Dodun Soft Solutions" attribution.
- Category/city/vendor discovery layouts and cards were refined to match the shared visual system.
- Raw breadcrumb/path lines were removed from category/search-style public pages where they harmed the design.
- Vendor profiles show actual contact information (phone, email, website) when supplied, not only opaque links.
- Public user sign-up/sign-in, password reset, optional GIS integration point, and account-specific pages exist.
- The phone-number/OTP login option was removed because a real SMS provider was not selected.

## Finance and insurance category design

- Insurance and finance are category content, not top-level navigation entries.
- Finance uses expandable product groups: equity, fixed income, managed portfolio, insurance, and special opportunities/credit.
- Insurance grouping includes life, health/general, and vehicle insurance.
- Selecting a service presents informational/definition content and sends the visitor to the approved provider directory.
- Setu does not sell, compare, price, quote, purchase, issue policies, or provide regulated financial advice. Finance and insurance are referral/discovery categories like the others; the user contacts the selected provider directly.

## Vendor onboarding and workspace

Onboarding has real authenticated steps:

1. Business details
2. Categories
3. Service areas and primary city
4. Documents
5. Review and submit
6. Application status

Behavior:

- Save and save-and-continue controls move vendors through the flow.
- API selections use UUID values rather than display names, resolving earlier category/city validation errors.
- Business mobile validation requires a valid 10-digit Indian number.
- Submission creates a pending-review application.
- Vendor receives in-app acknowledgement and SMTP acknowledgement when mail is configured.
- Administrators receive a pending-vendor notification/email.
- Documents use private storage and signed URLs. Production storage is MinIO/S3-compatible.

## Admin app

The admin app is a separately built/deployed Next.js application. It is not linked from public navigation and has noindex/robots protections.

Implemented administration includes:

- overview, audit logs, system status, vendor verification queue, vendor details, and insurance administration areas;
- separate admin email/password identity and token audience;
- TOTP MFA flow and enforcement point;
- vendor application review, approve, reject, suspend, and reactivate actions;
- audit events plus in-app and SMTP vendor notification for approval, rejection, suspension, and reactivation.

Google sign-in is deliberately **not** used for administrators.

## API and data foundations

Major API modules include authentication, admin authentication, users, Prisma/database, Redis, health, categories, locations, public discovery, vendors, documents, inquiries/messages, notifications, audit, mail, quote interests, and gated insurance/finance foundations.

Health endpoints:

```text
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready
```

`ready` validates PostgreSQL and Redis without exposing credentials.

Prisma models cover public/admin identities, refresh sessions, audit logs, vendors, categories, service areas, documents, inquiries/messages, notifications, and finance/insurance operational/catalogue records.

Never run `prisma migrate dev`, `prisma migrate reset`, `pnpm db:migrate`, or `docker compose down -v` against production. The deployment process uses `pnpm db:migrate:deploy` / `prisma migrate deploy` only.

## Authentication and security

- Public email/password accounts use bcrypt password hashing, short-lived access JWTs, and rotated/revocable hashed refresh sessions.
- Password-reset tokens are hashed, expiring, single-use, and revoke sessions after a completed reset.
- Admin identity, tokens, guards, and MFA are separate from public-user authentication.
- Public tokens cannot access admin routes, and admin tokens cannot access public-user routes unless expressly designed.
- Global API request transformation, whitelisting, unexpected-property rejection, central error handling, structured logging/redaction, validated CORS, and Redis rate limiting exist.
- Frontends include CSP/security headers and no-store treatment for sensitive paths.
- Production environment validation rejects unsafe local values, fixtures, and insurance activation without explicit approval flags.

## Email

Nodemailer SMTP is centralized in the backend mail module. Existing notification events cover password reset/changed, vendor submission, vendor review notifications, approval/rejection/suspension/reactivation, inquiries, selected inquiry status updates, and finance/insurance interest requests.

SMTP must be configured with a real authenticated mailbox in `/opt/setu/api.env`. Do not store SMTP secrets in GitHub, source code, frontend environment files, screenshots, or Docker images.

## Production deployment and CI/CD

Production is designed for one Linux server running Docker Compose:

- Caddy reverse proxy with HTTPS;
- public web, admin, and API containers;
- PostgreSQL, Redis, and MinIO private object storage;
- persistent Docker volumes and rotated logs.

Only Caddy exposes ports 80/443. Database, Redis, MinIO console, and Node ports remain internal.

```text
Push / pull request → CI
Push to main → immutable API/web/admin images published to GHCR
Manual protected production deployment → SSH to server → backup → migrate
→ deploy → smoke test → application-image rollback if health validation fails
```

Key files:

- `.github/workflows/ci.yml`
- `.github/workflows/container-images.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `infrastructure/docker/docker-compose.production.yml`
- `infrastructure/docker/Caddyfile`
- `infrastructure/scripts/deploy.sh`
- `docs/deployment/self-hosted.md`
- `docs/deployment/server-bootstrap.md`
- `docs/deployment/production-runbook.md`
- `docs/deployment/restore.md`

GitHub Actions builds the public web image with the `PUBLIC_SITE_URL` repository variable (with a safe build fallback for pull requests). Configure production environment SSH/GHCR secrets exactly as listed in `docs/deployment/self-hosted.md`.

## Environment and secret rules

Templates:

- `.env.example` — local inventory
- `.env.production.example` — production Compose values
- `backend/api/.env.example` — API local values
- `infrastructure/docker/api.env.production.example` — API production values
- `infrastructure/docker/web.env.production.example` — public web production values
- `infrastructure/docker/admin.env.production.example` — admin production values

Never commit real `.env` files, database passwords, JWT secrets, TOTP encryption keys, SMTP credentials, OAuth secrets, SSH keys, or access tokens.

## Verification already performed

After the SMTP/mail work, these API commands completed successfully:

- `pnpm --filter @setu/api typecheck`
- `pnpm --filter @setu/api lint`
- `pnpm --filter @setu/api test` — 18 suites, 54 tests
- `pnpm --filter @setu/api test:e2e` — 1 suite, 9 tests
- `pnpm --filter @setu/api build`

Public/admin production builds were run successfully after the Netlify configuration work. Targeted Prettier validation passed for the self-hosted CI/CD files.

Do not state that the current working tree passes the full release gate until `pnpm release:verify` has been run on the final committed version, ideally in GitHub Actions.

## Known limitations and launch blockers

- Development-only vendor fixtures remain in the development seed and must never be enabled in production; reviewed real vendor records and configured support contacts are required before launch.
- Real SMTP delivery still needs configured credentials and end-to-end verification.
- ClamAV scanning is integrated and production fail-closed, but clean/infected/outage staging tests remain.
- PostgreSQL and MinIO off-server backup scripts are integrated; credentials, independent destinations, and restore tests remain.
- Monitoring, uptime checks, alerting, incident ownership, privacy/terms, support procedures, and security sign-off require operational setup and named owners.
- Finance/insurance now use the same provider-directory/referral flow as other categories. Setu must not sell, compare, price, quote, purchase, issue policies, or provide regulated advice.
- Free hosting is acceptable for demos only. The chosen launch topology is a self-hosted Linux server.

## Recommended next actions

1. Load reviewed vendor records and configure published support contacts; keep development fixtures disabled.
2. Configure SMTP and run `pnpm --filter @setu/api mail:verify`.
3. Harden/provision the Linux server with `docs/deployment/server-bootstrap.md`.
4. Configure DNS, production server env files, off-server PostgreSQL/MinIO destinations, and monitoring webhook.
5. Configure GitHub Actions variables and protected production secrets.
6. Run `pnpm release:verify` on the final release commit.
7. Prefer an isolated staging deployment before production.
8. Verify backups/restores, malware scanning, monitoring, email delivery, admin MFA, vendor flows, and production smoke tests.
9. Obtain legal/security/operational sign-off for the referral wording and provider data.
