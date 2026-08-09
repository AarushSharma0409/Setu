# Insurance RC regression matrix

Release candidate: `insurance-rc1-uncommitted`. This matrix records executed
automation separately from deployment, browser, provider, and operational
validation. A passing automated check is not a production-launch approval.

| Area                    | Automated                                                        | Manual                               | Result               | Evidence                        | Blocker?                       |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------ | -------------------- | ------------------------------- | ------------------------------ |
| Marketplace MVP         | Unit and API integration suites                                  | Not run against a live stack         | PASS (automated)     | Root test and integration suite | No automated blocker found     |
| I1 operating model      | Capability, permission, encryption tests                         | Not run                              | PASS (automated)     | API unit suite                  | Production data absent         |
| I2 products             | Product policy tests                                             | Not run                              | PASS (automated)     | API unit suite                  | Production product unavailable |
| I3 needs                | Needs policy tests                                               | Not run                              | PASS (automated)     | API unit suite                  | Customer journey blocked       |
| I4 quotations           | Quotation code compiled; feature policy regression               | Not run                              | PASS (automated)     | Production build and API suite  | Quote reproducibility not run  |
| I5 comparison/ranking   | Comparison code compiled                                         | Not run                              | PASS (automated)     | Production build                | Ranking reproduction not run   |
| I6 integrations/handoff | Adapter, URL, handoff-state tests                                | No sandbox                           | PASS (mock/security) | API unit suite                  | No launch provider             |
| I7 operations/support   | Permission and build regression                                  | Not run                              | PASS (automated)     | API unit/build suites           | No deployed operations stack   |
| I8 UI/UX                | UI primitive/frontend render tests                               | Browser/device review not run        | PASS (automated)     | Web/admin/UI suites             | Browser validation absent      |
| I9 security             | Tokens, MFA, permissions, limits, redaction, SSRF, handoff tests | Header/log deployment review not run | PASS (automated)     | API unit/integration suite      | External validation absent     |

The release cannot advance while any item marked as a blocker remains
unverified in a production-like environment.
