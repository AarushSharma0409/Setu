# Insurance Sprint I2 handoff

Enable only in a controlled local environment after configuring an active I1 operating model, an active insurer with a valid line-scoped licence, and an active policy type:

```text
INSURANCE_FEATURE_ENABLED=true
INSURANCE_ADMIN_ENABLED=true
INSURANCE_PRODUCT_CATALOG_ENABLED=true
```

The production environment validator fails closed if insurance feature flags are enabled. This sprint is a product catalogue foundation only; do not use it as a quotation, pricing, comparison, purchase, or policy-management system.
