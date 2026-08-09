# Insurance rollback and migration procedure

## Triggers

Roll back or disable the affected subsystem for a critical security issue,
wrong premium, wrong product/provider mapping, systemic quote corruption,
handoff misrouting, consent/disclosure failure, or sensitive-data exposure.

## Procedure

1. Record the incident and preserve redacted request/audit evidence.
2. Disable the narrowest safe feature flag or suspend the affected provider.
3. Stop rollout and keep the current schema state intact.
4. Roll application images/configuration back only to a version compatible
   with the deployed schema; prefer a forward database fix over a destructive
   migration reversal.
5. Rotate affected secrets through the secret manager where applicable.
6. Verify liveness, readiness, admin MFA, protected access, and read-only
   insurance views before gradual traffic restoration.

## Validation requirement

Run this drill in a production-like environment with immutable image tags and
a clean release candidate. It was not run for `insurance-rc1-uncommitted`.
