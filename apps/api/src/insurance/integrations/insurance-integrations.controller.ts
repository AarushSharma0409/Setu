import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  CreateIntegrationDto,
  CreateProductMappingDto,
  RotateCredentialReferenceDto,
  UpdateIntegrationDto,
} from "./dto/integration.dto";
import { InsuranceIntegrationsFeatureGuard } from "./insurance-integrations-feature.guard";
import { InsuranceIntegrationsService } from "./insurance-integrations.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  AdminPermission,
  Permissions,
} from "../../common/decorators/permissions.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { InsuranceFeatureGuard } from "../insurance-feature.guard";

@Controller("admin/insurance/integrations")
@UseGuards(
  AdminAuthGuard,
  InsuranceFeatureGuard,
  InsuranceIntegrationsFeatureGuard,
  PermissionsGuard,
)
export class InsuranceIntegrationsController {
  constructor(private readonly integrations: InsuranceIntegrationsService) {}

  @Get("dashboard")
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_VIEW)
  dashboard() {
    return this.integrations.dashboard();
  }
  @Get() @Permissions(AdminPermission.INSURANCE_INTEGRATION_VIEW) list() {
    return this.integrations.list();
  }
  @Post()
  @RateLimit({
    key: "insurance-integration-create",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_CREATE)
  create(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreateIntegrationDto,
  ) {
    return this.integrations.create(admin.sub, dto);
  }
  @Get("handoffs")
  @Permissions(AdminPermission.INSURANCE_HANDOFF_VIEW)
  handoffs() {
    return this.integrations.handoffs();
  }
  @Get("events")
  @Permissions(AdminPermission.INSURANCE_PROVIDER_EVENT_VIEW)
  events() {
    return this.integrations.events();
  }
  @Get(":integrationId")
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_VIEW)
  detail(@Param("integrationId", ParseUUIDPipe) id: string) {
    return this.integrations.detail(id);
  }
  @Patch(":integrationId")
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_EDIT)
  update(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.integrations.update(admin.sub, id, dto);
  }
  @Post(":integrationId/credentials/rotate")
  @RateLimit({
    key: "insurance-integration-credential",
    limit: 3,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_CREDENTIAL_MANAGE)
  rotateCredential(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
    @Body() dto: RotateCredentialReferenceDto,
  ) {
    return this.integrations.rotateCredentialReference(admin.sub, id, dto);
  }
  @Post(":integrationId/activate")
  @RateLimit({
    key: "insurance-integration-activate",
    limit: 3,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_ACTIVATE)
  activate(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
  ) {
    return this.integrations.activate(admin.sub, id);
  }
  @Post(":integrationId/suspend")
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_SUSPEND)
  suspend(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
  ) {
    return this.integrations.suspend(admin.sub, id);
  }
  @Get(":integrationId/health")
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_HEALTH_VIEW)
  health(@Param("integrationId", ParseUUIDPipe) id: string) {
    return this.integrations.health(id);
  }
  @Post(":integrationId/products")
  @Permissions(AdminPermission.INSURANCE_INTEGRATION_EDIT)
  createMapping(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
    @Body() dto: CreateProductMappingDto,
  ) {
    return this.integrations.createMapping(admin.sub, id, dto);
  }
  @Get(":integrationId/requests")
  @Permissions(AdminPermission.INSURANCE_PROVIDER_REQUEST_VIEW)
  requests(@Param("integrationId", ParseUUIDPipe) id: string) {
    return this.integrations.requests(id);
  }
}
