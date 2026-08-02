import { authenticator } from "otplib";

import { AdminTotpService } from "./totp.service";

describe("AdminTotpService", () => {
  it("generates and verifies six-digit TOTP codes", () => {
    const service = new AdminTotpService({
      values: { ADMIN_TOTP_WINDOW: 1, ADMIN_TOTP_ISSUER: "Setu" },
    } as never);
    const secret = service.generateSecret();
    const code = service.currentCode(secret);

    expect(code).toMatch(/^\d{6}$/);
    expect(service.verify(code, secret)).toBe(true);
    expect(
      service.verify(` ${code.slice(0, 3)} ${code.slice(3)} `, secret),
    ).toBe(true);
    expect(service.verify("000000", secret)).toBe(false);
  });

  it("uses the current clock after the service has been running", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-01T00:00:00.000Z"));
    try {
      const service = new AdminTotpService({
        values: { ADMIN_TOTP_WINDOW: 1, ADMIN_TOTP_ISSUER: "Setu" },
      } as never);
      const secret = service.generateSecret();
      jest.advanceTimersByTime(90_000);

      const current = authenticator.create({
        ...authenticator.allOptions(),
        epoch: Date.now(),
        step: 30,
        window: 1,
      });
      expect(service.verify(current.generate(secret), secret)).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
