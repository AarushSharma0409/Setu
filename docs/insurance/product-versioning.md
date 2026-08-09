# Product versioning

The product master is a stable insurer/policy-type identity. Customer-facing catalogue content belongs to `InsuranceProductVersion` and its version-scoped coverage, eligibility, sum-insured, premium-basis metadata, waiting period, exclusion, add-on, deductible, availability, and document records.

Submitted and approved versions are immutable. A new draft can be created only from an approved current version; version numbers increase monotonically. Approval rechecks completeness and rejects overlapping approved effective periods. The current operational version is the approved version whose effective dates contain the evaluation time; future and expired versions are not treated as active.
