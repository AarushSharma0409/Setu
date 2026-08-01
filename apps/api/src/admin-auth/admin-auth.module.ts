import { Module } from "@nestjs/common";

import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { AdminTwoFactorModule } from "./two-factor/two-factor.module";

@Module({
  imports: [AuthModule, AuditModule, AdminTwoFactorModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
})
export class AdminAuthModule {}
