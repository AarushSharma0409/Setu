# Setu

Setu is a PAN-India multi-category vendor directory platform. The repository is
a pnpm/Turborepo monorepo with a public Next.js app, a separate internal admin
Next.js app, a NestJS API, Prisma/PostgreSQL, Redis, shared TypeScript packages,
Docker local infrastructure, and CI-ready quality checks.

Sprint 2 adds the vendor onboarding foundation: reference categories and
locations, owner-only vendor profiles, service areas, private document upload
metadata/storage, onboarding submission, and public-web save/resume screens.

Marketplace discovery, admin verification decisions, inquiries, reviews,
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
documents `PENDING_REVIEW`. Admin approval/rejection controls are deliberately
not included in Sprint 2.

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

Admin `twoFactorEnabled` defaults to `true` in the schema. Full 2FA is not
implemented yet; local seed can set `ADMIN_SEED_2FA_ENABLED=false` so the admin
UI can be tested.

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

## Known Sprint 2 limitations

Not implemented:

- Admin verification queue, review details, approval, or rejection actions
- Public marketplace listings or discovery search
- Category/city admin management screens
- Inquiry or lead management
- Messaging, reviews, subscriptions, billing, or payments
- SMS, WhatsApp OTP, email delivery, S3 production uploads, or antivirus scanning
- Insurance quotation or insurer integrations
- Production gateway rules such as IP allowlisting or generic 404 masking
- Full admin 2FA

Next planned sprint: build the admin verification queue and operational review
workflow for submitted vendor profiles while keeping marketplace discovery and
insurance work separate.
