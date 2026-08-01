import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminRole } from "@prisma/client";

import { Roles } from "../common/decorators/roles.decorator";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { HealthService } from "../health/health.service";

@Controller("admin/system-status")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS)
export class AdminSystemController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async status() {
    return {
      application: "setu-api",
      checkedAt: new Date().toISOString(),
      process: {
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      health: await this.healthService.health(),
    };
  }
}
