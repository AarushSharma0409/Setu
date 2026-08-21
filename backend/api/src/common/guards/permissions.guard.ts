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
    AdminPermission.REACTIVATE_VENDOR,
    AdminPermission.MANAGE_CATALOGUE,
    AdminPermission.VIEW_AUDIT_LOGS,
    AdminPermission.INSURANCE_OPERATING_MODEL_VIEW,
    AdminPermission.INSURANCE_ORGANIZATION_VIEW,
    AdminPermission.INSURANCE_ORGANIZATION_CREATE,
    AdminPermission.INSURANCE_ORGANIZATION_REVIEW,
    AdminPermission.INSURANCE_DOCUMENT_VIEW,
    AdminPermission.INSURANCE_POLICY_TYPE_VIEW,
    AdminPermission.INSURANCE_DISCLOSURE_VIEW,
    AdminPermission.INSURANCE_PRODUCT_VIEW,
    AdminPermission.INSURANCE_PRODUCT_CREATE,
    AdminPermission.INSURANCE_PRODUCT_EDIT,
    AdminPermission.INSURANCE_PRODUCT_SUBMIT,
    AdminPermission.INSURANCE_PRODUCT_REVIEW,
    AdminPermission.INSURANCE_PRODUCT_VERSION_CREATE,
    AdminPermission.INSURANCE_PRODUCT_DOCUMENT_VIEW,
    AdminPermission.INSURANCE_PRODUCT_DOCUMENT_UPLOAD,
    AdminPermission.INSURANCE_PRODUCT_AVAILABILITY_MANAGE,
    AdminPermission.INSURANCE_QUOTE_VIEW,
    AdminPermission.INSURANCE_RATE_CARD_MANAGE,
    AdminPermission.INSURANCE_COMPARISON_VIEW,
    AdminPermission.INSURANCE_RANKING_VIEW,
    AdminPermission.INSURANCE_RANKING_MANAGE,
    AdminPermission.INSURANCE_INTEGRATION_VIEW,
    AdminPermission.INSURANCE_INTEGRATION_CREATE,
    AdminPermission.INSURANCE_INTEGRATION_EDIT,
    AdminPermission.INSURANCE_INTEGRATION_HEALTH_VIEW,
    AdminPermission.INSURANCE_PROVIDER_REQUEST_VIEW,
    AdminPermission.INSURANCE_PROVIDER_FAILURE_VIEW,
    AdminPermission.INSURANCE_HANDOFF_VIEW,
    AdminPermission.INSURANCE_PROVIDER_EVENT_VIEW,
    AdminPermission.INSURANCE_OPERATIONS_DASHBOARD_VIEW,
    AdminPermission.INSURANCE_QUOTE_OPERATIONS_VIEW,
    AdminPermission.INSURANCE_PROVIDER_OPERATIONS_VIEW,
    AdminPermission.INSURANCE_PROVIDER_OPERATIONS_HEALTH_CHECK,
    AdminPermission.INSURANCE_CALLBACK_OPERATIONS_VIEW,
    AdminPermission.INSURANCE_HANDOFF_OPERATIONS_VIEW,
    AdminPermission.INSURANCE_SUPPORT_VIEW,
    AdminPermission.INSURANCE_EVIDENCE_VIEW,
  ],
  [AdminRole.REVIEWER]: [
    AdminPermission.VIEW_VERIFICATION_QUEUE,
    AdminPermission.VIEW_VENDOR,
    AdminPermission.VIEW_VENDOR_DOCUMENTS,
    AdminPermission.APPROVE_VENDOR,
    AdminPermission.REJECT_VENDOR,
    AdminPermission.VIEW_AUDIT_LOGS,
    AdminPermission.INSURANCE_ORGANIZATION_VIEW,
    AdminPermission.INSURANCE_ORGANIZATION_REVIEW,
    AdminPermission.INSURANCE_DOCUMENT_VIEW,
    AdminPermission.INSURANCE_DOCUMENT_REVIEW,
    AdminPermission.INSURANCE_PRODUCT_VIEW,
    AdminPermission.INSURANCE_PRODUCT_REVIEW,
    AdminPermission.INSURANCE_PRODUCT_APPROVE,
    AdminPermission.INSURANCE_PRODUCT_REJECT,
    AdminPermission.INSURANCE_PRODUCT_DOCUMENT_VIEW,
    AdminPermission.INSURANCE_QUOTE_VIEW,
    AdminPermission.INSURANCE_COMPARISON_VIEW,
    AdminPermission.INSURANCE_RANKING_VIEW,
    AdminPermission.INSURANCE_INTEGRATION_VIEW,
    AdminPermission.INSURANCE_INTEGRATION_HEALTH_VIEW,
    AdminPermission.INSURANCE_PROVIDER_REQUEST_VIEW,
    AdminPermission.INSURANCE_HANDOFF_VIEW,
    AdminPermission.INSURANCE_PROVIDER_EVENT_VIEW,
    AdminPermission.INSURANCE_OPERATIONS_DASHBOARD_VIEW,
    AdminPermission.INSURANCE_QUOTE_OPERATIONS_VIEW,
    AdminPermission.INSURANCE_PROVIDER_OPERATIONS_VIEW,
    AdminPermission.INSURANCE_CALLBACK_OPERATIONS_VIEW,
    AdminPermission.INSURANCE_HANDOFF_OPERATIONS_VIEW,
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
