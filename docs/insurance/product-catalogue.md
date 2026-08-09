# Insurance product catalogue

Sprint I2 adds the private, versioned configuration records used to describe an insurer product. It contains no premium formula, customer matching, quotation, purchase, policy issuance, claims, or insurer integration code.

Each product belongs to one active insurer organization and one active policy type. Creation and submission verify organization status, licence scope, organization-line mapping, policy-type/line status, and the operating-model `DISPLAY_INSURANCE_PRODUCTS` capability. The catalogue is separately feature-gated by `INSURANCE_PRODUCT_CATALOG_ENABLED`.

Availability is version-scoped. `PAN_INDIA` requires no location rows; selected state/city rows use the existing active Setu location tables and city/state membership is validated.

Product documents are private object-storage records. The API issues short-lived signed read URLs only to authenticated, authorised administrators; no public document endpoint exists.
