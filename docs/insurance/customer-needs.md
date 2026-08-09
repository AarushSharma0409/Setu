# Customer needs assessments

Sprint I3 stores a user-owned, versioned assessment separately from products, eligibility, and quotes. Draft answers are server-backed; submitted assessments create an immutable snapshot for a later quote workflow.

Health-sensitive answer values are AES-256-GCM encrypted with `INSURANCE_SENSITIVE_DATA_ENCRYPTION_KEY`. They are never placed in audit metadata or public list responses.
