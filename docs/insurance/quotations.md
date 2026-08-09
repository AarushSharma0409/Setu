# Insurance Sprint I4: quotation foundation

Sprint I4 introduces a deliberately narrow quotation domain. A quote request is
created only from an owned, submitted `InsuranceNeedProfileSnapshot`; mutable
draft answers are not read during quote processing. The API requires the
`COLLECT_CUSTOMER_NEEDS` and `REQUEST_QUOTES` operating-model capabilities and
both `INSURANCE_FEATURE_ENABLED` and `INSURANCE_QUOTATION_ENABLED`.

The initial provider is a versioned internal/manual rate card. Rate-card drafts
are editable only through their draft lifecycle; publishing records the
approving MFA-authenticated administrator, audits the event, and prevents
overlapping published effective periods for the same product version. Pricing
uses Prisma decimal values and stores every calculation input and normalized
result snapshot.

Public endpoints require public-user authentication:

```text
POST /api/v1/insurance/quotes                  (Idempotency-Key required)
GET  /api/v1/insurance/quotes
GET  /api/v1/insurance/quotes/:quoteRequestId
POST /api/v1/insurance/quotes/recalculate      (Idempotency-Key required)
```

Admin operations remain in the MFA and permission boundary:

```text
GET  /api/v1/admin/insurance/quotes
GET  /api/v1/admin/insurance/quotes/:quoteRequestId
POST /api/v1/admin/insurance/quotes/rate-cards
POST /api/v1/admin/insurance/quotes/rate-cards/:rateCardId/publish
```

`GENERATED` quotes are catalogue calculations, not underwriting decisions or a
guarantee of insurer acceptance. They expire at the earliest of the configured
quote TTL, product-version expiry, and rate-card expiry. There is no comparison,
ranking, recommendation, insurer adapter, purchase, payment, or issuance flow.
