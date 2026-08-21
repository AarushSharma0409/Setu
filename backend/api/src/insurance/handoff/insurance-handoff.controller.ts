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

import { CreateHandoffDto } from "./dto/handoff.dto";
import { InsuranceHandoffFeatureGuard } from "./insurance-handoff-feature.guard";
import { InsuranceHandoffService } from "./insurance-handoff.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../../common/guards/public-user-auth.guard";

@Controller("insurance")
export class InsuranceHandoffController {
  constructor(private readonly handoffs: InsuranceHandoffService) {}

  @Post("quotes/:quoteId/handoff")
  @UseGuards(PublicUserAuthGuard, InsuranceHandoffFeatureGuard)
  @RateLimit({ key: "insurance-handoff-create", limit: 5, windowSeconds: 300 })
  create(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("quoteId", ParseUUIDPipe) quoteId: string,
    @Body() _dto: CreateHandoffDto,
  ) {
    return this.handoffs.create(user.sub, quoteId);
  }

  @Post("handoffs/:handoffId/redirect")
  @UseGuards(PublicUserAuthGuard, InsuranceHandoffFeatureGuard)
  @RateLimit({
    key: "insurance-handoff-redirect",
    limit: 10,
    windowSeconds: 300,
  })
  redirect(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("handoffId", ParseUUIDPipe) handoffId: string,
  ) {
    return this.handoffs.recordRedirect(user.sub, handoffId);
  }

  @Get("handoff/return")
  returnFromProvider(@Query("state") state: string | undefined) {
    if (!state || state.length > 256)
      throw new BadRequestException("Missing handoff state");
    return this.handoffs.returned(state);
  }
}
