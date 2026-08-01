import { HttpException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RateLimitGuard } from "./rate-limit.guard";

describe("RateLimitGuard", () => {
  it("sets rate-limit headers and rejects an exhausted key", async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue({
      key: "test",
      limit: 1,
      windowSeconds: 60,
    });
    const response = { setHeader: jest.fn() };
    const request = {
      ip: "127.0.0.1",
      headers: {},
    };
    const context = {
      getHandler: () => () => true,
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as never;
    const redis = {
      consumeRateLimit: jest
        .fn()
        .mockResolvedValueOnce({ allowed: true, remaining: 0, resetAt: 100 })
        .mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: 100 }),
    };
    const env = { values: { RATE_LIMIT_ENABLED: true } };
    const guard = new RateLimitGuard(reflector, redis as never, env as never);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "X-RateLimit-Limit",
      "1",
    );
  });
});
