# Release evidence: insurance-rc1-uncommitted

## Identity

- Base Git commit: `c7463e62a01f20b7e7498eed0c7c5df93c9ce35a`
- Repository version: `0.1.0`
- Validation date: 2026-08-08
- Environment: local Windows workstation; Docker Desktop engine unavailable
- Release identity status: not immutable because the repository has uncommitted
  insurance changes. Do not deploy this identifier.

## Executed evidence

- Frozen dependency installation passed.
- Prisma client generation passed.
- Forced workspace unit suite passed: API 18 suites/53 tests; web 5 tests;
  admin 2 tests; UI 6 tests.
- Forced integration suite passed: API 9 tests; existing web/admin render
  suites passed.
- Forced production builds passed for API, web, and admin.
- Formatting check passed.
- Dependency audit at high severity passed with no known vulnerabilities.
- Production unsafe-default validation passed by rejecting local secrets,
  localhost CORS, and local object storage.
- Production insurance flags require the explicit default-off
  `INSURANCE_PRODUCTION_APPROVED` release-control gate.

## Blocked evidence

Docker startup and status checks failed because
`//./pipe/dockerDesktopLinuxEngine` was unavailable. Therefore PostgreSQL,
Redis, migration deploy, seed, production startup, health endpoints, backup,
restore, customer/admin/operations journeys, provider sandbox validation,
monitoring, alerts, load, and browser/device checks were not validated.

## Classification

`NOT READY`. No approved launch provider, production policy/product data,
production environment, immutable release commit, or production-like database
validation exists in this evidence set.
