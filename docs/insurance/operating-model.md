# Insurance operating model

Insurance Sprint I1 is an internal configuration foundation. It does not
enable customer insurance journeys, quotations, product display, premium
calculation, payment, purchase, issuance, or claims.

`InsuranceOperatingModel` is versioned by legal entity and jurisdiction. A
draft may be edited; activation makes it immutable and archives a prior active
version for the same entity and jurisdiction. The API allows only one active
version at a time.

Capabilities are explicit and fail closed. A future insurance endpoint must use
`InsuranceCapabilityService.assertEnabled()` before it performs an operation.
Having endpoint code does not grant a capability. The default seed creates a
draft-only illustrative model with no permitted capabilities and no regulatory
assertion.

Both `INSURANCE_FEATURE_ENABLED` and `INSURANCE_ADMIN_ENABLED` must be true for
the protected admin API to be available. Production validation rejects either
flag, so enabling insurance requires an intentional production-control review.
