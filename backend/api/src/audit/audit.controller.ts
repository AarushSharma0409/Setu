import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { AuditService } from "./audit.service";
import { AuditLogQueryDto } from "./dto/audit-log.dto";
import {
  AdminPermission,
  Permissions,
} from "../common/decorators/permissions.decorator";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";

@Controller("admin/audit-logs")
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Permissions(AdminPermission.VIEW_AUDIT_LOGS)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: AuditLogQueryDto) {
    return this.auditService.list({
      page: query.page,
      pageSize: query.pageSize,
      adminUserId: query.adminUserId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }
}
