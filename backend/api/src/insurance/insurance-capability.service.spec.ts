import { ForbiddenException } from "@nestjs/common";
import {
  InsuranceCapability,
  InsuranceOperatingModelStatus,
} from "@prisma/client";

import { InsuranceCapabilityServiceImpl } from "./insurance-capability.service";
import type { PrismaService } from "../database/prisma.service";

describe("InsuranceCapabilityService", () => {
  it("fails closed when no operating model is active", async () => {
    const service = new InsuranceCapabilityServiceImpl({
      insuranceOperatingModel: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService);

    await expect(
      service.isEnabled(InsuranceCapability.REQUEST_QUOTES),
    ).resolves.toBe(false);
    await expect(
      service.assertEnabled(InsuranceCapability.REQUEST_QUOTES),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows only explicitly permitted and unrestricted capabilities", async () => {
    const service = new InsuranceCapabilityServiceImpl({
      insuranceOperatingModel: {
        findFirst: jest.fn().mockResolvedValue({
          status: InsuranceOperatingModelStatus.ACTIVE,
          permittedCapabilities: [InsuranceCapability.REQUEST_QUOTES],
          restrictedCapabilities: [],
        }),
      },
    } as unknown as PrismaService);

    await expect(
      service.isEnabled(InsuranceCapability.REQUEST_QUOTES),
    ).resolves.toBe(true);
    await expect(
      service.isEnabled(InsuranceCapability.COMPARE_QUOTES),
    ).resolves.toBe(false);
  });
});
