# Provider security

Provider endpoints must be admin-configured public HTTPS URLs without credentials, fragments, loopback, link-local, reserved, or private-network hosts. When integrations are enabled, the endpoint host must exactly match `INSURANCE_PROVIDER_ALLOWED_HOSTS`. Redirects must resolve to the configured provider host and port. The offline adapter does not make outbound requests. Production egress controls must additionally defend against DNS rebinding.

Credential values belong in an approved secret manager. Setu stores only a reference, version, and rotation timestamp. Audit metadata redacts credential references, API keys, authorization headers, state tokens, and webhook signatures.
