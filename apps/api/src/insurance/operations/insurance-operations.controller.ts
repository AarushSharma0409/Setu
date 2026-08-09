import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import {
  HandoffOperationsListDto,
  OperationsListDto,
  OperationsWindowDto,
  QuoteOperationsListDto,
  RemediationReasonDto,
  SupportSearchDto,
} from "./dto/operations.dto";
import { InsuranceOperationsFeatureGuard } from "./insurance-operations-feature.guard";
import { InsuranceOperationsService } from "./insurance-operations.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  AdminPermission,
  Permissions,
} from "../../common/decorators/permissions.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PermissionsGuard } from "../../common/guards/permissions.guard";

@Controller("admin/insurance/operations")
@UseGuards(AdminAuthGuard, InsuranceOperationsFeatureGuard, PermissionsGuard)
export class InsuranceOperationsController {
  constructor(private readonly operations: InsuranceOperationsService) {}
  @Get("summary")
  @Permissions(AdminPermission.INSURANCE_OPERATIONS_DASHBOARD_VIEW)
  summary(@Query() query: OperationsWindowDto) {
    return this.operations.summary(query);
  }
  @Get("quotes")
  @Permissions(AdminPermission.INSURANCE_QUOTE_OPERATIONS_VIEW)
  quotes(@Query() query: QuoteOperationsListDto) {
    return this.operations.quotes(query);
  }
  @Get("quotes/:quoteRequestId")
  @Permissions(AdminPermission.INSURANCE_QUOTE_OPERATIONS_VIEW)
  quoteDetail(@Param("quoteRequestId", ParseUUIDPipe) id: string) {
    return this.operations.quoteDetail(id);
  }
  @Post("quotes/:quoteRequestId/retry")
  @RateLimit({
    key: "insurance-operations-quote-retry",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_QUOTE_OPERATIONS_RETRY)
  retryQuote(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("quoteRequestId", ParseUUIDPipe) id: string,
    @Body() reason: RemediationReasonDto,
  ) {
    return this.operations.retryQuote(admin.sub, id, reason);
  }
  @Post("quotes/:quoteRequestId/recalculate")
  @RateLimit({
    key: "insurance-operations-quote-recalculate",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_QUOTE_OPERATIONS_RECALCULATE)
  recalculateQuote(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("quoteRequestId", ParseUUIDPipe) id: string,
    @Body() reason: RemediationReasonDto,
  ) {
    return this.operations.recalculateQuote(admin.sub, id, reason);
  }
  @Get("providers")
  @Permissions(AdminPermission.INSURANCE_PROVIDER_OPERATIONS_VIEW)
  providers(@Query() query: OperationsListDto) {
    return this.operations.providers(query);
  }
  @Get("providers/:integrationId")
  @Permissions(AdminPermission.INSURANCE_PROVIDER_OPERATIONS_VIEW)
  providerDetail(
    @Param("integrationId", ParseUUIDPipe) id: string,
    @Query() query: OperationsWindowDto,
  ) {
    return this.operations.providerDetail(id, query);
  }
  @Post("providers/:integrationId/health-check")
  @Permissions(AdminPermission.INSURANCE_PROVIDER_OPERATIONS_HEALTH_CHECK)
  healthCheck(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
    @Body() reason: RemediationReasonDto,
  ) {
    return this.operations.healthCheck(admin.sub, id, reason);
  }
  @Post("providers/:integrationId/suspend")
  @Permissions(AdminPermission.INSURANCE_PROVIDER_OPERATIONS_SUSPEND)
  suspendProvider(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
    @Body() reason: RemediationReasonDto,
  ) {
    return this.operations.suspendProvider(admin.sub, id, reason);
  }
  @Post("providers/:integrationId/reactivate")
  @Permissions(AdminPermission.INSURANCE_PROVIDER_OPERATIONS_REACTIVATE)
  reactivateProvider(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("integrationId", ParseUUIDPipe) id: string,
    @Body() reason: RemediationReasonDto,
  ) {
    return this.operations.reactivateProvider(admin.sub, id, reason);
  }
  @Get("callbacks")
  @Permissions(AdminPermission.INSURANCE_CALLBACK_OPERATIONS_VIEW)
  callbacks(@Query() query: OperationsListDto) {
    return this.operations.callbacks(query);
  }
  @Get("callbacks/:eventId")
  @Permissions(AdminPermission.INSURANCE_CALLBACK_OPERATIONS_VIEW)
  callbackDetail(@Param("eventId", ParseUUIDPipe) id: string) {
    return this.operations.callbackDetail(id);
  }
  @Post("callbacks/:eventId/reprocess")
  @Permissions(AdminPermission.INSURANCE_CALLBACK_OPERATIONS_REPROCESS)
  reprocessCallback(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("eventId", ParseUUIDPipe) id: string,
    @Body() reason: RemediationReasonDto,
  ) {
    return this.operations.reprocessCallback(admin.sub, id, reason);
  }
  @Get("handoffs")
  @Permissions(AdminPermission.INSURANCE_HANDOFF_OPERATIONS_VIEW)
  handoffs(@Query() query: HandoffOperationsListDto) {
    return this.operations.handoffList(query);
  }
  @Get("handoffs/:handoffId")
  @Permissions(AdminPermission.INSURANCE_HANDOFF_OPERATIONS_VIEW)
  handoffDetail(@Param("handoffId", ParseUUIDPipe) id: string) {
    return this.operations.handoffDetail(id);
  }
  @Post("handoffs/:handoffId/retry")
  @Permissions(AdminPermission.INSURANCE_HANDOFF_OPERATIONS_RETRY)
  retryHandoff(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("handoffId", ParseUUIDPipe) id: string,
    @Body() reason: RemediationReasonDto,
  ) {
    return this.operations.retryHandoff(admin.sub, id, reason);
  }
  @Get("support/search")
  @RateLimit({ key: "insurance-support-search", limit: 20, windowSeconds: 300 })
  @Permissions(AdminPermission.INSURANCE_SUPPORT_VIEW)
  supportSearch(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Query() query: SupportSearchDto,
  ) {
    return this.operations.supportSearch(admin.sub, query);
  }
  @Get("support/users/:userId")
  @Permissions(AdminPermission.INSURANCE_SUPPORT_VIEW)
  supportUser(@Param("userId", ParseUUIDPipe) id: string) {
    return this.operations.supportUser(id);
  }
  @Get("evidence/:type/:id")
  @Permissions(AdminPermission.INSURANCE_EVIDENCE_VIEW)
  evidence(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("type") type: "consent" | "disclosure",
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    if (type !== "consent" && type !== "disclosure")
      throw new BadRequestException("Unsupported evidence type");
    return this.operations.evidence(admin.sub, type, id);
  }
}
