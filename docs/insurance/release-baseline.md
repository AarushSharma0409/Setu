# Insurance release baseline

**Status:** BLOCKED — release candidate is not yet immutable.

**Created:** 2026-08-08

## Current technical baseline

| Item                     | Recorded value                                           | Status                                                         |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------- |
| Repository commit        | `c7463e62a01f`                                           | Reference only; the working tree contains uncommitted changes. |
| Local services           | PostgreSQL 16 and Redis 7 running through Docker Compose | Verified 2026-08-08.                                           |
| Database migrations      | 15 migrations recognized as up to date                   | Verified 2026-08-08.                                           |
| Development fixtures     | Public, admin, and draft-only insurance fixtures seeded  | Verified 2026-08-08.                                           |
| API readiness            | PostgreSQL and Redis reported `up`                       | Verified 2026-08-08.                                           |
| Production approval gate | `INSURANCE_PRODUCTION_APPROVED` defaults to `false`      | Must remain false until approvals below are evidenced.         |

This document is an execution record, not an authorization to launch.

## Required release identity

Before staging deployment, record all of the following here:

| Field                      | Required value                                    |
| -------------------------- | ------------------------------------------------- |
| Release name               | Pending                                           |
| Immutable Git commit SHA   | Pending — commit the reviewed working tree first. |
| Immutable image digests    | Pending — produced by the staging build.          |
| Change summary             | Pending                                           |
| Release manager            | Workspace technical owner (interim)               |
| Target staging environment | Pending                                           |

## Required accountable owners

Each role needs one named person and a backup before Phase 0 can close.

| Accountability                                      | Primary owner                       | Backup  | Evidence / approval                                                                |
| --------------------------------------------------- | ----------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| Product scope and cohort                            | Workspace technical owner (interim) | Pending | Initial scope is at least 2–3 policies; policy types and cohort remain unapproved. |
| Insurance operating model and regulatory compliance | Pending                             | Pending | Written compliance approval                                                        |
| Pricing, products, disclosures, and consent text    | Pending                             | Pending | Versioned product evidence                                                         |
| Provider relationship and credentials               | Pending                             | Pending | Sandbox readiness evidence                                                         |
| Infrastructure and deployment                       | Workspace technical owner (interim) | Pending | Staging build and deployment evidence                                              |
| Security and access control                         | Workspace technical owner (interim) | Pending | Security review and secret-management evidence                                     |
| Operations, support, and incident response          | Pending                             | Pending | On-call and runbook acknowledgement                                                |

## Scope decisions required

Do not enable customer-facing insurance features until these are explicitly
approved and written into the release record:

1. The initial 2–3 policy types and customer cohort.
2. The legal operating model, licensed entity, and permitted jurisdictions.
3. The exact provider or providers included in launch, or a decision to keep
   provider handoff disabled.
4. Whether quote comparison/ranking is enabled for the initial cohort.
5. The support escalation path and the person authorized to activate the
   production approval gate.

## Staging preparation

The repository-side deployment preparation is documented in
[staging-deployment.md](staging-deployment.md). Infrastructure provisioning is
pending cloud, DNS, registry, and access-boundary decisions; it must remain
isolated from production.

## Phase 0 exit checklist

- [ ] The reviewed workspace changes are committed.
- [ ] A release commit SHA and immutable build images are recorded. Release commit has not yet been authorized.
- [ ] Every accountable owner and backup above is named. The workspace technical owner is the interim release manager and technical/infrastructure/security owner.
- [ ] Launch policy type, cohort, jurisdiction, operating model, and provider scope are approved.
- [ ] Quality checks pass for the committed release candidate.
- [ ] The release manager has attached evidence to the launch checklist.

Once all items are complete, update the status to `READY FOR PHASE 2` and link
the completed evidence in [launch-checklist.md](launch-checklist.md).
