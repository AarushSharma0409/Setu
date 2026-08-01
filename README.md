# Setu

Setu is a PAN-India multi-category vendor directory platform. The repository is
a pnpm/Turborepo monorepo with a public Next.js app, a separate internal admin
Next.js app, a NestJS API, Prisma/PostgreSQL, Redis, shared TypeScript packages,
Docker local infrastructure, and CI-ready quality checks.

Sprint 2 adds the vendor onboarding foundation. Sprint 3 completes the
separate admin verification boundary: mandatory TOTP MFA, recovery codes,
permission-checked vendor review, private document access, transactional
approval/rejection/suspension decisions, and append-only audit logs.

Marketplace discovery, public vendor profiles, inquiries, reviews,
subscriptions, billing, insurance, and production cloud integrations remain
intentionally out of scope.

## Architecture summary

- `apps/web`: public Next.js App Router application at `http://localhost:3000`
- `apps/admin`: separately built internal Next.js App Router application at
  `http://localhost:3001`
- `apps/api`: NestJS modular-monolith API at
  `http://localhost:4000/api/v1`
- `packages/types`: framework-independent enums and shared response shapes
- `packages/ui`: minimal shared UI primitives
- `packages/config`: shared TypeScript, ESLint, and Prettier configuration
- `docker-compose.yml`: local PostgreSQL and Redis services

The admin application has its own authentication state and API client. It is
not linked from the public application and remains protected by server-side
admin role and MFA checks.

## Monorepo structure

```text
apps/
  admin/
  api/
  web/
packages/
  config/
  types/
  ui/
infrastructure/
  docker/
.github/workflows/
docker-compose.yml
pnpm-workspace.yaml
turbo.json
```

## Prerequisites

- Node.js 24 or a compatible current LTS
- pnpm 11
- Docker Desktop for PostgreSQL and Redis

## Installation

```bash
pnpm install
pnpm db:generate
```

## Environment setup

Copy the examples before starting apps:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
```

Required local variables include:

- `NODE_ENV`
- `API_PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL`
- `CORS_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_API_URL`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `ADMIN_SEED_2FA_ENABLED`
- `OBJECT_STORAGE_PROVIDER`
- `OBJECT_STORAGE_LOCAL_DIR`
- `DOCUMENT_MAX_FILE_SIZE_BYTES`
- `DOCUMENT_ALLOWED_MIME_TYPES`
- `SIGNED_URL_TTL_SECONDS`
- `ADMIN_2FA_ENCRYPTION_KEY` (base64-encoded 32-byte AES-256-GCM key)
- `ADMIN_AUTH_CHALLENGE_SECRET`
- `ADMIN_AUTH_CHALLENGE_TTL`
- `ADMIN_TOTP_ISSUER`
- `ADMIN_TOTP_WINDOW`
- `ADMIN_LOGIN_MAX_ATTEMPTS`
- `ADMIN_LOGIN_LOCKOUT_SECONDS`
- `ADMIN_2FA_MAX_ATTEMPTS`
- `ADMIN_DOCUMENT_URL_TTL_SECONDS`

The storage variables also include optional S3-compatible placeholders:
`OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ENDPOINT`,
`OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_ACCESS_KEY_ID`, and
`OBJECT_STORAGE_SECRET_ACCESS_KEY`. Sprint 2 uses the local private adapter by
default. Never use example secrets outside local development.

## Starting PostgreSQL and Redis

Docker Desktop must be installed and `docker` must be available in your terminal
PATH. If PowerShell returns `docker : The term 'docker' is not recognized`,
install Docker Desktop for Windows, start it once, then open a new terminal.

```bash
docker compose up -d
docker compose ps
docker compose down
docker compose down -v
```

PostgreSQL and Redis use persistent named volumes. The compose file contains
only non-production local credentials.

## Database, migrations, and seed

Run migrations and generate the Prisma client:

```bash
pnpm db:migrate
pnpm db:generate
```

Seed reference data and the development admin:

```bash
pnpm db:seed
```

The seed is idempotent for categories, states, and cities. It also reads
`ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` from the environment and stores
only a bcrypt password hash.

Sprint 2 migration:

- `20260731160000_vendor_onboarding_foundation`
- Adds `Category`, `State`, `City`, `VendorProfile`, `VendorCategory`,
  `VendorServiceArea`, and `VendorDocument`
- Adds `VendorStatus`, `VendorDocumentType`, and `VendorDocumentStatus`

Sprint 3 migration:

- `20260731170000_admin_verification_mfa_audit`
- Adds encrypted MFA fields to `AdminUser`, `AdminAuthChallenge`,
  `AdminRecoveryCode`, and `VendorVerificationDecision`
- Adds vendor review/suspension metadata and request context fields/indexes to
  `AuditLog`

## Run applications

Start everything:

```bash
pnpm dev
```

Run apps separately:

```bash
pnpm --filter @setu/web dev
pnpm --filter @setu/admin dev
pnpm --filter @setu/api dev
```

Default local URLs:

- Public web: `http://localhost:3000`
- Admin web: `http://localhost:3001`
- API: `http://localhost:4000/api/v1`
- API health: `http://localhost:4000/api/v1/health`
- Vendor onboarding: `http://localhost:3000/vendor/onboarding`
- Vendor status: `http://localhost:3000/vendor/status`
- Admin login: `http://localhost:3001/login`
- Admin verification queue: `http://localhost:3001/dashboard/vendors`
- Admin audit log: `http://localhost:3001/dashboard/audit`

