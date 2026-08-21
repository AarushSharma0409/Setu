import { createHash, randomBytes } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceAvailabilityScope,
  InsuranceAvailabilityType,
  InsuranceCapability,
  InsuranceConsentPurpose,
  InsuranceConsentStatus,
  InsuranceEligibilityEvaluationStatus,
  InsuranceEligibilityReasonSeverity,
  InsuranceEligibilityRuleType,
  InsuranceLicenceStatus,
  InsuranceNeedAssessmentStatus,
  InsuranceOrganizationStatus,
  InsuranceProductStatus,
  InsuranceProductVersionStatus,
  InsuranceQuoteAttemptStatus,
  InsuranceQuoteFailureCategory,
  InsuranceQuoteRequestStatus,
  InsuranceQuoteSourceMode,
  InsuranceQuoteStatus,
  InsuranceRateCardStatus,
  Prisma,
} from "@prisma/client";

import { AuditService } from "../../audit/audit.service";
import { EnvService } from "../../common/env/env.service";
import { PrismaService } from "../../database/prisma.service";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";
import { CreateRateCardDto } from "./dto/rate-card.dto";

const ENGINE_VERSION = "catalogue-v1";
const PROVIDER_VERSION = "manual-rate-card-v1";
const REQUIRED_CONSENTS = [
  InsuranceConsentPurpose.QUOTE_REQUEST,
  InsuranceConsentPurpose.INSURER_DATA_SHARING,
  InsuranceConsentPurpose.SENSITIVE_DATA_PROCESSING,
] as const;

type SnapshotAnswer = { questionKey: string; value: unknown };
type Reason = {
  code: string;
  message: string;
  ruleType?: InsuranceEligibilityRuleType | null;
  severity: InsuranceEligibilityReasonSeverity;
};
type EligibilityResult = {
  status: InsuranceEligibilityEvaluationStatus;
  reasons: Reason[];
};

