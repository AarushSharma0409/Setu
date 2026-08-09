# Customer support lookup

Support search is exact and rate limited. It accepts an assessment, quote, or
handoff reference, or an exact email/phone identifier. Broad wildcard browsing
is not supported. Results contain an opaque customer reference, masked contact
information, and a minimum-necessary insurance timeline.

Sensitive assessment answers are neither selected nor embedded in the support
page. A future sensitive-view workflow must require
`INSURANCE_SUPPORT_SENSITIVE_VIEW`, a reason, and a separate audit event.
