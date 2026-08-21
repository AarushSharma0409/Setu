import { NotFoundException } from "@nestjs/common";

import { InsuranceHandoffService } from "./insurance-handoff.service";

describe("InsuranceHandoffService handoff return", () => {
  const handoff = {
    id: "handoff-id",
    userId: "user-id",
    quoteId: "quote-id",
    integrationProviderId: "provider-id",
    expiresAt: new Date(Date.now() + 60_000),
    integrationProvider: { name: "Safe Provider" },
  };

  function createService(consumedCount: number) {
    const prisma = {
      insurancePurchaseHandoff: {
        findUnique: jest.fn().mockResolvedValue(handoff),
        updateMany: jest.fn().mockResolvedValue({ count: consumedCount }),
      },
      insuranceRedirectEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    return {
      prisma,
      service: new InsuranceHandoffService(
        prisma as never,
        {} as never,
        {} as never,
        {} as never,
      ),
    };
  }

  it("atomically consumes a valid return state", async () => {
    const { prisma, service } = createService(1);

    await expect(service.returned("opaque-state")).resolves.toMatchObject({
      status: "ACKNOWLEDGED",
      providerName: "Safe Provider",
    });
    expect(prisma.insurancePurchaseHandoff.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACKNOWLEDGED" }),
        where: expect.objectContaining({
          status: { in: ["READY", "REDIRECTED"] },
        }),
      }),
    );
    expect(prisma.insuranceRedirectEvent.create).toHaveBeenCalledTimes(1);
  });

  it("rejects a replayed return state without recording another event", async () => {
    const { prisma, service } = createService(0);

    await expect(service.returned("opaque-state")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.insuranceRedirectEvent.create).not.toHaveBeenCalled();
  });
});
