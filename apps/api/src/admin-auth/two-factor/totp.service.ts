import { Injectable } from "@nestjs/common";
import { authenticator } from "otplib";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class AdminTotpService {
  constructor(private readonly envService: EnvService) {}

  private createTotp(): ReturnType<typeof authenticator.create> {
    return authenticator.create({
      ...authenticator.allOptions(),
      // otplib's default epoch is captured when the instance is created; TOTP must follow wall-clock time.
      epoch: Date.now(),
      step: 30,
      window: this.envService.values.ADMIN_TOTP_WINDOW,
    });
  }

  generateSecret(): string {
    return this.createTotp().generateSecret(20);
  }

  enrollmentUri(email: string, secret: string): string {
    return this.createTotp().keyuri(
      email,
      this.envService.values.ADMIN_TOTP_ISSUER,
      secret,
    );
  }

  verify(code: string, secret: string): boolean {
    const normalizedCode = code.replace(/\s/g, "");
    const normalizedSecret = secret.replace(/\s/g, "").toUpperCase();
    return (
      /^\d{6}$/.test(normalizedCode) &&
      this.createTotp().check(normalizedCode, normalizedSecret)
    );
  }

  currentCode(secret: string): string {
    return this.createTotp().generate(secret);
  }
}
