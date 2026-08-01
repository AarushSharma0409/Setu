import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "@prisma/client";

import type { AuthenticatedRequest } from "./authenticated-request";
import {
  AdminPermission,
  PERMISSIONS_KEY,
} from "../decorators/permissions.decorator";

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(AdminPermission),
  [AdminRole.OPERATIONS]: [
    AdminPermission.VIEW_VERIFICATION_QUEUE,
    AdminPermission.VIEW_VENDOR,
    AdminPermission.VIEW_VENDOR_DOCUMENTS,
    AdminPermission.APPROVE_VENDOR,
    AdminPermission.REJECT_VENDOR,
    AdminPermission.VIEW_ALL_VENDORS,
    AdminPermission.SUSPEND_VENDOR,
    AdminPermission.VIEW_AUDIT_LOGS,
  ],
  [AdminRole.REVIEWER]: [
    AdminPermission.VIEW_VERIFICATION_QUEUE,
    AdminPermission.VIEW_VENDOR,
    AdminPermission.VIEW_VENDOR_DOCUMENTS,
    AdminPermission.APPROVE_VENDOR,
    AdminPermission.REJECT_VENDOR,
    AdminPermission.VIEW_AUDIT_LOGS,
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.auth?.role as AdminRole | undefined;
    const granted = role ? ROLE_PERMISSIONS[role] : undefined;

    if (
      !granted ||
      !required.every((permission) => granted.includes(permission))
    ) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}

export function permissionsForRole(
  role: AdminRole,
): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role];
}
