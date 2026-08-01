# Testing and validation

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

API unit tests cover tokens, hashing, environment validation, role/permission
guards, TOTP encryption, and inquiry/public-discovery state rules. API E2E
tests cover health, development-login blocking, token separation, refresh and
logout behavior, MFA challenge rejection, vendor onboarding, and admin-token
rejection on vendor routes.

Browser journey, axe accessibility, visual-regression, load, backup, and
restore suites require environment-specific infrastructure and must be run as
release-gate checks before launch.
