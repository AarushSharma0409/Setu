import { Injectable } from "@nestjs/common";
import { authenticator } from "otplib";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class AdminTotpService {
  private readonly totp: ReturnType<typeof authenticator.create>;

  constructor(private readonly envService: EnvService) {
    this.totp = authenticator.create({
      ...authenticator.allOptions(),
      step: 30,
      window: envService.values.ADMIN_TOTP_WINDOW,
    });
  }

  generateSecret(): string {
    return this.totp.generateSecret(20);
  }

  enrollmentUri(email: string, secret: string): string {
    return this.totp.keyuri(
      email,
      this.envService.values.ADMIN_TOTP_ISSUER,
      secret,
    );
  }

  verify(code: string, secret: string): boolean {
    return /^\d{6}$/.test(code) && this.totp.check(code, secret);
  }

  currentCode(secret: string): string {
    return this.totp.generate(secret);
  }
}
