import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { VendorsController } from "./vendors.controller";
import { VendorsService } from "./vendors.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [JwtModule.register({}), StorageModule],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}
