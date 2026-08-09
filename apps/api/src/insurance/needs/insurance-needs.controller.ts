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
  CreateAssessmentDto,
  SaveAnswersDto,
  WithdrawAssessmentDto,
} from "./dto/needs.dto";
import { InsuranceNeedsFeatureGuard } from "./insurance-needs-feature.guard";
import { InsuranceNeedsService } from "./insurance-needs.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../../common/guards/public-user-auth.guard";

@Controller("insurance")
export class InsuranceNeedsController {
  constructor(private readonly needs: InsuranceNeedsService) {}

  @Get("policy-types")
  @UseGuards(InsuranceNeedsFeatureGuard)
  policyTypes() {
    return this.needs.policyTypes();
  }
  @Get("policy-types/:slug")
  @UseGuards(InsuranceNeedsFeatureGuard)
  policyType(@Param("slug") slug: string) {
    return this.needs.policyType(slug);
  }

  @UseGuards(PublicUserAuthGuard, InsuranceNeedsFeatureGuard)
  @Post("needs/assessments")
  @RateLimit({ key: "insurance-needs-create", limit: 5, windowSeconds: 300 })
  create(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.needs.create(user.sub, dto);
  }
  @Get("needs/assessments") list(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.needs.list(user.sub);
  }
  @Get("needs/assessments/:assessmentId") detail(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
  ) {
    return this.needs.detail(user.sub, id);
  }
  @Get("needs/assessments/:assessmentId/schema") schema(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
  ) {
    return this.needs.schema(user.sub, id);
  }
  @Patch("needs/assessments/:assessmentId/answers")
  @RateLimit({ key: "insurance-needs-save", limit: 30, windowSeconds: 300 })
  save(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
    @Body() dto: SaveAnswersDto,
  ) {
    return this.needs.save(user.sub, id, dto);
  }
  @Get("needs/assessments/:assessmentId/review") review(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
  ) {
    return this.needs.review(user.sub, id);
  }
  @Get("needs/assessments/:assessmentId/disclosures") disclosures(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
  ) {
    return this.needs.disclosures(user.sub, id);
  }
  @Post("needs/assessments/:assessmentId/disclosures/:templateId/acknowledge")
  acknowledge(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
    @Param("templateId", ParseUUIDPipe) templateId: string,
  ) {
    return this.needs.acknowledgeDisclosure(user.sub, id, templateId);
  }
  @Get("needs/assessments/:assessmentId/consents") consents(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
  ) {
    return this.needs.consents(user.sub, id);
  }
  @Post("needs/assessments/:assessmentId/consents/:templateId/grant")
  grant(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
    @Param("templateId", ParseUUIDPipe) templateId: string,
  ) {
    return this.needs.grantConsent(user.sub, id, templateId);
  }
  @Post("needs/assessments/:assessmentId/consents/:templateId/withdraw")
  withdrawConsent(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
    @Param("templateId", ParseUUIDPipe) templateId: string,
  ) {
    return this.needs.withdrawConsent(user.sub, id, templateId);
  }
  @Post("needs/assessments/:assessmentId/submit")
  @RateLimit({ key: "insurance-needs-submit", limit: 5, windowSeconds: 300 })
  submit(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
  ) {
    return this.needs.submit(user.sub, id);
  }
  @Post("needs/assessments/:assessmentId/withdraw")
  withdraw(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("assessmentId", ParseUUIDPipe) id: string,
    @Body() dto: WithdrawAssessmentDto,
  ) {
    return this.needs.withdraw(user.sub, id, dto.reason);
  }
}
