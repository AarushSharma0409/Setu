import { InsuranceDeductibleType } from "@prisma/client";

import {
  assertDeductible,
  assertEffectivePeriod,
  catalogueRequirements,
  periodsOverlap,
} from "./product-policy";

describe("insurance product catalogue policy", () => {
  it("uses the health catalogue requirements without hardcoding other types", () => {
    expect(catalogueRequirements("HEALTH").requiresSumInsured).toBe(true);
    expect(catalogueRequirements("MOTOR").requiresSumInsured).toBe(false);
  });

  it("rejects invalid effective periods and detects overlap", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    expect(() => assertEffectivePeriod(from, from)).toThrow("after");
    expect(
      periodsOverlap(
        from,
        new Date("2026-12-31T00:00:00.000Z"),
        new Date("2026-06-01T00:00:00.000Z"),
        null,
      ),
    ).toBe(true);
  });

  it("validates fixed and percentage deductibles", () => {
    expect(() =>
      assertDeductible({
        type: InsuranceDeductibleType.FIXED,
        amount: 1000,
        currency: "INR",
      }),
    ).not.toThrow();
    expect(() =>
      assertDeductible({
        type: InsuranceDeductibleType.PERCENTAGE,
        percentage: 101,
      }),
    ).toThrow("between 0 and 100");
  });
});