## Vendor onboarding flow

Use `http://localhost:3000/dev-auth` to sign in through the development-only
public auth endpoint, then open `/vendor/onboarding`.

Implemented public-web screens:

- `/vendor/onboarding`
- `/vendor/onboarding/business`
- `/vendor/onboarding/categories`
- `/vendor/onboarding/service-areas`
- `/vendor/onboarding/documents`
- `/vendor/onboarding/review`
- `/vendor/status`

Implemented API endpoints:

- `GET /api/v1/categories`
- `GET /api/v1/locations/states`
- `GET /api/v1/locations/cities`
- `GET /api/v1/locations/cities?stateId=...`
- `POST /api/v1/vendors/onboarding/start`
- `GET /api/v1/vendors/me`
- `PATCH /api/v1/vendors/me/profile`
- `PUT /api/v1/vendors/me/categories`
- `PUT /api/v1/vendors/me/service-areas`
- `GET /api/v1/vendors/me/documents`
- `POST /api/v1/vendors/me/documents`
- `DELETE /api/v1/vendors/me/documents/:documentId`
- `POST /api/v1/vendors/me/submit`

Submission changes a draft vendor profile to `PENDING_REVIEW` and marks uploaded
documents `PENDING_REVIEW`.

Admin verification endpoints include:

- `POST /api/v1/admin/auth/2fa/enrollment/start`
- `POST /api/v1/admin/auth/2fa/enrollment/confirm`
- `POST /api/v1/admin/auth/2fa/verify`
- `POST /api/v1/admin/auth/2fa/recovery`
- `GET /api/v1/admin/vendors/verification-queue`
- `GET /api/v1/admin/vendors`
- `GET /api/v1/admin/vendors/:vendorId`
- `POST /api/v1/admin/vendors/:vendorId/documents/:documentId/access`
- `POST /api/v1/admin/vendors/:vendorId/approve`
- `POST /api/v1/admin/vendors/:vendorId/reject`
- `POST /api/v1/admin/vendors/:vendorId/suspend`
- `GET /api/v1/admin/audit-logs`

## Authentication behavior

Public development auth is available at `POST /api/v1/auth/dev-login` only when
`NODE_ENV` is not `production`. It creates or finds a development user and
returns a short-lived access token while also setting an HTTP-only refresh
cookie.

Starting vendor onboarding safely upgrades a public `USER` to `VENDOR` and
creates exactly one owner-only vendor profile. Vendor routes use the public auth
guard; admin tokens are rejected.

Admin auth remains separate at `POST /api/v1/admin/auth/login` and
authenticates against `AdminUser`, not public `User`. Admin and public access
tokens use separate JWT audiences, guards, and refresh cookies.

Refresh tokens are random opaque credentials. Only SHA-256 hashes are stored.
Refresh rotation revokes the previous session, and reuse detection revokes the
token family.

