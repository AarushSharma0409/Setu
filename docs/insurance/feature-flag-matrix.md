# Insurance feature-flag matrix

All flags are API-only and default to `false`. Production enablement also
requires `INSURANCE_PRODUCTION_APPROVED=true`; that approval gate does not
replace legal, provider, backup, monitoring, or operations evidence. The owner
below is the Setu release owner; a production change requires the relevant
business, security, and operations approval.

| Flag                                      | Owner                    | Dependency                               | Safe-off behavior                                | Rollback use                |
| ----------------------------------------- | ------------------------ | ---------------------------------------- | ------------------------------------------------ | --------------------------- |
| `INSURANCE_FEATURE_ENABLED`               | Release owner            | Approved operating model                 | Insurance domain fails closed                    | Global insurance stop       |
| `INSURANCE_PRODUCT_CATALOG_ENABLED`       | Product operations       | Global flag, approved content            | Catalogue unavailable; records retained          | Hide product configuration  |
| `INSURANCE_CUSTOMER_NEEDS_ENABLED`        | Product operations       | Global flag, approved policy type        | New assessments blocked; stored records retained | Stop collection             |
| `INSURANCE_QUOTATION_ENABLED`             | Pricing owner            | Needs, approved products/rate cards      | New/recalculated quotes blocked                  | Pricing incident isolation  |
| `INSURANCE_COMPARISON_ENABLED`            | Product owner            | Quotations                               | Comparison unavailable; quotes retained          | Comparison rollback         |
| `INSURANCE_RANKING_ENABLED`               | Product/compliance owner | Comparison, approved methodology         | Neutral comparison remains available             | Ranking defect isolation    |
| `INSURANCE_SAVED_QUOTES_ENABLED`          | Product owner            | Quotations                               | Saved-quote feature unavailable                  | Non-critical rollback       |
| `INSURANCE_PROVIDER_INTEGRATIONS_ENABLED` | Integration owner        | Approved provider allowlist/secrets      | Provider operations fail closed                  | Stop provider connectivity  |
| `INSURANCE_PURCHASE_HANDOFF_ENABLED`      | Integration owner        | Provider integration, consent/disclosure | New handoffs blocked; history retained           | Stop continuation flow      |
| `INSURANCE_OPERATIONS_ENABLED`            | Operations owner         | Admin MFA and permissions                | Operations workspace unavailable                 | Limit privileged operations |

Provider-specific suspension is the preferred response to a single-provider
incident. Global disable is reserved for systemic risk, wrong pricing, data
exposure, or a broader integrity issue.
