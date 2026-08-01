import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../redis/redis.service";

export interface DependencyStatus {
  postgres: "up" | "down";
  redis: "up" | "down";
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  live() {
    return {
      status: "ok",
      uptime: process.uptime(),
    };
  }

  async dependencies(): Promise<DependencyStatus> {
    const [postgres, redis] = await Promise.all([
      probe(() => this.prisma.isHealthy()),
      probe(() => this.redis.isHealthy()),
    ]);

    return {
      postgres: postgres ? "up" : "down",
      redis: redis ? "up" : "down",
    };
  }

  async health() {
    const dependencies = await this.dependencies();
    const ready = Object.values(dependencies).every(
      (status) => status === "up",
    );

    return {
      status: ready ? "ok" : "degraded",
      dependencies,
    };
  }
}

async function probe(check: () => Promise<boolean>): Promise<boolean> {
  try {
    return await Promise.race([
      check(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error("health check timeout")), 2_000),
      ),
    ]);
  } catch {
    return false;
  }
}
