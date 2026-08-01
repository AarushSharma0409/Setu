import { Module } from "@nestjs/common";

import { PublicDiscoveryController } from "./public-discovery.controller";
import { PublicDiscoveryService } from "./public-discovery.service";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [PublicDiscoveryController],
  providers: [PublicDiscoveryService],
  exports: [PublicDiscoveryService],
})
export class PublicDiscoveryModule {}
