import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import {
  InsuranceCapability,
  InsuranceOperatingModelStatus,
} from "@prisma/client";

import { PrismaService } from "../database/prisma.service";

export interface InsuranceCapabilityService {
  isEnabled(capability: InsuranceCapability): Promise<boolean>;
  assertEnabled(capability: InsuranceCapability): Promise<void>;
}

@Injectable()
export class InsuranceCapabilityServiceImpl implements InsuranceCapabilityService {
  private readonly logger = new Logger(InsuranceCapabilityServiceImpl.name);

  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(capability: InsuranceCapability): Promise<boolean> {
    const now = new Date();
    const model = await this.prisma.insuranceOperatingModel.findFirst({
      where: {
        status: InsuranceOperatingModelStatus.ACTIVE,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
      },
      orderBy: [{ effectiveFrom: "desc" }, { configurationVersion: "desc" }],
      select: { permittedCapabilities: true, restrictedCapabilities: true },
    });

    return Boolean(
      model &&
      model.permittedCapabilities.includes(capability) &&
      !model.restrictedCapabilities.includes(capability),
    );
  }

  async assertEnabled(capability: InsuranceCapability): Promise<void> {
    if (await this.isEnabled(capability)) return;

    this.logger.warn(
      JSON.stringify({ event: "insurance_capability_denied", capability }),
    );
    throw new ForbiddenException("This insurance capability is not enabled");
  }
}
