import { Module } from "@nestjs/common";

import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { AuthModule } from "../auth/auth.module";
import { EnvModule } from "../common/env/env.module";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [AuthModule, DatabaseModule, EnvModule],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
