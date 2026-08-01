import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import Redis from "ioredis";

import type { RateLimitOptions } from "../common/decorators/rate-limit.decorator";
import { EnvService } from "../common/env/env.service";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;

  constructor(private readonly envService: EnvService) {}

  get connection(): Redis {
    if (!this.client) {
      this.client = new Redis(this.envService.values.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      this.client.on("error", (error) => {
        this.logger.error(`Redis connection error: ${error.message}`);
      });
    }

    return this.client;
  }

  async onModuleInit() {
    try {
      await this.connection.connect();
      this.logger.log("Connected to Redis");
    } catch (error) {
      this.logger.warn(
        `Redis unavailable during startup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async isHealthy(): Promise<boolean> {
    return (await this.connection.ping()) === "PONG";
  }

  async consumeRateLimit(
    key: string,
    options: RateLimitOptions,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const redisKey = `${this.envService.values.RATE_LIMIT_REDIS_PREFIX}${key}`;
    const count = await this.connection.incr(redisKey);
    if (count === 1) {
      await this.connection.expire(redisKey, options.windowSeconds);
    }
    const ttl = Math.max(1, await this.connection.ttl(redisKey));
    const resetAt = Math.floor(Date.now() / 1000) + ttl;
    return {
      allowed: count <= options.limit,
      remaining: Math.max(0, options.limit - count),
      resetAt,
    };
  }
}
