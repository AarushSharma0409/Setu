import { SetMetadata } from "@nestjs/common";

export enum AdminPermission {
  VIEW_VERIFICATION_QUEUE = "admin:vendors:queue",
  VIEW_VENDOR = "admin:vendors:view",
  VIEW_VENDOR_DOCUMENTS = "admin:vendors:documents",
  APPROVE_VENDOR = "admin:vendors:approve",
  REJECT_VENDOR = "admin:vendors:reject",
  VIEW_ALL_VENDORS = "admin:vendors:list",
  SUSPEND_VENDOR = "admin:vendors:suspend",
  VIEW_AUDIT_LOGS = "admin:audit:read",
}

export const PERMISSIONS_KEY = "admin_permissions";

export const Permissions = (...permissions: AdminPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
