# Secure purchase handoff

`POST /insurance/quotes/:quoteId/handoff` is server-side only and requires a valid owned generated quote, unexpired quote validity, active organization and licence, active provider integration and mapping, `REDIRECT_TO_PURCHASE`, data-sharing and redirect consent, and a disclosure acknowledgement.

Setu creates an opaque random state token and stores only its SHA-256 hash. The session expires no later than the quote and is limited by `INSURANCE_HANDOFF_TTL_MINUTES`. Redirect destinations are validated against the configured provider HTTPS host. `REDIRECTED` means the customer left Setu; it is never treated as a purchase or policy issuance.

The return state is atomically consumed: only a still-valid `READY` or
`REDIRECTED` handoff can transition to `ACKNOWLEDGED`. A replayed, expired, or
otherwise invalid state receives the same generic not-found response and cannot
create another return event.