@Injectable()
export class InsuranceQuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly capability: InsuranceCapabilityServiceImpl,
    private readonly audit: AuditService,
  ) {}

  async adminList() {
    return this.prisma.insuranceQuoteRequest.findMany({
      orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
      take: 100,
      include: {
        user: { select: { id: true, email: true, phone: true } },
        policyType: { select: { name: true, code: true } },
        quotes: {
          select: { status: true, sourceType: true, calculationVersion: true },
        },
      },
    });
  }

  async adminDetail(quoteRequestId: string) {
    const request = await this.prisma.insuranceQuoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        policyType: true,
        attempts: true,
        calculationInputs: {
          select: {
            productId: true,
            productVersionId: true,
            providerType: true,
            providerVersion: true,
            createdAt: true,
          },
        },
        eligibilityEvaluations: { include: { reasons: true } },
        quotes: {
          include: {
            organization: { select: { legalName: true, tradeName: true } },
            productVersion: { select: { name: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException("Quote request not found");
    return request;
  }

  async createRateCard(adminUserId: string, dto: CreateRateCardDto) {
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveUntil = dto.effectiveUntil
      ? new Date(dto.effectiveUntil)
      : null;
    if (effectiveUntil && effectiveUntil <= effectiveFrom)
      throw new BadRequestException(
        "Rate-card expiry must be after its effective date",
      );
    if (!dto.entries.length)
      throw new BadRequestException("A rate card needs at least one entry");
    const product = await this.prisma.insuranceProduct.findFirst({
      where: {
        id: dto.productId,
        organizationId: dto.organizationId,
        currentVersionId: dto.productVersionId,
      },
      select: { id: true },
    });
    if (!product)
      throw new BadRequestException(
        "Rate card must target the product's active version and organization",
      );
    const rateCard = await this.prisma.$transaction(async (tx) => {
      const created = await tx.insuranceRateCard.create({
        data: {
          organizationId: dto.organizationId,
          productId: dto.productId,
          productVersionId: dto.productVersionId,
          name: dto.name.trim(),
          version: dto.version,
          effectiveFrom,
          effectiveUntil,
          currency: (dto.currency ?? "INR").toUpperCase(),
          createdByAdminUserId: adminUserId,
          entries: {
            create: dto.entries.map((entry) => ({
              ageMin: entry.ageMin,
              ageMax: entry.ageMax,
              sumInsured: entry.sumInsured,
              policyTerm: entry.policyTerm,
              basePremium: entry.basePremium,
              addonPremium: entry.addonPremium ?? "0",
              deductibleAdjustment: entry.deductibleAdjustment ?? "0",
              otherAdjustments: entry.otherAdjustments ?? "0",
              taxAmount: entry.taxAmount ?? "0",
              memberConfiguration: entry.memberConfiguration,
              locationClass: entry.locationClass,
              sortOrder: entry.sortOrder ?? 0,
            })),
          },
        },
        include: { entries: true },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_RATE_CARD_CREATED",
          entityType: "InsuranceRateCard",
          entityId: created.id,
          metadata: { productId: dto.productId, version: dto.version },
        },
        tx,
      );
      return created;
    });
    return rateCard;
  }

  async publishRateCard(adminUserId: string, rateCardId: string) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const rateCard = await tx.insuranceRateCard.findUnique({
        where: { id: rateCardId },
        include: { entries: true },
      });
      if (!rateCard) throw new NotFoundException("Rate card not found");
      if (rateCard.status !== InsuranceRateCardStatus.DRAFT)
        throw new BadRequestException("Only draft rate cards can be published");
      if (!rateCard.entries.length)
        throw new BadRequestException("A rate card needs at least one entry");
      const overlap = await tx.insuranceRateCard.findFirst({
        where: {
          productVersionId: rateCard.productVersionId,
          status: InsuranceRateCardStatus.PUBLISHED,
          id: { not: rateCard.id },
          effectiveFrom: {
            lte: rateCard.effectiveUntil ?? new Date("9999-12-31"),
          },
          OR: [
            { effectiveUntil: null },
            { effectiveUntil: { gte: rateCard.effectiveFrom } },
          ],
        },
        select: { id: true },
      });
      if (overlap)
        throw new ConflictException(
          "A published rate card already covers this effective period",
        );
      const published = await tx.insuranceRateCard.update({
        where: { id: rateCard.id },
        data: {
          status: InsuranceRateCardStatus.PUBLISHED,
          approvedByAdminUserId: adminUserId,
          publishedAt: now,
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_RATE_CARD_PUBLISHED",
          entityType: "InsuranceRateCard",
          entityId: rateCard.id,
          metadata: {
            productId: rateCard.productId,
            version: rateCard.version,
          },
        },
        tx,
      );
      return published;
    });
  }

  async create(userId: string, assessmentId: string, idempotencyKey?: string) {
    return this.createForAssessment(userId, assessmentId, idempotencyKey);
  }

  async recalculate(
    userId: string,
    assessmentId: string,
    previousRequestId: string,
    idempotencyKey?: string,
  ) {
    const previous = await this.prisma.insuranceQuoteRequest.findFirst({
      where: { id: previousRequestId, userId },
      select: { id: true, assessmentId: true },
    });
    if (!previous) throw new NotFoundException("Quote request not found");
    if (previous.assessmentId !== assessmentId)
      throw new BadRequestException(
        "The assessment does not match this quote request",
      );
    return this.createForAssessment(
      userId,
      assessmentId,
      idempotencyKey,
      previousRequestId,
    );
  }

  async list(userId: string) {
    await this.assertCapability();
    const items = await this.prisma.insuranceQuoteRequest.findMany({
      where: { userId },
      orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
      take: 30,
      include: {
        policyType: { select: { name: true, slug: true } },
        quotes: {
          select: {
            status: true,
            validUntil: true,
            totalPremium: true,
            currency: true,
          },
        },
      },
    });
    return { items: items.map((item) => this.requestSummary(item)) };
  }

  async detail(userId: string, quoteRequestId: string) {
    await this.assertCapability();
    const request = await this.prisma.insuranceQuoteRequest.findFirst({
      where: { id: quoteRequestId, userId },
      include: {
        policyType: { select: { name: true, slug: true } },
        quotes: {
          orderBy: { createdAt: "asc" },
          include: {
            organization: { select: { legalName: true, tradeName: true } },
            productVersion: { select: { name: true, shortDescription: true } },
          },
        },
        eligibilityEvaluations: { include: { reasons: true } },
      },
    });
    if (!request) throw new NotFoundException("Quote request not found");
    return this.customerDetail(request);
  }

  private async createForAssessment(
    userId: string,
    assessmentId: string,
    rawIdempotencyKey: string | undefined,
    recalculationOfQuoteRequestId?: string,
  ) {
    await this.assertCapability();
    const idempotencyKey = this.idempotencyKey(rawIdempotencyKey);
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          assessmentId,
          recalculationOfQuoteRequestId: recalculationOfQuoteRequestId ?? null,
        }),
      )
      .digest("hex");
    const existing = await this.prisma.insuranceQuoteRequest.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
    if (existing) {
      if (existing.requestHash !== requestHash)
        throw new ConflictException(
          "Idempotency key was used with different input",
        );
      return this.detail(userId, existing.id);
    }

    const assessment = await this.prisma.insuranceNeedAssessment.findFirst({
      where: { id: assessmentId, userId },
      include: {
        snapshot: true,
        policyType: { include: { insuranceLine: true } },
      },
    });
    if (!assessment) throw new NotFoundException("Need assessment not found");
    if (
      assessment.status !== InsuranceNeedAssessmentStatus.SUBMITTED ||
      !assessment.snapshot
    ) {
      throw new BadRequestException(
        "Submit the need assessment before requesting quotes",
      );
    }
    await this.assertCurrentConsent(assessment.id);

    const now = new Date();
    const candidates = await this.candidates(
      userId,
      assessment.policyTypeId,
      now,
      assessment.snapshot.answersSnapshot,
    );
    if (!candidates.length)
      throw new BadRequestException({
        code: "NO_QUOTABLE_PRODUCTS",
        message: "No insurance products are available for this need profile",
      });
    const request = await this.prisma.insuranceQuoteRequest.create({
      data: {
        referenceNumber: this.referenceNumber(),
        userId,
        assessmentId: assessment.id,
        needProfileSnapshotId: assessment.snapshot.id,
        policyTypeId: assessment.policyTypeId,
        idempotencyKey,
        requestHash,
        recalculationOfQuoteRequestId,
      },
    });
    await this.process(
      request.id,
      candidates,
      assessment.snapshot.answersSnapshot,
    );
    return this.detail(userId, request.id);
  }

  private async process(
    requestId: string,
    candidates: Awaited<ReturnType<InsuranceQuotationsService["candidates"]>>,
    snapshot: Prisma.JsonValue,
  ) {
    const lock = await this.prisma.insuranceQuoteRequest.updateMany({
      where: { id: requestId, status: InsuranceQuoteRequestStatus.PENDING },
      data: {
        status: InsuranceQuoteRequestStatus.PROCESSING,
        processingStartedAt: new Date(),
      },
    });
    if (!lock.count) return;
    const answers = snapshotAnswers(snapshot);
    let generated = 0;
    let unexpectedFailure = 0;
    for (const product of candidates) {
      const startedAt = new Date();
      const eligibility = this.evaluateEligibility(
        product.currentVersion.eligibilityRules,
        answers,
      );
      const evaluation =
        await this.prisma.insuranceEligibilityEvaluation.create({
          data: {
            quoteRequestId: requestId,
            productId: product.id,
            productVersionId: product.currentVersion.id,
            status: eligibility.status,
            engineVersion: ENGINE_VERSION,
            reasons: { create: eligibility.reasons },
          },
        });
      if (
        eligibility.status !== InsuranceEligibilityEvaluationStatus.ELIGIBLE
      ) {
        await this.persistUnavailable({
          requestId,
          product,
          startedAt,
          status:
            eligibility.status ===
            InsuranceEligibilityEvaluationStatus.INELIGIBLE
              ? InsuranceQuoteAttemptStatus.INELIGIBLE
              : InsuranceQuoteAttemptStatus.UNAVAILABLE,
          quoteStatus:
            eligibility.status ===
            InsuranceEligibilityEvaluationStatus.INELIGIBLE
              ? InsuranceQuoteStatus.INELIGIBLE
              : InsuranceQuoteStatus.UNAVAILABLE,
          failureCode:
            eligibility.reasons[0]?.code ?? "ELIGIBILITY_UNDETERMINED",
          failureCategory: InsuranceQuoteFailureCategory.ELIGIBILITY,
          evaluationId: evaluation.id,
        });
        continue;
      }
      try {
        const rateCard = await this.rateCard(
          product.id,
          product.currentVersion.id,
        );
        if (!rateCard) {
          await this.persistUnavailable({
            requestId,
            product,
            startedAt,
            status: InsuranceQuoteAttemptStatus.UNAVAILABLE,
            quoteStatus: InsuranceQuoteStatus.UNAVAILABLE,
            failureCode: "RATE_CARD_UNAVAILABLE",
            failureCategory: InsuranceQuoteFailureCategory.CONFIGURATION,
            evaluationId: evaluation.id,
          });
          continue;
        }
        const rate = chooseRate(rateCard.entries, answers);
        if (!rate) {
          await this.persistUnavailable({
            requestId,
            product,
            startedAt,
            status: InsuranceQuoteAttemptStatus.UNAVAILABLE,
            quoteStatus: InsuranceQuoteStatus.UNAVAILABLE,
            failureCode: "RATE_NOT_AVAILABLE",
            failureCategory: InsuranceQuoteFailureCategory.PRICING,
            evaluationId: evaluation.id,
          });
          continue;
        }
        const total = rate.basePremium
          .plus(rate.addonPremium)
          .plus(rate.deductibleAdjustment)
          .plus(rate.otherAdjustments)
          .plus(rate.taxAmount);
        const validUntil = earliestDate(
          addDays(new Date(), this.env.values.INSURANCE_QUOTE_TTL_DAYS),
          rateCard.effectiveUntil,
          product.currentVersion.effectiveUntil,
        );
        const calculationInput = {
          engineVersion: ENGINE_VERSION,
          rateCardId: rateCard.id,
          rateCardVersion: rateCard.version,
          selectedRateEntryId: rate.id,
          normalizedAnswers: pricingContext(answers),
        };
        await this.prisma.$transaction(async (tx) => {
          await tx.insuranceQuoteCalculationInput.create({
            data: {
              quoteRequestId: requestId,
              productId: product.id,
              productVersionId: product.currentVersion.id,
              providerType: InsuranceQuoteSourceMode.MANUAL_RATE_CARD,
              providerVersion: `${PROVIDER_VERSION}:${rateCard.version}`,
              inputSnapshot: calculationInput,
            },
          });
          await tx.insuranceQuoteAttempt.create({
            data: {
              quoteRequestId: requestId,
              productId: product.id,
              productVersionId: product.currentVersion.id,
              providerType: InsuranceQuoteSourceMode.MANUAL_RATE_CARD,
              providerVersion: `${PROVIDER_VERSION}:${rateCard.version}`,
              status: InsuranceQuoteAttemptStatus.SUCCESS,
              startedAt,
              completedAt: new Date(),
              durationMs: Date.now() - startedAt.getTime(),
            },
          });
          await tx.insuranceQuote.create({
            data: {
              quoteRequestId: requestId,
              userId: product.requestUserId,
              organizationId: product.organizationId,
              productId: product.id,
              productVersionId: product.currentVersion.id,
              policyTypeId: product.policyTypeId,
              status: InsuranceQuoteStatus.GENERATED,
              currency: rateCard.currency,
              basePremium: rate.basePremium,
              addonPremium: rate.addonPremium,
              deductibleAdjustment: rate.deductibleAdjustment,
              otherAdjustments: rate.otherAdjustments,
              taxAmount: rate.taxAmount,
              totalPremium: total,
              sumInsured: rate.sumInsured,
              policyTerm: rate.policyTerm,
              deductibleSummary:
                product.currentVersion.deductibles
                  .map((item) => item.description)
                  .join("; ") || null,
              waitingPeriodSummary:
                product.currentVersion.waitingPeriods
                  .map((item) => item.description)
                  .join("; ") || null,
              coverageSummary: product.currentVersion.coverageSummary,
              exclusionSummary:
                product.currentVersion.exclusions
                  .map((item) => item.title)
                  .join("; ") || null,
              addonSummary:
                product.currentVersion.addons
                  .filter((item) => item.status === "ACTIVE")
                  .map((item) => item.name)
                  .join("; ") || null,
              sourceType: InsuranceQuoteSourceMode.MANUAL_RATE_CARD,
              sourceReference: rateCard.id,
              calculationVersion: `${ENGINE_VERSION}:${rateCard.version}`,
              resultSnapshot: normalizedResult(
                product,
                rateCard.currency,
                rate,
                total,
                validUntil,
              ),
              validFrom: new Date(),
              validUntil,
              generatedAt: new Date(),
            },
          });
        });
        generated += 1;
      } catch {
        unexpectedFailure += 1;
        await this.persistUnavailable({
          requestId,
          product,
          startedAt,
          status: InsuranceQuoteAttemptStatus.FAILED,
          quoteStatus: InsuranceQuoteStatus.FAILED,
          failureCode: "QUOTE_PROCESSING_FAILED",
          failureCategory: InsuranceQuoteFailureCategory.SYSTEM,
          evaluationId: evaluation.id,
        });
      }
    }
    const status =
      unexpectedFailure > 0 && generated > 0
        ? InsuranceQuoteRequestStatus.PARTIALLY_COMPLETED
        : unexpectedFailure > 0
          ? InsuranceQuoteRequestStatus.FAILED
          : InsuranceQuoteRequestStatus.COMPLETED;
    await this.prisma.insuranceQuoteRequest.update({
      where: { id: requestId },
      data: {
        status,
        completedAt: new Date(),
        expiresAt: addDays(
          new Date(),
          this.env.values.INSURANCE_QUOTE_TTL_DAYS,
        ),
      },
    });
  }

  private async persistUnavailable(input: {
    requestId: string;
    product: Awaited<
      ReturnType<InsuranceQuotationsService["candidates"]>
    >[number];
    startedAt: Date;
    status: InsuranceQuoteAttemptStatus;
    quoteStatus: InsuranceQuoteStatus;
    failureCode: string;
    failureCategory: InsuranceQuoteFailureCategory;
    evaluationId: string;
  }) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.insuranceQuoteAttempt.create({
        data: {
          quoteRequestId: input.requestId,
          productId: input.product.id,
          productVersionId: input.product.currentVersion.id,
          providerType: InsuranceQuoteSourceMode.MANUAL_RATE_CARD,
          status: input.status,
          failureCode: input.failureCode,
          failureCategory: input.failureCategory,
          startedAt: input.startedAt,
          completedAt: now,
          durationMs: now.getTime() - input.startedAt.getTime(),
        },
      });
      await tx.insuranceQuote.create({
        data: {
          quoteRequestId: input.requestId,
          userId: input.product.requestUserId,
          organizationId: input.product.organizationId,
          productId: input.product.id,
          productVersionId: input.product.currentVersion.id,
          policyTypeId: input.product.policyTypeId,
          status: input.quoteStatus,
          sourceType: InsuranceQuoteSourceMode.MANUAL_RATE_CARD,
          calculationVersion: ENGINE_VERSION,
          resultSnapshot: {
            evaluationId: input.evaluationId,
            failureCode: input.failureCode,
          },
        },
      });
    });
  }

  private async candidates(
    userId: string,
    policyTypeId: string,
    now: Date,
    snapshot: Prisma.JsonValue,
  ) {
    const location = quoteLocation(snapshotAnswers(snapshot));
    return this.prisma.insuranceProduct
      .findMany({
        where: {
          policyTypeId,
          status: InsuranceProductStatus.ACTIVE,
          organization: {
            is: {
              status: InsuranceOrganizationStatus.ACTIVE,
              licences: {
                some: {
                  status: InsuranceLicenceStatus.VALID,
                  validFrom: { lte: now },
                  OR: [{ validUntil: null }, { validUntil: { gte: now } }],
                },
              },
            },
          },
          currentVersion: {
            is: {
              status: InsuranceProductVersionStatus.APPROVED,
              effectiveFrom: { lte: now },
              OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
            },
          },
        },
        include: {
          policyType: { include: { insuranceLine: true } },
          organization: { include: { licences: true, insuranceLines: true } },
          currentVersion: {
            include: {
              eligibilityRules: true,
              waitingPeriods: true,
              deductibles: true,
              exclusions: true,
              addons: true,
              availability: true,
            },
          },
        },
      })
      .then((products) =>
        products.flatMap((product) => {
          if (!product.currentVersion) return [];
          const licensed = product.organization.licences.some((licence) =>
            licence.permittedLineCodes.includes(
              product.policyType.insuranceLine.code,
            ),
          );
          const mapped = product.organization.insuranceLines.some(
            (line) =>
              line.insuranceLineId === product.policyType.insuranceLineId,
          );
          if (
            !licensed ||
            !mapped ||
            !matchesAvailability(
              product.currentVersion.availabilityScope,
              product.currentVersion.availability,
              location,
            )
          )
            return [];
          return [
            {
              ...product,
              currentVersion: product.currentVersion,
              requestUserId: userId,
            },
          ];
        }),
      );
  }

  private async rateCard(productId: string, productVersionId: string) {
    const now = new Date();
    return this.prisma.insuranceRateCard.findFirst({
      where: {
        productId,
        productVersionId,
        status: InsuranceRateCardStatus.PUBLISHED,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
      },
      orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
      include: { entries: { orderBy: { sortOrder: "asc" } } },
    });
  }

  private evaluateEligibility(
    rules: readonly { ruleType: InsuranceEligibilityRuleType; value: string }[],
    answers: readonly SnapshotAnswer[],
  ): EligibilityResult {
    const age = numericAnswer(answers, ["age", "applicant_age", "entry_age"]);
    const term = numericAnswer(answers, ["policy_term", "policy_term_years"]);
    const sumInsured = numericAnswer(answers, ["sum_insured", "sumInsured"]);
    const reasons: Reason[] = [];
    for (const rule of rules) {
      const limit = Number(rule.value);
      if (!Number.isFinite(limit)) {
        reasons.push({
          code: "RULE_NOT_SUPPORTED",
          message:
            "This product needs additional review before a quote can be prepared.",
          ruleType: rule.ruleType,
          severity: InsuranceEligibilityReasonSeverity.WARNING,
        });
        continue;
      }
      const value = rule.ruleType.includes("AGE")
        ? age
        : rule.ruleType.includes("POLICY_TERM")
          ? term
          : rule.ruleType.includes("SUM_INSURED")
            ? sumInsured
            : undefined;
      if (value === undefined) {
        reasons.push({
          code: "DETAILS_REQUIRED",
          message:
            "Additional profile details are needed to check this product.",
          ruleType: rule.ruleType,
          severity: InsuranceEligibilityReasonSeverity.WARNING,
        });
        continue;
      }
      if (
        (rule.ruleType === InsuranceEligibilityRuleType.MIN_ENTRY_AGE ||
          rule.ruleType === InsuranceEligibilityRuleType.MIN_POLICY_TERM ||
          rule.ruleType === InsuranceEligibilityRuleType.MIN_SUM_INSURED) &&
        value < limit
      ) {
        reasons.push({
          code: "BELOW_PRODUCT_MINIMUM",
          message:
            "The selected details do not meet this product's minimum requirements.",
          ruleType: rule.ruleType,
          severity: InsuranceEligibilityReasonSeverity.ERROR,
        });
      }
      if (
        (rule.ruleType === InsuranceEligibilityRuleType.MAX_ENTRY_AGE ||
          rule.ruleType === InsuranceEligibilityRuleType.MAX_POLICY_TERM ||
          rule.ruleType === InsuranceEligibilityRuleType.MAX_SUM_INSURED) &&
        value > limit
      ) {
        reasons.push({
          code: "ABOVE_PRODUCT_MAXIMUM",
          message:
            "The selected details exceed this product's supported limits.",
          ruleType: rule.ruleType,
          severity: InsuranceEligibilityReasonSeverity.ERROR,
        });
      }
    }
    if (
      reasons.some(
        (reason) =>
          reason.severity === InsuranceEligibilityReasonSeverity.ERROR,
      )
    )
      return {
        status: InsuranceEligibilityEvaluationStatus.INELIGIBLE,
        reasons,
      };
    if (reasons.length)
      return {
        status: InsuranceEligibilityEvaluationStatus.UNDETERMINED,
        reasons,
      };
    return {
      status: InsuranceEligibilityEvaluationStatus.ELIGIBLE,
      reasons: [
        {
          code: "CATALOGUE_ELIGIBLE",
          message:
            "Product catalogue requirements are met. Final acceptance remains subject to insurer terms.",
          severity: InsuranceEligibilityReasonSeverity.INFO,
        },
      ],
    };
  }

  private async assertCurrentConsent(assessmentId: string) {
    const current = await this.prisma.insuranceConsentRecord.findMany({
      where: {
        assessmentId,
        purpose: { in: [...REQUIRED_CONSENTS] },
        status: InsuranceConsentStatus.GRANTED,
      },
      select: { purpose: true },
    });
    const granted = new Set(current.map((item) => item.purpose));
    if (REQUIRED_CONSENTS.some((purpose) => !granted.has(purpose)))
      throw new BadRequestException(
        "Required insurance consent is no longer active",
      );
  }

  private async assertCapability() {
    await this.capability.assertEnabled(
      InsuranceCapability.COLLECT_CUSTOMER_NEEDS,
    );
    await this.capability.assertEnabled(InsuranceCapability.REQUEST_QUOTES);
  }

  private idempotencyKey(value: string | undefined) {
    if (!value || !/^[\w.-]{8,128}$/.test(value))
      throw new BadRequestException(
        "A valid Idempotency-Key header is required",
      );
    return value;
  }

  private referenceNumber() {
    return `QTE-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  }

  private requestSummary(item: {
    id: string;
    referenceNumber: string;
    status: InsuranceQuoteRequestStatus;
    requestedAt: Date;
    expiresAt: Date | null;
    policyType: { name: string; slug: string };
    quotes: {
      status: InsuranceQuoteStatus;
      validUntil: Date | null;
      totalPremium: Prisma.Decimal | null;
      currency: string | null;
    }[];
  }) {
    return {
      id: item.id,
      referenceNumber: item.referenceNumber,
      status: item.status,
      requestedAt: item.requestedAt,
      expiresAt: item.expiresAt,
      policyType: item.policyType,
      generatedQuoteCount: item.quotes.filter(
        (quote) => quote.status === InsuranceQuoteStatus.GENERATED,
      ).length,
    };
  }

  private customerDetail(request: {
    referenceNumber: string;
    status: InsuranceQuoteRequestStatus;
    requestedAt: Date;
    completedAt: Date | null;
    expiresAt: Date | null;
    policyType: { name: string; slug: string };
    quotes: {
      id: string;
      status: InsuranceQuoteStatus;
      currency: string | null;
      basePremium: Prisma.Decimal | null;
      addonPremium: Prisma.Decimal | null;
      deductibleAdjustment: Prisma.Decimal | null;
      otherAdjustments: Prisma.Decimal | null;
      taxAmount: Prisma.Decimal | null;
      totalPremium: Prisma.Decimal | null;
      sumInsured: Prisma.Decimal | null;
      policyTerm: number | null;
      coverageSummary: string | null;
      exclusionSummary: string | null;
      addonSummary: string | null;
      waitingPeriodSummary: string | null;
      validFrom: Date | null;
      validUntil: Date | null;
      productVersion: { name: string; shortDescription: string };
      organization: { legalName: string; tradeName: string | null };
    }[];
    eligibilityEvaluations: {
      productId: string;
      status: InsuranceEligibilityEvaluationStatus;
      reasons: Reason[];
    }[];
  }) {
    return {
      referenceNumber: request.referenceNumber,
      status: request.status,
      requestedAt: request.requestedAt,
      completedAt: request.completedAt,
      expiresAt: request.expiresAt,
      policyType: request.policyType,
      quotes: request.quotes.map((quote) => ({
        ...quote,
        organizationName:
          quote.organization.tradeName ?? quote.organization.legalName,
        productName: quote.productVersion.name,
        productDescription: quote.productVersion.shortDescription,
        organization: undefined,
        productVersion: undefined,
      })),
      eligibility: request.eligibilityEvaluations.map((evaluation) => ({
        productId: evaluation.productId,
        status: evaluation.status,
        reasons: evaluation.reasons.map(({ code, message, severity }) => ({
          code,
          message,
          severity,
        })),
      })),
    };
  }
}

function snapshotAnswers(snapshot: Prisma.JsonValue): SnapshotAnswer[] {
  if (!Array.isArray(snapshot)) return [];
  return snapshot.flatMap((item) =>
    isRecord(item) && typeof item.questionKey === "string"
      ? [{ questionKey: item.questionKey, value: item.value }]
      : [],
  );
}
function numericAnswer(
  answers: readonly SnapshotAnswer[],
  keys: readonly string[],
) {
  const value = answers.find((answer) =>
    keys.includes(answer.questionKey),
  )?.value;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}
function pricingContext(
  answers: readonly SnapshotAnswer[],
): Prisma.InputJsonObject {
  const context: Record<string, Prisma.InputJsonValue> = {};
  for (const answer of answers) {
    if (!isProtected(answer.value))
      context[answer.questionKey] = jsonValue(answer.value);
  }
  return context;
}
function chooseRate<
  T extends {
    ageMin: number | null;
    ageMax: number | null;
    sumInsured: Prisma.Decimal | null;
    policyTerm: number | null;
  },
>(entries: readonly T[], answers: readonly SnapshotAnswer[]) {
  const age = numericAnswer(answers, ["age", "applicant_age", "entry_age"]);
  const term = numericAnswer(answers, ["policy_term", "policy_term_years"]);
  const sumInsured = numericAnswer(answers, ["sum_insured", "sumInsured"]);
  return (
    entries.find(
      (entry) =>
        (entry.ageMin === null || (age !== undefined && age >= entry.ageMin)) &&
        (entry.ageMax === null || (age !== undefined && age <= entry.ageMax)) &&
        (entry.policyTerm === null || entry.policyTerm === term) &&
        (entry.sumInsured === null ||
          (sumInsured !== undefined && entry.sumInsured.eq(sumInsured))),
    ) ?? null
  );
}
function normalizedResult(
  product: { currentVersion: { name: string } },
  currency: string,
  rate: {
    basePremium: Prisma.Decimal;
    addonPremium: Prisma.Decimal;
    deductibleAdjustment: Prisma.Decimal;
    otherAdjustments: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    sumInsured: Prisma.Decimal | null;
    policyTerm: number | null;
  },
  total: Prisma.Decimal,
  validUntil: Date,
) {
  return {
    productName: product.currentVersion.name,
    currency,
    premium: {
      basePremium: rate.basePremium.toString(),
      addonPremium: rate.addonPremium.toString(),
      deductibleAdjustment: rate.deductibleAdjustment.toString(),
      otherAdjustments: rate.otherAdjustments.toString(),
      taxAmount: rate.taxAmount.toString(),
      totalPremium: total.toString(),
    },
    sumInsured: rate.sumInsured?.toString() ?? null,
    policyTerm: rate.policyTerm,
    validUntil: validUntil.toISOString(),
  };
}
function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000);
}
function earliestDate(...values: (Date | null)[]) {
  return values
    .filter((value): value is Date => value !== null)
    .reduce((earliest, value) => (value < earliest ? value : earliest));
}
function isProtected(value: unknown) {
  return isRecord(value) && value.protected === true;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null) return "[null]";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  if (Array.isArray(value)) return value.map(jsonValue);
  if (isRecord(value))
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, jsonValue(item)]),
    );
  return "[unsupported]";
}
function quoteLocation(answers: readonly SnapshotAnswer[]) {
  return {
    stateId: stringAnswer(answers, ["state_id", "stateId"]),
    cityId: stringAnswer(answers, ["city_id", "cityId"]),
  };
}
function stringAnswer(
  answers: readonly SnapshotAnswer[],
  keys: readonly string[],
) {
  const value = answers.find((answer) =>
    keys.includes(answer.questionKey),
  )?.value;
  return typeof value === "string" ? value : undefined;
}
function matchesAvailability(
  scope: InsuranceAvailabilityScope,
  availability: readonly {
    stateId: string | null;
    cityId: string | null;
    availabilityType: InsuranceAvailabilityType;
  }[],
  location: { stateId?: string; cityId?: string },
) {
  if (scope === InsuranceAvailabilityScope.PAN_INDIA) return true;
  const cityMatches = location.cityId
    ? availability.filter((item) => item.cityId === location.cityId)
    : [];
  if (cityMatches.length)
    return cityMatches.some(
      (item) => item.availabilityType === InsuranceAvailabilityType.AVAILABLE,
    );
  const stateMatches = location.stateId
    ? availability.filter(
        (item) => item.cityId === null && item.stateId === location.stateId,
      )
    : [];
  return stateMatches.some(
    (item) => item.availabilityType === InsuranceAvailabilityType.AVAILABLE,
  );
}
