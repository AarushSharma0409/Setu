import { Module } from "@nestjs/common";

import { InquiriesController } from "./inquiries.controller";
import { InquiriesService } from "./inquiries.service";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
