import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import Redis from "ioredis";

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
    await this.connection.connect();
    this.logger.log("Connected to Redis");
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async isHealthy(): Promise<boolean> {
    return (await this.connection.ping()) === "PONG";
  }
}
