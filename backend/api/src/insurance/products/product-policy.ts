import { BadRequestException } from "@nestjs/common";
import { InsuranceDeductibleType } from "@prisma/client";

export const PRODUCT_CATALOGUE_REQUIREMENTS = {
  HEALTH: {
    requiresSumInsured: true,
    requiresWaitingPeriods: true,
    requiresEligibility: true,
    requiresDocuments: true,
  },
  default: {
    requiresSumInsured: false,
    requiresWaitingPeriods: false,
    requiresEligibility: true,
    requiresDocuments: true,
  },
} as const;

export function catalogueRequirements(policyTypeCode: string) {
  return (
    PRODUCT_CATALOGUE_REQUIREMENTS[
      policyTypeCode as keyof typeof PRODUCT_CATALOGUE_REQUIREMENTS
    ] ?? PRODUCT_CATALOGUE_REQUIREMENTS.default
  );
}

export function assertEffectivePeriod(
  effectiveFrom?: Date | null,
  effectiveUntil?: Date | null,
) {
  if (!effectiveFrom) {
    throw new BadRequestException("An effective start date is required");
  }
  if (effectiveUntil && effectiveUntil <= effectiveFrom) {
    throw new BadRequestException(
      "The effective end date must be after the effective start date",
    );
  }
}

export function periodsOverlap(
  firstStart: Date,
  firstEnd: Date | null,
  secondStart: Date,
  secondEnd: Date | null,
) {
  const firstEndTime = firstEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  const secondEndTime = secondEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  return (
    firstStart.getTime() <= secondEndTime &&
    secondStart.getTime() <= firstEndTime
  );
}

export function assertDeductible(input: {
  type: InsuranceDeductibleType;
  amount?: number;
  percentage?: number;
  currency?: string;
}) {
  const needsPercentage =
    input.type === InsuranceDeductibleType.PERCENTAGE ||
    input.type === InsuranceDeductibleType.CO_PAY;
  if (needsPercentage) {
    if (!input.percentage || input.percentage <= 0 || input.percentage > 100) {
      throw new BadRequestException(
        "Deductible percentage must be between 0 and 100",
      );
    }
    return;
  }
  if (!input.amount || input.amount <= 0 || !input.currency) {
    throw new BadRequestException(
      "A positive deductible amount and currency are required",
    );
  }
}