Admin password login never issues a normal access token directly. It returns a
short-lived, single-use challenge. A first login with no confirmed secret goes
to TOTP enrollment; an enrolled admin goes to six-digit TOTP verification.
Successful enrollment displays ten recovery codes exactly once. Recovery codes
are bcrypt-hashed in the database and consumed transactionally.

Every protected admin endpoint requires an admin-audience access token carrying
the signed MFA claim, an active `AdminUser`, and the centralized permission
matrix. Public tokens and password-phase challenge tokens are rejected. Admin
refresh rotation and logout continue to use the existing hashed session model.

The development seed keeps `ADMIN_SEED_2FA_ENABLED=false` by default so the
seeded administrator must complete enrollment on first sign-in. It never seeds
a TOTP secret or recovery code.

### Admin verification workflow

1. Sign in at `/login` with the seeded development credentials.
2. Copy the setup URI into an authenticator app and enter the six-digit code.
3. Save the recovery codes before continuing to the dashboard.
4. Open the verification queue, inspect a submitted vendor, and use the
   approval, rejection, or suspension action. Rejections and suspensions require
   a reason; all decisions are status-checked, transactional, and audited.
5. Documents are private and can only be opened through the short-lived admin
   access endpoint. Sprint 3 does not publish an approved vendor profile.

Admin roles are centralized as follows: `SUPER_ADMIN` has all operations;
`OPERATIONS` can review, approve, reject, suspend, list, and read audit logs;
`REVIEWER` can review, approve, reject, view documents, and read verification
audit entries but cannot suspend vendors.

## Document storage

Sprint 2 stores uploaded document files through an object-storage abstraction.
The default `local` adapter writes private files under `.local-storage`, which
is ignored by Git. Files are validated for size, MIME type, file extension, and
basic binary signature. The database stores metadata, checksum, and non-guessable
storage keys, not file blobs.

