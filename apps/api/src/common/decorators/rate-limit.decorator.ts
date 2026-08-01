import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "setu:rate-limit";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
