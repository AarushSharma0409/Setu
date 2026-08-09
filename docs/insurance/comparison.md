# Insurance Sprint I5: comparison and transparent ranking

Comparison is computed solely from I4 normalized quote data. It never creates or
recalculates premiums. Neutral sorting is always distinct from ranking:
`DEFAULT`, insurer name, product name, lowest premium, and highest cover do not
make a recommendation.

Ranking is separately gated by `INSURANCE_RANKING_ENABLED` and the active
operating model's `RANK_QUOTES` capability. It uses a published methodology and
persists the methodology version, deterministic score, rank, and customer-safe
explanation. Commercial arrangements, sponsored placement, and hidden weights
are explicitly excluded.

Customer comparison requires `INSURANCE_COMPARISON_ENABLED` and
`COMPARE_QUOTES`; saved quotes require `INSURANCE_SAVED_QUOTES_ENABLED`. All
routes are private, owner-scoped, and must be served with no-store caching by
the frontend. The maximum side-by-side selection is three quotes.

Available API routes:

```text
GET    /api/v1/insurance/quote-requests/:quoteRequestId/comparison
POST   /api/v1/insurance/quotes/:quoteId/save
DELETE /api/v1/insurance/quotes/:quoteId/save
GET    /api/v1/insurance/saved-quotes
```

The system does not implement insurer integrations, redirects, purchase,
payments, underwriting, policy issuance, recommendations, or paid ranking.
