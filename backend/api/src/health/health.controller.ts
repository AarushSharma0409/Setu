import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";

import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  health() {
    return this.healthService.health();
  }

  @Get("live")
  live() {
    return this.healthService.live();
  }

  @Get("ready")
  async ready() {
    const dependencies = await this.healthService.dependencies();

    if (Object.values(dependencies).some((status) => status === "down")) {
      throw new ServiceUnavailableException({
        message: "Service is not ready",
        dependencies,
      });
    }

    return {
      status: "ready",
      dependencies,
    };
  }
}
