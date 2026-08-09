# Insurance administration permissions

All insurance routes require an active admin account, an admin-audience JWT,
an MFA-authenticated session, the server-side insurance feature gate, and an
explicit insurance permission.

- `SUPER_ADMIN` receives all insurance permissions.
- `OPERATIONS` can view the operating model, create and review organizations,
  view documents and policy types, and view disclosures. It cannot activate an
  operating model, approve or suspend an organization, publish templates, or
  manage policy types.
- `REVIEWER` can view and review organizations and documents only.

Permissions are not inferred from UI visibility. Attempts with a public token,
an incomplete MFA challenge, or an insufficient role are rejected by the API.
