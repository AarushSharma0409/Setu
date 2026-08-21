import { Module } from "@nestjs/common";

import { QuoteInterestsController } from "./quote-interests.controller";
import { QuoteInterestsService } from "./quote-interests.service";

@Module({
  controllers: [QuoteInterestsController],
  providers: [QuoteInterestsService],
})
export class QuoteInterestsModule {}
