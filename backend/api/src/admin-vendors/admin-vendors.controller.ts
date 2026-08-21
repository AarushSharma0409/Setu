import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminRole } from "@prisma/client";

import { AdminVendorsService } from "./admin-vendors.service";
import {
  ApproveVendorDto,
  RejectVendorDto,
  SuspendVendorDto,
  ReactivateVendorDto,
  VendorVerificationQueueQueryDto,
} from "./dto/vendor-verification.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
  AdminPermission,
  Permissions,
} from "../common/decorators/permissions.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RolesGuard } from "../common/guards/roles.guard";

@Controller("admin/vendors")
@UseGuards(AdminAuthGuard, PermissionsGuard, RolesGuard)
export class AdminVendorsController {
  constructor(private readonly adminVendorsService: AdminVendorsService) {}

  @Get("verification-queue")
  @Permissions(AdminPermission.VIEW_VERIFICATION_QUEUE)
  verificationQueue(@Query() query: VendorVerificationQueueQueryDto) {
    return this.adminVendorsService.queue(query);
  }

  @Get()
  @Permissions(AdminPermission.VIEW_ALL_VENDORS)
  list(@Query() query: VendorVerificationQueueQueryDto) {
    return this.adminVendorsService.list(query);
  }

  @Get(":vendorId")
  @Permissions(AdminPermission.VIEW_VENDOR)
  detail(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("vendorId", ParseUUIDPipe) vendorId: string,
  ) {
    return this.adminVendorsService.detail(admin.sub, vendorId);
  }

  @Post(":vendorId/documents/:documentId/access")
  @Permissions(AdminPermission.VIEW_VENDOR_DOCUMENTS)
  documentAccess(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("vendorId", ParseUUIDPipe) vendorId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.adminVendorsService.documentAccess(
      admin.sub,
      vendorId,
      documentId,
    );
  }

  @Post(":vendorId/approve")
  @Permissions(AdminPermission.APPROVE_VENDOR)
  approve(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("vendorId", ParseUUIDPipe) vendorId: string,
    @Body() dto: ApproveVendorDto,
  ) {
    return this.adminVendorsService.approve(admin.sub, vendorId, dto);
  }

  @Post(":vendorId/reject")
  @Permissions(AdminPermission.REJECT_VENDOR)
  reject(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("vendorId", ParseUUIDPipe) vendorId: string,
    @Body() dto: RejectVendorDto,
  ) {
    return this.adminVendorsService.reject(admin.sub, vendorId, dto);
  }

  @Post(":vendorId/suspend")
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS)
  @Permissions(AdminPermission.SUSPEND_VENDOR)
  suspend(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("vendorId", ParseUUIDPipe) vendorId: string,
    @Body() dto: SuspendVendorDto,
  ) {
    return this.adminVendorsService.suspend(admin.sub, vendorId, dto);
  }

  @Post(":vendorId/reactivate")
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS)
  @Permissions(AdminPermission.REACTIVATE_VENDOR)
  reactivate(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("vendorId", ParseUUIDPipe) vendorId: string,
    @Body() dto: ReactivateVendorDto,
  ) {
    return this.adminVendorsService.reactivate(admin.sub, vendorId, dto);
  }
}
