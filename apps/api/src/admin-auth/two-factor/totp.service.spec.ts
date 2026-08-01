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
    expect(service.verify("000000", secret)).toBe(false);
  });
});
