# Staging smoke test

Run these non-destructive checks against staging with designated test
accounts and a designated test vendor:

1. `GET /api/v1/health/live`
2. `GET /api/v1/health/ready`
3. Open the public homepage, category, city, and approved vendor profile.
4. Authenticate a test public user and inspect the inquiry dashboard.
5. Authenticate a test vendor and inspect onboarding/status and lead inbox.
6. Authenticate an admin with MFA and inspect system status and the queue.
7. Verify logout and that refresh-token reuse is rejected.

Do not run destructive approval, rejection, suspension, or seed actions against
production during a smoke test.
