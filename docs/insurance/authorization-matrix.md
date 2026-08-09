# Insurance authorization matrix

| Actor                   | Allowed scope                                                                                     | Explicitly denied                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Unauthenticated visitor | Feature-gated policy-type discovery and handoff return state lookup                               | Assessments, quotes, handoff creation, admin routes, private documents                               |
| Public customer         | Own assessments, consent/disclosure evidence, quote requests, saved quotes, and handoffs          | Other customers' records, organization/admin data, provider configuration                            |
| Organization user       | No insurance organization self-service role is implemented                                        | Admin identity, provider credentials, rate-card/ranking publication                                  |
| Reviewer                | Read/review permissions defined in the centralized guard                                          | Provider credential changes, provider activation/suspension, sensitive operations without permission |
| Operations admin        | Scoped operations, support references, product/integration controls granted by `PermissionsGuard` | Super-admin-only permissions                                                                         |
| Super admin             | All declared permissions, MFA-backed                                                              | Bypass of feature gates, audit writes through ordinary CRUD                                          |
| Provider callback       | No live public callback endpoint                                                                  | Customer/admin bearer privileges and generic callback acceptance                                     |

Every protected controller applies its authentication guard before feature and
permission checks. Services additionally scope customer records by `userId` and
organization-linked records by `organizationId`; UUID parsing does not confer
ownership.
