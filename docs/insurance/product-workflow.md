# Product workflow

`DRAFT -> PENDING_REVIEW -> ACTIVE` and `PENDING_REVIEW -> REJECTED` are dedicated API operations. `ACTIVE -> WITHDRAWN` requires an audited reason. Direct client status updates are not available.

Before submission, the service centrally checks eligibility, descriptions, coverage, policy-type configuration requirements, premium metadata, exclusions, date validity, location configuration, documents, and operating-model capability. Approval repeats these checks and records the approving administrator.
