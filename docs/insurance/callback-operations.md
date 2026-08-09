# Callback operations

Callback lists and details show safe metadata only: provider, event identity,
signature/replay result, processing status, mapped state, timestamps, and a
safe error. Raw payloads and secrets remain unavailable.

Reprocessing is separately feature-gated by
`INSURANCE_CALLBACK_REPROCESS_ENABLED`, requires a failed event, reason,
MFA-backed session, permission, and audit trail. The shipped mock adapter has
no provider-specific replay contract, so I7 rejects reprocess safely rather
than changing a callback state directly. A real adapter must add an idempotent,
signature-preserving domain replay before this action can be enabled.
