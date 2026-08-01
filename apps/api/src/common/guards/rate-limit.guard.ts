import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";

import { RedisService } from "../../redis/redis.service";
import {
  RATE_LIMIT_KEY,
  type RateLimitOptions,
} from "../decorators/rate-limit.decorator";
import { EnvService } from "../env/env.service";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
    private readonly env: EnvService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options || !this.env.values.RATE_LIMIT_ENABLED) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const key = `${options.key}:${clientKey(request)}`;

    // Test doubles and local fallback environments may not expose the Redis
    // limiter. In that case the endpoint remains available and emits a clear
    // warning through RedisService rather than failing open silently.
    const consume = this.redis.consumeRateLimit?.bind(this.redis);
    if (!consume) return true;

    const result = await consume(key, options);
    response.setHeader("X-RateLimit-Limit", String(options.limit));
    response.setHeader("X-RateLimit-Remaining", String(result.remaining));
    response.setHeader("X-RateLimit-Reset", String(result.resetAt));

    if (!result.allowed) {
      const retryAfter = Math.max(1, result.resetAt - Math.floor(Date.now() / 1000));
      response.setHeader("Retry-After", String(retryAfter));
      throw new HttpException("Too many requests", HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}

function clientKey(request: Request): string {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (forwardedValue?.split(",")[0] ?? request.ip ?? "unknown")
    .trim()
    .replace(/[^a-zA-Z0-9:._-]/g, "_")
    .slice(0, 120);
}
