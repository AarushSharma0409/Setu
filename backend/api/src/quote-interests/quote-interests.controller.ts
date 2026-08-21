import { Body, Controller, Post } from "@nestjs/common";

import { CreateQuoteInterestDto } from "./dto/create-quote-interest.dto";
import { QuoteInterestsService } from "./quote-interests.service";
import { Public } from "../common/decorators/public.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";

@Public()
@Controller("quote-interests")
export class QuoteInterestsController {
  constructor(private readonly quoteInterests: QuoteInterestsService) {}

  @Post()
  @RateLimit({ key: "quote-interest", limit: 3, windowSeconds: 3600 })
  create(@Body() dto: CreateQuoteInterestDto) {
    return this.quoteInterests.create(dto.service);
  }
}
