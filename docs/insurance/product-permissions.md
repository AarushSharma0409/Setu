# Product permissions

- `SUPER_ADMIN`: all product catalogue actions.
- `OPERATIONS`: view, create, edit, create versions, submit, upload/view documents, and manage availability; cannot approve or reject.
- `REVIEWER`: view/review, approve/reject, and view documents; cannot edit or self-submit product data.

All catalogue endpoints require an MFA-authenticated admin token, the existing insurance feature guard, the catalogue feature guard, and the permission guard. The I1 organization-user record exists, but no organization-user authentication boundary was introduced in I1, so organization-user product endpoints are intentionally deferred rather than exposing product controls through public-user authentication.
