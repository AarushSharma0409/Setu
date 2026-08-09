import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  AdminPermission,
  Permissions,
} from "../../common/decorators/permissions.decorator";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { InsuranceFeatureGuard } from "../insurance-feature.guard";
import { CreateRateCardDto } from "./dto/rate-card.dto";
import { InsuranceQuotationsFeatureGuard } from "./insurance-quotations-feature.guard";
import { InsuranceQuotationsService } from "./insurance-quotations.service";

@Controller("admin/insurance/quotes")
@UseGuards(
  AdminAuthGuard,
  InsuranceFeatureGuard,
  InsuranceQuotationsFeatureGuard,
  PermissionsGuard,
)
export class InsuranceQuoteOperationsController {
  constructor(private readonly quotations: InsuranceQuotationsService) {}

  @Get()
  @Permissions(AdminPermission.INSURANCE_QUOTE_VIEW)
  list() {
    return this.quotations.adminList();
  }

  @Get(":quoteRequestId")
  @Permissions(AdminPermission.INSURANCE_QUOTE_VIEW)
  detail(@Param("quoteRequestId", ParseUUIDPipe) id: string) {
    return this.quotations.adminDetail(id);
  }

  @Post("rate-cards")
  @Permissions(AdminPermission.INSURANCE_RATE_CARD_MANAGE)
  createRateCard(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreateRateCardDto,
  ) {
    return this.quotations.createRateCard(admin.sub, dto);
  }

  @Post("rate-cards/:rateCardId/publish")
  @Permissions(AdminPermission.INSURANCE_RATE_CARD_MANAGE)
  publishRateCard(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("rateCardId", ParseUUIDPipe) id: string,
  ) {
    return this.quotations.publishRateCard(admin.sub, id);
  }
}
