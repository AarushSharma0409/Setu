import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { InsuranceComparisonFeatureGuard } from "./insurance-comparison-feature.guard";
import { InsuranceComparisonService } from "./insurance-comparison.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../../common/guards/public-user-auth.guard";

@Controller("insurance")
@UseGuards(PublicUserAuthGuard, InsuranceComparisonFeatureGuard)
export class InsuranceComparisonController {
  constructor(private readonly comparison: InsuranceComparisonService) {}
  @Get("quote-requests/:quoteRequestId/comparison")
  get(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("quoteRequestId", ParseUUIDPipe) id: string,
    @Query() query: { sort?: string; quoteIds?: string; rankingMode?: string },
  ) {
    return this.comparison.comparison(user.sub, id, query);
  }
  @Post("quotes/:quoteId/save") save(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("quoteId", ParseUUIDPipe) id: string,
  ) {
    return this.comparison.save(user.sub, id);
  }
  @Delete("quotes/:quoteId/save") unsave(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("quoteId", ParseUUIDPipe) id: string,
  ) {
    return this.comparison.unsave(user.sub, id);
  }
  @Get("saved-quotes") saved(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.comparison.saved(user.sub);
  }
}
