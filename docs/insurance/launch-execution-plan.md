# Insurance launch execution plan

This plan converts the I10 `NOT READY` result into gated work. Do not begin a
later phase merely because an earlier phase is documented; each exit criterion
needs recorded evidence.

## Phase 0 — release ownership and freeze

**Goal:** establish a traceable release candidate.

- Assign product, pricing, compliance, security, infrastructure, provider, and
  operations owners.
- Commit all completed work, create an immutable tag/image identifier, and
  record its commit SHA.
- Confirm the initial policy type and launch-provider scope.

**Exit criteria:** approved scope, immutable release identifier, named owners,
and no unresolved code-quality failure.

**Execution record:** complete the owner, scope, and immutable-release fields
in [release-baseline.md](release-baseline.md). Phase 2 must not begin until
every Phase 0 exit item is evidenced.

## Phase 1 — local infrastructure and database validation

**Goal:** make the local development stack reproducible.

1. Start Docker Desktop and confirm its Linux engine is running.
2. Run `docker compose up -d` and verify PostgreSQL and Redis health.
3. Run `pnpm db:generate`, `pnpm db:migrate`, and `pnpm db:seed:dev`.
4. Start the apps and verify API live/ready/health responses.
5. Use synthetic data to execute the core customer and admin journeys.

**Exit criteria:** services healthy; migrations and seed pass; local smoke test
passes; no new database drift.

## Phase 2 — production-like staging platform

**Goal:** provision isolated infrastructure equivalent to production.

- Create separate staging PostgreSQL, Redis, private object storage, domains,
  TLS, secret-manager entries, and restricted admin ingress.
- Build immutable API/web/admin images and deploy with `NODE_ENV=production`.
- Run `pnpm db:migrate:deploy`; never use development migrations in staging.
- Validate the production environment gate, readiness endpoints, and graceful
  shutdown.

**Exit criteria:** deployment is reachable over HTTPS, secrets are external,
and migrations/health checks pass.

## Phase 3 — approved launch configuration

**Goal:** replace all example data with approved real configuration.

- Obtain legal/compliance approval for the operating model.
- Configure exactly the initial policy type, organization, licence, product,
  version, documents, rate card, availability, disclosures, and consents.
- Reproduce a deterministic quote and, if enabled, deterministic ranking.
- Keep `INSURANCE_PRODUCTION_APPROVED=false` until the evidence is reviewed.

**Exit criteria:** one approved product has complete, reviewable evidence and
no fake pricing or example provider can be exposed.

## Phase 4 — provider sandbox validation

**Goal:** validate each launch provider independently.

- Store sandbox credentials in the secret manager and configure its exact host
  allowlist/product mapping.
- Test authentication, quote mapping, normalization, timeout behavior,
  handoff, return state, callback signature, and replay handling.
- Test provider suspension so one unavailable provider does not affect another.

**Exit criteria:** each provider is independently classified `SANDBOX READY`
or excluded from launch.

## Phase 5 — operational readiness validation

**Goal:** prove safe operation and recovery.

- Execute customer, admin, operations, and support journeys in staging.
- Validate audit evidence, redacted logs, monitoring signals, and alerts.
- Run backup/restore, rollback, provider-outage, database/Redis outage, restart
  recovery, browser/mobile/accessibility, and load checks.

**Exit criteria:** recovery procedures are demonstrated; required alerts fire;
the launch checklist has evidence for every required control.

## Phase 6 — controlled release

**Goal:** minimize initial customer impact.

1. Deploy the immutable release with all insurance features off.
2. Validate production health and admin MFA.
3. Enable only approved admin/operations controls.
4. Enable the single validated policy type for internal test users.
5. Expand through a limited cohort only after monitoring remains healthy.

**Exit criteria:** formal go/no-go approval, completed launch checklist, and a
documented rollback owner.
