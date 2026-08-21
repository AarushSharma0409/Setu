import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";

import { AdminCatalogService } from "./admin-catalog.service";
import { CreateCategoryDto, CreateCityDto, CreateStateDto, SetCatalogStatusDto } from "./dto/admin-catalog.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AdminPermission, Permissions } from "../common/decorators/permissions.decorator";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PermissionsGuard } from "../common/guards/permissions.guard";

@Controller("admin/catalog")
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Permissions(AdminPermission.MANAGE_CATALOGUE)
export class AdminCatalogController {
  constructor(private readonly service: AdminCatalogService) {}
  @Get() overview() { return this.service.overview(); }
  @Post("categories") category(@CurrentUser() admin: AuthenticatedPrincipal, @Body() dto: CreateCategoryDto) { return this.service.createCategory(admin.sub, dto); }
  @Patch("categories/:id/status") categoryStatus(@CurrentUser() admin: AuthenticatedPrincipal, @Param("id", ParseUUIDPipe) id: string, @Body() dto: SetCatalogStatusDto) { return this.service.setCategoryStatus(admin.sub, id, dto); }
  @Post("states") state(@CurrentUser() admin: AuthenticatedPrincipal, @Body() dto: CreateStateDto) { return this.service.createState(admin.sub, dto); }
  @Post("cities") city(@CurrentUser() admin: AuthenticatedPrincipal, @Body() dto: CreateCityDto) { return this.service.createCity(admin.sub, dto); }
  @Patch("cities/:id/status") cityStatus(@CurrentUser() admin: AuthenticatedPrincipal, @Param("id", ParseUUIDPipe) id: string, @Body() dto: SetCatalogStatusDto) { return this.service.setCityStatus(admin.sub, id, dto); }
}
