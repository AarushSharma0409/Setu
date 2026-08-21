import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminRole } from "@prisma/client";

import { AdminManagementService } from "./admin-management.service";
import { CreateAdminUserDto, SetAdminPasswordDto, UpdateAdminUserDto } from "./dto/admin-management.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AdminPermission, Permissions } from "../common/decorators/permissions.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RolesGuard } from "../common/guards/roles.guard";

@Controller("admin/admin-users")
@UseGuards(AdminAuthGuard, PermissionsGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)
@Permissions(AdminPermission.MANAGE_ADMIN_USERS)
export class AdminManagementController {
  constructor(private readonly service: AdminManagementService) {}
  @Get() list() { return this.service.list(); }
  @Post() create(@CurrentUser() admin: AuthenticatedPrincipal, @Body() dto: CreateAdminUserDto) { return this.service.create(admin.sub, dto); }
  @Patch(":adminId") update(@CurrentUser() admin: AuthenticatedPrincipal, @Param("adminId", ParseUUIDPipe) id: string, @Body() dto: UpdateAdminUserDto) { return this.service.update(admin.sub, id, dto); }
  @Post(":adminId/password") setPassword(@CurrentUser() admin: AuthenticatedPrincipal, @Param("adminId", ParseUUIDPipe) id: string, @Body() dto: SetAdminPasswordDto) { return this.service.setPassword(admin.sub, id, dto); }
}
