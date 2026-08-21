import { VendorStatus } from "@prisma/client";

import { PublicDiscoveryService } from "./public-discovery.service";

describe("PublicDiscoveryService", () => {
  it("returns only public-safe approved vendor summaries", async () => {
    const vendor = {
      id: "vendor-1",
      slug: "safe-provider",
      businessName: "Safe Provider",
      legalName: "Safe Provider LLP",
      description: "A provider description",
      contactEmail: "public@example.com",
      contactPhone: "+91 90000 00000",
      websiteUrl: "https://example.com",
      yearEstablished: 2020,
      postalCode: "400001",
      reviewedAt: new Date("2026-01-01"),
      primaryCity: {
        name: "Mumbai",
        slug: "mumbai",
        state: { name: "Maharashtra", code: "MH" },
      },
      categories: [
        { category: { name: "Home Services", slug: "home-services" } },
      ],
      serviceAreas: [
        {
          city: {
            name: "Mumbai",
            slug: "mumbai",
            state: { name: "Maharashtra", code: "MH" },
          },
        },
      ],
    };
    const prisma = {
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: "category-1" }),
      },
      vendorProfile: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([vendor]),
      },
      $transaction: jest.fn().mockResolvedValue([1, [vendor]]),
    } as never;

    const result = await new PublicDiscoveryService(prisma).listVendors({
      category: "home-services",
    });

    expect(result.items[0]).toMatchObject({
      id: "vendor-1",
      businessName: "Safe Provider",
      verificationStatusLabel: "Verified",
    });
    expect(result.items[0]).not.toHaveProperty("legalName");
    expect(result.pagination.totalItems).toBe(1);
    expect(
      (prisma as { $transaction: jest.Mock }).$transaction,
    ).toHaveBeenCalled();
    expect(VendorStatus.APPROVED).toBe("APPROVED");
  });
});
