import { JwtService } from "@nestjs/jwt";

import { TokenService, parseDurationMs } from "./token.service";
import type { EnvService } from "../common/env/env.service";

const envService = {
  values: {
    ACCESS_TOKEN_TTL: "15m",
    REFRESH_TOKEN_TTL: "7d",
    JWT_ACCESS_SECRET: "access-secret-for-tests-at-least-32-chars",
    JWT_REFRESH_SECRET: "refresh-secret-for-tests-at-least-32-chars",
  },
} as EnvService;

describe("TokenService", () => {
  it("signs public and admin tokens with separate audiences", async () => {
    const jwtService = new JwtService();
    const service = new TokenService(jwtService, envService);
    const publicToken = await service.signAccessToken({
      sub: "u1",
      role: "USER",
      type: "public",
    });
    const adminToken = await service.signAccessToken({
      sub: "a1",
      role: "SUPER_ADMIN",
      type: "admin",
    });

    expect(() =>
      jwtService.verify(publicToken, {
        audience: "setu-admin",
        secret: envService.values.JWT_ACCESS_SECRET,
      }),
    ).toThrow();
    expect(
      jwtService.verify(adminToken, {
        audience: "setu-admin",
        secret: envService.values.JWT_ACCESS_SECRET,
      }),
    ).toMatchObject({ type: "admin" });
  });

  it("hashes refresh tokens without returning the original token", () => {
    const service = new TokenService(new JwtService(), envService);
    const token = service.createRefreshToken();

    expect(service.hashRefreshToken(token)).not.toBe(token);
    expect(service.hashRefreshToken(token)).toBe(
      service.hashRefreshToken(token),
    );
  });
});

describe("parseDurationMs", () => {
  it("parses supported duration strings", () => {
    expect(parseDurationMs("7d")).toBe(604800000);
  });
});
