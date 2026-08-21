import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  it("allows matching roles", () => {
    const reflector = {
      getAllAndOverride: () => ["SUPER_ADMIN"],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ auth: { role: "SUPER_ADMIN" } }),
      }),
    };

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it("rejects mismatched roles", () => {
    const reflector = {
      getAllAndOverride: () => ["SUPER_ADMIN"],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ auth: { role: "REVIEWER" } }),
      }),
    };

    expect(() => guard.canActivate(context as never)).toThrow(
      ForbiddenException,
    );
  });
});
