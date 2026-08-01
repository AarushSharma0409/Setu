import { Module } from "@nestjs/common";

import { AdminTwoFactorEncryptionService } from "./encryption.service";
import { AdminTotpService } from "./totp.service";

@Module({
  providers: [AdminTwoFactorEncryptionService, AdminTotpService],
  exports: [AdminTwoFactorEncryptionService, AdminTotpService],
})
export class AdminTwoFactorModule {}