The abstraction includes a signed-read-URL method so an S3-compatible adapter
can be added later without changing vendor-domain code. Public marketplace
document viewing is not implemented.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm format:check
```

CI runs install, Prisma generation, lint, typecheck, tests, and build with
PostgreSQL and Redis service containers.

### Windows SWC fallback

The public and admin Next.js scripts use `scripts/next-wasm.cjs`, which points
Next.js at the `@next/swc-wasm-nodejs` fallback. This keeps `pnpm dev` and
production builds working on Windows machines where Application Control blocks
native `.node` binaries.

## Known Sprint 3 limitations

Not implemented:

- Public marketplace listings or discovery search
- Category/city admin management screens
- Inquiry or lead management
- Messaging, reviews, subscriptions, billing, or payments
- SMS, WhatsApp OTP, email delivery, S3 production uploads, or antivirus scanning
- Insurance quotation or insurer integrations
- Production gateway rules such as IP allowlisting or generic 404 masking
- Production S3-compatible adapter and malware scanning; Sprint 3 uses the
  private local adapter behind the storage abstraction
- Vendor reactivation is intentionally not implemented; only
  `PENDING_REVIEW -> APPROVED`, `PENDING_REVIEW -> REJECTED`, and
  `APPROVED -> SUSPENDED` are allowed
- The local signed-object URI is an adapter contract for development and is not
  a public browser URL

Sprint 4 public discovery is implemented below. Next planned sprint: inquiry
foundations while keeping billing and insurance work separate.

## Sprint 4: public discovery

Sprint 4 adds public, SEO-oriented discovery. Only approved vendors with an
active category, an active primary city, and at least one active service area
are visible. Suspended, draft, pending, rejected, incomplete, or otherwise
hidden vendors return the same public-safe 404 as an unknown vendor.

Migration `20260731180000_public_discovery_indexes` adds composite indexes for
approved-vendor status, business-name ordering, and primary-city filtering.

### Public URLs

```text
/                         Homepage
/categories               Active category index
/categories/:slug         Category landing page
/cities                   Active city index
/cities/:state/:city      City landing page (state uses lowercase code)
/services/:category/:state/:city  Combined landing page
/search                   Noindex search results
/vendors/:slug            Approved vendor profile
/sitemap.xml              Public sitemap
```

### Public API

```text
GET /api/v1/public/categories
GET /api/v1/public/categories/:categorySlug
GET /api/v1/public/cities
GET /api/v1/public/cities/:stateSlug/:citySlug
GET /api/v1/public/vendors?q=&category=&city=&state=&page=&pageSize=&sort=
GET /api/v1/public/vendors/:vendorSlug
```

Search uses PostgreSQL case-insensitive matching across business name, legal
name, description, category names, and service-city names. Results are
paginated (20 by default, 50 maximum) and use deterministic tie-breakers.
Supported sorts are `name_asc`, `name_desc`, `newest`, and `oldest`.

Category, city, combined, and approved vendor pages use server-rendered
metadata, canonical URLs, accessible breadcrumbs, and conservative JSON-LD.
Arbitrary `/search` URLs are `noindex`; the sitemap contains only active
reference data and approved public vendors. Public pages revalidate discovery
data for 60 seconds. Status changes should be followed by cache invalidation
in a future production gateway or revalidation hook.

### Development seed data

The explicit development seed creates three clearly fake approved providers
using `example.com` domains, plus the existing categories and locations. Set
`SEED_PUBLIC_FIXTURES=false` to omit these fixtures. Production seed execution
does not create public fixtures.

### Sprint 4 limitations

Public discovery does not include inquiries, messaging, reviews, ratings,
subscriptions, payments, insurance, recommendations, maps, distance search,
or an external search engine. Vendor verification remains an admin-only flow;
verification does not guarantee service quality. Public profiles never include
documents, storage keys, owner-account contact details, reviewer identity, or
internal moderation notes.

Sprint 5 can build inquiry forms and the inquiry lifecycle on top of the stable
public vendor slug, category, city, and service-area contracts without changing
the public visibility predicate.

## Sprint 5: inquiries, messaging, and notifications

Sprint 5 adds the first inquiry-based lead workflow. An authenticated public
user can submit one private inquiry to one approved vendor, exchange plain-text
messages asynchronously, and withdraw or close the inquiry. Vendor owners have
a separate inbox and can move inquiries through the controlled status
transitions. No marketplace search, reviews, subscriptions, billing, or
insurance behavior is included.

### Inquiry URLs

```text
/account/inquiries                 User inquiry list
/account/inquiries/:id              User inquiry detail and messaging
/account/notifications              User in-app notification center
/vendor/inquiries                   Vendor inbox
/vendor/inquiries/:id               Vendor inquiry detail and status actions
/vendor/notifications               Vendor in-app notification center
```

The inquiry form is shown on an approved public vendor profile. Unauthenticated
users are sent to `/dev-auth` with a safe internal return path. The development
login control is unavailable when `NODE_ENV=production`.

### Inquiry API

```text
POST /api/v1/inquiries
GET  /api/v1/inquiries
GET  /api/v1/inquiries/:inquiryId
POST /api/v1/inquiries/:inquiryId/messages
POST /api/v1/inquiries/:inquiryId/withdraw
POST /api/v1/inquiries/:inquiryId/close

GET  /api/v1/vendors/me/inquiries
GET  /api/v1/vendors/me/inquiries/:inquiryId
POST /api/v1/vendors/me/inquiries/:inquiryId/messages
POST /api/v1/vendors/me/inquiries/:inquiryId/status

