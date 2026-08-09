# Provider adapters

Adapters expose health and purchase-handoff support through an explicit registry. Controllers and customer applications never call provider APIs directly. Provider request mapping, response normalization, error categorisation, authentication, callback verification, and status polling belong to a dedicated adapter once a provider contract is supplied.

No generic authentication or webhook signature scheme has been invented. Implement only the provider's documented scheme and preserve no raw credential or sensitive payload in logs.
