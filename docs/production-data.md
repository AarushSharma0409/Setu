# Production provider data

Production must contain reviewed provider records, not development fixtures.
The development seed is disabled by default and production seed execution
rejects `SEED_PUBLIC_FIXTURES=true`.

For each provider, the operations owner should verify:

- legal/business name and public display name;
- approved categories and service descriptions;
- primary city and service areas;
- public phone, email, website, and support contact consent;
- business registration/GST/PAN/address documents;
- reviewer identity, decision, review date, and expiry reminders;
- the provider's confirmation that the published information is accurate.

Enter records through the authenticated vendor onboarding flow, then approve
them in the admin verification queue. If a bulk import is later needed, it must
reuse the same validation and review states; do not insert approved rows
directly into PostgreSQL. Remove all `example.com`, reserved phone numbers,
demo inquiries, and placeholder Setu contact values before the first public
deployment.
