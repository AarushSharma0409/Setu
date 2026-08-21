import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  CreateQuoteRequestDto,
  RecalculateQuoteRequestDto,
} from "./dto/quote-request.dto";
import { InsuranceQuotationsFeatureGuard } from "./insurance-quotations-feature.guard";
import { InsuranceQuotationsService } from "./insurance-quotations.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../../common/guards/public-user-auth.guard";

@Controller("insurance/quotes")
@UseGuards(PublicUserAuthGuard, InsuranceQuotationsFeatureGuard)
export class InsuranceQuotationsController {
  constructor(private readonly quotations: InsuranceQuotationsService) {}

  @Post()
  @RateLimit({ key: "insurance-quotes-create", limit: 5, windowSeconds: 300 })
  create(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() dto: CreateQuoteRequestDto,
  ) {
    return this.quotations.create(user.sub, dto.assessmentId, idempotencyKey);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.quotations.list(user.sub);
  }

  @Get(":quoteRequestId")
  detail(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("quoteRequestId", ParseUUIDPipe) quoteRequestId: string,
  ) {
    return this.quotations.detail(user.sub, quoteRequestId);
  }

  @Post("recalculate")
  @RateLimit({
    key: "insurance-quotes-recalculate",
    limit: 3,
    windowSeconds: 300,
  })
  recalculate(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() dto: RecalculateQuoteRequestDto,
  ) {
    return this.quotations.recalculate(
      user.sub,
      dto.assessmentId,
      dto.recalculationOfQuoteRequestId,
      idempotencyKey,
    );
  }
}
