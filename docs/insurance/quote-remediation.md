# Quote investigation and remediation

Operations can list and inspect quote requests, including their lifecycle,
attempt state, source/version context, and safe failure grouping. Failure
groups are stable operational labels and never include stack traces.

Retry and recalculation are distinct. Retry is reserved for a proven transient
provider failure and is controlled by `INSURANCE_OPERATIONS_RETRY_ENABLED`.
Recalculation creates a new quote request through the quotation domain with an
operations idempotency key; the old request remains historical evidence.

The I7 provider foundation has no live quote-provider adapter. Therefore quote
retry is explicitly rejected and audited instead of simulating a successful
provider retry. Recalculation is available only when the normal quote domain
permits it. Never use an operations screen to edit premiums, rate cards, or
quote state.