GET  /api/v1/notifications
GET  /api/v1/notifications/unread-count
POST /api/v1/notifications/:notificationId/read
POST /api/v1/notifications/read-all
```

`POST /api/v1/inquiries` accepts an `Idempotency-Key`. The request hash and
result are retained for the configured `INQUIRY_IDEMPOTENCY_TTL_SECONDS`
(900 seconds by default), so safe retries return the same inquiry without
duplicating a lead. Bodies are plain text and are rendered as text; HTML and
Markdown are not accepted or rendered. The existing global throttler provides
basic request limiting for authentication and inquiry traffic.

### Lifecycle and privacy

The controlled lifecycle is `NEW -> VIEWED -> CONTACTED -> IN_PROGRESS ->
RESOLVED -> CLOSED`, with user withdrawal and permitted vendor closure paths.
Terminal states cannot be reopened. Every transition is recorded in
`InquiryStatusHistory`. The user and vendor can only access inquiries they own;
the vendor must own the associated vendor profile. Suspended vendors cannot
message or change status. Notifications contain only safe references and are
scoped to the user or vendor recipient.

Seeded development fixtures include three fake inquiries for the seeded public
vendor accounts. Run the normal explicit seed command to create them; no
production credentials or production seed data are committed.

### Sprint 5 limitations and next sprint

Messaging is request/response HTTP only (no WebSockets, typing indicators, or
presence). Notifications are in-app only; email, SMS, WhatsApp, push delivery,
retention/archival jobs, abuse tooling, and admin inquiry monitoring are not
implemented. Admin can continue to use existing vendor verification screens,
but Sprint 5 does not add a dedicated inquiry-monitoring dashboard. Sprint 6
can add moderation/operations views, delivery integrations, retention policy,
and richer vendor/user account navigation without changing the ownership and
visibility rules established here.

## Sprint 5.5: MVP UI/UX refinement

Sprint 5.5 refines the existing MVP without adding new product scope. The
shared UI package now provides semantic design tokens, accessible controls,
status badges, alerts, loading/empty/error states, page headers, progress, and
responsive layout foundations. See [docs/ui-system.md](docs/ui-system.md) for
the concise token and interaction guide.

The public application now uses a responsive shell with mobile navigation,
account/vendor access, a skip link, and a factual footer. Discovery cards,
search, categories, cities, vendor profiles, inquiry lists, inquiry detail, and
development authentication use the shared visual language. Vendor onboarding
uses an accessible step indicator, progress, status badge, and responsive
selection layouts. The admin application uses a separate operations shell with
responsive navigation, identity/logout controls, clearer headers, status cards,
and a mobile verification-queue list alternative.

The Sprint 5.5 design work does not add reviews, ratings, subscriptions,
payments, realtime chat, message attachments, new permissions, new inquiry
states, or backend business modules. Automated tests cover the shared primitive
variants and existing public/admin flows; manual browser and assistive
technology review remains required before production release.

## Sprint 6: stabilization and production readiness

Sprint 6 hardens the existing MVP without adding marketplace functionality.
The API now has production environment rejection, Redis-backed limits for
authentication/onboarding/uploads/discovery/inquiries, request IDs, structured
request/error logging, bounded health probes, explicit request-body and upload
limits, safer production error responses, and security headers on both Next.js
applications. Public guards re-check account status, and document storage has
compensating cleanup plus an explicit malware-scanning integration boundary.

Focused operational guides live under `docs/`:

- `docs/architecture.md`
- `docs/deployment.md`
- `docs/environment.md`
- `docs/security.md`
- `docs/operations.md`
- `docs/backup-and-restore.md`
- `docs/testing.md`
- `docs/launch-checklist.md`
- `docs/smoke-test.md`
- `docs/rollback.md`
- `docs/runbooks/`
- `docs/penetration-test-prep.md`

### Production-safe database commands

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed:prod
```

`db:seed:prod` requires `NODE_ENV=production`, explicit admin credentials,
`ADMIN_SEED_2FA_ENABLED=true`, and never creates public development fixtures.
Use `pnpm db:migrate` and `pnpm db:seed:dev` only for local development. Never
run `prisma migrate dev` against production.

### Production container builds

```bash
docker build -f infrastructure/docker/Dockerfile.api -t setu-api:latest .
docker build -f infrastructure/docker/Dockerfile.web -t setu-web:latest .
docker build -f infrastructure/docker/Dockerfile.admin -t setu-admin:latest .
```

The production compose file is a deployment template only. Provide secrets
through the platform, use a private S3-compatible bucket, configure TLS and
DNS at the gateway, and keep the admin application on a separate restricted
hostname. See `docs/launch-checklist.md` before classifying the MVP as ready.

### Sprint 6 limitations

The repository does not claim completed antivirus scanning, an S3 production
adapter, external penetration testing, load testing, browser/axe automation,
or a completed backup/restore drill. These remain explicit release-gate tasks.
