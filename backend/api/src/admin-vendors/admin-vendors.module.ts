import { Module } from "@nestjs/common";

import { AdminVendorsController } from "./admin-vendors.controller";
import { AdminVendorsService } from "./admin-vendors.service";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [AuditModule, AuthModule, StorageModule],
  controllers: [AdminVendorsController],
  providers: [AdminVendorsService],
})
export class AdminVendorsModule {}
