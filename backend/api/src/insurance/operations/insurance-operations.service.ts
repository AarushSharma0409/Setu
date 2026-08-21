import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceProviderRequestStatus,
  InsuranceQuoteAttemptStatus,
  InsuranceRateCardStatus,
  Prisma,
} from "@prisma/client";

import {
  HandoffOperationsListDto,
  OperationsListDto,
  OperationsWindowDto,
  QuoteOperationsListDto,
  RemediationReasonDto,
  SupportSearchDto,
} from "./dto/operations.dto";
import { AuditService } from "../../audit/audit.service";
import { EnvService } from "../../common/env/env.service";
import { PrismaService } from "../../database/prisma.service";
import { InsuranceHandoffService } from "../handoff/insurance-handoff.service";
import { InsuranceIntegrationsService } from "../integrations/insurance-integrations.service";
import { InsuranceQuotationsService } from "../quotations/insurance-quotations.service";

@Injectable()
export class InsuranceOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly env: EnvService,
    private readonly quotations: InsuranceQuotationsService,
    private readonly integrations: InsuranceIntegrationsService,
    private readonly handoffs: InsuranceHandoffService,
  ) {}

  async summary(query: OperationsWindowDto) {
    const range = this.range(query);
    const [
      quoteRequests,
      completedQuotes,
      partialQuotes,
      failedQuotes,
      activeProviders,
      degradedProviders,
      unavailableProviders,
      handoffsCreated,
      handoffFailures,
      callbacksPending,
      callbacksFailed,
    ] = await this.prisma.$transaction([
      this.prisma.insuranceQuoteRequest.count({
        where: { requestedAt: range },
      }),
      this.prisma.insuranceQuoteRequest.count({
        where: { requestedAt: range, status: "COMPLETED" },
      }),
      this.prisma.insuranceQuoteRequest.count({
        where: { requestedAt: range, status: "PARTIALLY_COMPLETED" },
      }),
      this.prisma.insuranceQuoteRequest.count({
        where: { requestedAt: range, status: "FAILED" },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { status: "ACTIVE" },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { healthStatus: "DEGRADED" },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { healthStatus: "UNAVAILABLE" },
      }),
      this.prisma.insurancePurchaseHandoff.count({
        where: { createdAt: range },
      }),
      this.prisma.insurancePurchaseHandoff.count({
        where: { createdAt: range, status: "FAILED" },
      }),
      this.prisma.insuranceProviderEvent.count({
        where: { status: "RECEIVED" },
      }),
      this.prisma.insuranceProviderEvent.count({ where: { status: "FAILED" } }),
    ]);
    const warnings = await this.configurationWarnings();
    return {
      window: range,
      quoteRequests,
      completedQuotes,
      partialQuotes,
      failedQuotes,
      activeProviders,
      degradedProviders,
      unavailableProviders,
      handoffsCreated,
      handoffFailures,
      callbacksPending,
      callbacksFailed,
      quoteFailureRate: quoteRequests ? failedQuotes / quoteRequests : null,
      warnings,
    };
  }

  async quotes(query: QuoteOperationsListDto) {
    const page = this.page(query);
    const range = this.range(query);
    const hasFailures =
      query.hasFailures === "true"
        ? { attempts: { some: { status: InsuranceQuoteAttemptStatus.FAILED } } }
        : {};
    const where: Prisma.InsuranceQuoteRequestWhereInput = {
      requestedAt: range,
      status: query.status,
      referenceNumber: query.reference
        ? { contains: query.reference.trim(), mode: "insensitive" }
        : undefined,
      ...hasFailures,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceQuoteRequest.findMany({
        where,
        orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
        skip: page.skip,
        take: page.take,
        include: {
          user: { select: { id: true } },
          policyType: { select: { name: true, code: true } },
          quotes: { select: { id: true, status: true } },
          attempts: {
            select: { status: true, failureCode: true, failureCategory: true },
          },
        },
      }),
      this.prisma.insuranceQuoteRequest.count({ where }),
    ]);
    return {
      items: items.map((item) => ({
        id: item.id,
        referenceNumber: item.referenceNumber,
        customerReference: opaque(item.user.id),
        status: item.status,
        sourceMode: item.sourceMode,
        policyType: item.policyType,
        generatedQuotes: item.quotes.filter(
          (quote) => quote.status === "GENERATED",
        ).length,
        failedAttempts: item.attempts.filter(
          (attempt) => attempt.status === "FAILED",
        ).length,
        requestedAt: item.requestedAt,
        completedAt: item.completedAt,
        expiresAt: item.expiresAt,
        recalculationOfQuoteRequestId: item.recalculationOfQuoteRequestId,
      })),
      ...page.meta(total),
    };
  }

  async quoteDetail(id: string) {
    const request = await this.quotations.adminDetail(id);
    return {
      ...request,
      customer: { reference: opaque(request.user.id) },
      user: undefined,
      attempts: request.attempts.map((attempt) => ({
        ...attempt,
        operationalFailureGroup: failureGroup(
          attempt.failureCategory,
          attempt.failureCode,
        ),
      })),
    };
  }

  async recalculateQuote(
    adminUserId: string,
    quoteRequestId: string,
    reason: RemediationReasonDto,
  ) {
    this.assertRemediation();
    const request = await this.prisma.insuranceQuoteRequest.findUnique({
      where: { id: quoteRequestId },
      select: { id: true, userId: true, assessmentId: true, status: true },
    });
    if (!request) throw new NotFoundException("Quote request not found");
    if (request.status === "PROCESSING" || request.status === "PENDING")
      throw new ConflictException("Quote request is already being processed");
    const result = await this.quotations.recalculate(
      request.userId,
      request.assessmentId,
      request.id,
      `ops-${adminUserId}-${Date.now()}`,
    );
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_QUOTE_RECALCULATED_BY_OPERATIONS",
      entityType: "InsuranceQuoteRequest",
      entityId: quoteRequestId,
      metadata: {
        reasonCode: reason.reasonCode,
        reasonText: reason.reasonText,
        recalculationReference: result.referenceNumber,
      },
    });
    return result;
  }

  async retryQuote(
    adminUserId: string,
    quoteRequestId: string,
    reason: RemediationReasonDto,
  ) {
    this.assertRemediation();
    const attempts = await this.prisma.insuranceQuoteAttempt.findMany({
      where: { quoteRequestId, status: InsuranceQuoteAttemptStatus.FAILED },
      select: { failureCategory: true },
    });
    if (!attempts.length)
      throw new BadRequestException(
        "There are no failed quote attempts to retry",
      );
    const transient = attempts.some(
      (attempt) => attempt.failureCategory === "PROVIDER_UNAVAILABLE",
    );
    if (!transient)
      throw new BadRequestException(
        "Only transient provider failures are retryable",
      );
    // I4 uses deterministic manual rate cards; no provider quote adapter exists to safely replay.
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_QUOTE_RETRY_REJECTED",
      entityType: "InsuranceQuoteRequest",
      entityId: quoteRequestId,
      metadata: {
        reasonCode: reason.reasonCode,
        failure: "NO_LIVE_PROVIDER_ADAPTER",
      },
    });
    throw new ConflictException(
      "Retry is unavailable until an approved live provider quote adapter is configured. Use recalculation only when appropriate.",
    );
  }

  async providers(query: OperationsListDto) {
    const page = this.page(query);
    const range = this.range(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceIntegrationProvider.findMany({
        orderBy: [{ healthStatus: "asc" }, { name: "asc" }],
        skip: page.skip,
        take: page.take,
        include: {
          organization: { select: { legalName: true, tradeName: true } },
          productMappings: { select: { id: true } },
          requests: {
            where: { createdAt: range },
            select: {
              status: true,
              durationMs: true,
              completedAt: true,
              errorCategory: true,
            },
          },
        },
      }),
      this.prisma.insuranceIntegrationProvider.count(),
    ]);
    return {
      items: items.map((provider) => providerSummary(provider)),
      ...page.meta(total),
    };
  }

  async providerDetail(id: string, query: OperationsWindowDto) {
    const provider = await this.prisma.insuranceIntegrationProvider.findUnique({
      where: { id },
      include: {
        organization: {
          select: { legalName: true, tradeName: true, status: true },
        },
        productMappings: {
          select: {
            id: true,
            status: true,
            effectiveFrom: true,
            effectiveUntil: true,
          },
        },
        requests: {
          where: { createdAt: this.range(query) },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            operationType: true,
            status: true,
            errorCategory: true,
            durationMs: true,
            createdAt: true,
            completedAt: true,
            externalReference: true,
          },
        },
      },
    });
    if (!provider) throw new NotFoundException("Integration not found");
    return providerSummary(provider);
  }

  async healthCheck(
    adminUserId: string,
    id: string,
    reason: RemediationReasonDto,
  ) {
    const result = await this.integrations.health(id);
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_PROVIDER_HEALTH_CHECK_TRIGGERED",
      entityType: "InsuranceIntegrationProvider",
      entityId: id,
      metadata: {
        reasonCode: reason.reasonCode,
        reasonText: reason.reasonText,
        status: result.status,
      },
    });
    return result;
  }

  async suspendProvider(
    adminUserId: string,
    id: string,
    reason: RemediationReasonDto,
  ) {
    const result = await this.integrations.suspend(adminUserId, id);
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_PROVIDER_SUSPENDED_BY_OPERATIONS",
      entityType: "InsuranceIntegrationProvider",
      entityId: id,
      metadata: reason,
    });
    return result;
  }

  async reactivateProvider(
    adminUserId: string,
    id: string,
    reason: RemediationReasonDto,
  ) {
    const result = await this.integrations.activate(adminUserId, id);
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_PROVIDER_REACTIVATED_BY_OPERATIONS",
      entityType: "InsuranceIntegrationProvider",
      entityId: id,
      metadata: reason,
    });
    return result;
  }

  async callbacks(query: OperationsListDto) {
    const page = this.page(query);
    const where = {
      receivedAt: this.range(query),
      externalEventId: query.reference
        ? { contains: query.reference.trim(), mode: "insensitive" as const }
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceProviderEvent.findMany({
        where,
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        skip: page.skip,
        take: page.take,
        include: {
          integrationProvider: { select: { name: true, code: true } },
        },
      }),
      this.prisma.insuranceProviderEvent.count({ where }),
    ]);
    return { items, ...page.meta(total) };
  }
  async callbackDetail(id: string) {
    const event = await this.prisma.insuranceProviderEvent.findUnique({
      where: { id },
      include: {
        integrationProvider: { select: { name: true, code: true } },
        handoff: { select: { referenceNumber: true, status: true } },
      },
    });
    if (!event) throw new NotFoundException("Callback event not found");
    return event;
  }
  async reprocessCallback(
    adminUserId: string,
    id: string,
    reason: RemediationReasonDto,
  ) {
    if (!this.env.values.INSURANCE_CALLBACK_REPROCESS_ENABLED)
      throw new BadRequestException("Callback reprocessing is disabled");
    const event = await this.callbackDetail(id);
    if (event.status !== "FAILED")
      throw new ConflictException(
        "Only failed verified callback processing can be retried",
      );
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_CALLBACK_REPROCESS_REJECTED",
      entityType: "InsuranceProviderEvent",
      entityId: id,
      metadata: { ...reason, failure: "NO_PROVIDER_CALLBACK_ADAPTER" },
    });
    throw new ConflictException(
      "Callback reprocessing is unavailable until a provider-specific verified callback adapter is configured",
    );
  }

  async handoffList(query: HandoffOperationsListDto) {
    const page = this.page(query);
    const where = {
      createdAt: this.range(query),
      status: query.status,
      referenceNumber: query.reference
        ? { contains: query.reference.trim(), mode: "insensitive" as const }
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insurancePurchaseHandoff.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: page.skip,
        take: page.take,
        include: {
          integrationProvider: { select: { name: true } },
          product: { select: { code: true } },
          quoteRequest: { select: { referenceNumber: true } },
          conversion: { select: { status: true, externalStatus: true } },
        },
      }),
      this.prisma.insurancePurchaseHandoff.count({ where }),
    ]);
    return { items, ...page.meta(total) };
  }
  async handoffDetail(id: string) {
    const handoff = await this.prisma.insurancePurchaseHandoff.findUnique({
      where: { id },
      include: {
        integrationProvider: { select: { name: true, environment: true } },
        product: { select: { code: true } },
        quoteRequest: { select: { referenceNumber: true } },
        redirectEvents: { orderBy: { occurredAt: "asc" } },
        providerEvents: {
          select: {
            externalEventId: true,
            eventType: true,
            status: true,
            mappedStatus: true,
            receivedAt: true,
          },
        },
        conversion: true,
      },
    });
    if (!handoff) throw new NotFoundException("Handoff not found");
    return {
      ...handoff,
      stateTokenValid:
        handoff.expiresAt > new Date() &&
        ["CREATED", "READY", "REDIRECTED"].includes(handoff.status),
      stateTokenHash: undefined,
    };
  }
  async retryHandoff(
    adminUserId: string,
    id: string,
    reason: RemediationReasonDto,
  ) {
    this.assertRemediation();
    const handoff = await this.prisma.insurancePurchaseHandoff.findUnique({
      where: { id },
      select: { userId: true, quoteId: true, status: true },
    });
    if (!handoff) throw new NotFoundException("Handoff not found");
    if (["COMPLETED", "CANCELLED"].includes(handoff.status))
      throw new ConflictException(
        "Completed or cancelled handoffs cannot be retried",
      );
    const result = await this.handoffs.create(handoff.userId, handoff.quoteId);
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_HANDOFF_RETRIED",
      entityType: "InsurancePurchaseHandoff",
      entityId: id,
      metadata: { ...reason, recoveredHandoffId: result.handoffId },
    });
    return {
      handoffId: result.handoffId,
      referenceNumber: result.referenceNumber,
      status: "READY",
    };
  }

  async supportSearch(adminUserId: string, query: SupportSearchDto) {
    const reference = query.reference?.trim();
    const email = query.email?.trim().toLowerCase();
    const phone = query.phone?.replace(/\s+/g, "");
    if (!reference && !email && !phone)
      throw new BadRequestException(
        "Provide an exact reference, email, or phone",
      );
    if (reference && reference.length < 6)
      throw new BadRequestException("Reference search is too short");
    const user =
      email || phone
        ? await this.prisma.user.findFirst({
            where: { email, phone },
            select: { id: true, email: true, phone: true, name: true },
          })
        : await this.userForReference(reference!);
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_SUPPORT_CUSTOMER_LOOKUP",
      entityType: "User",
      entityId: user?.id,
      metadata: {
        lookup: reference ? "reference" : email ? "email" : "phone",
        found: Boolean(user),
      },
    });
    if (!user) return { user: null, items: [] };
    return this.supportUser(user.id);
  }
  async supportUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        insuranceNeedAssessments: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            submittedAt: true,
          },
        },
        insuranceQuoteRequests: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            requestedAt: true,
            expiresAt: true,
          },
        },
        insuranceSavedQuotes: { select: { quoteId: true, savedAt: true } },
        insurancePurchaseHandoffs: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return {
      user: {
        id: user.id,
        reference: opaque(user.id),
        email: maskEmail(user.email),
        phone: maskPhone(user.phone),
        name: user.name,
      },
      assessments: user.insuranceNeedAssessments,
      quoteRequests: user.insuranceQuoteRequests,
      savedQuotes: user.insuranceSavedQuotes,
      handoffs: user.insurancePurchaseHandoffs,
    };
  }
  async evidence(
    adminUserId: string,
    type: "consent" | "disclosure",
    id: string,
  ) {
    const evidence =
      type === "consent"
        ? await this.prisma.insuranceConsentRecord.findUnique({
            where: { id },
            include: { assessment: { select: { referenceNumber: true } } },
          })
        : await this.prisma.insuranceDisclosureAcknowledgement.findUnique({
            where: { id },
            include: { assessment: { select: { referenceNumber: true } } },
          });
    if (!evidence) throw new NotFoundException("Evidence not found");
    await this.audit.record({
      adminUserId,
      action: "INSURANCE_EVIDENCE_VIEWED",
      entityType:
        type === "consent"
          ? "InsuranceConsentRecord"
          : "InsuranceDisclosureAcknowledgement",
      entityId: id,
    });
    return evidence;
  }

  private range(query: OperationsWindowDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(
          to.getTime() -
            this.env.values.INSURANCE_OPERATIONS_DEFAULT_WINDOW_HOURS *
              3_600_000,
        );
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from >= to ||
      to.getTime() - from.getTime() > 31 * 86_400_000
    )
      throw new BadRequestException("Use a valid time window up to 31 days");
    return { gte: from, lte: to };
  }
  private page(query: OperationsListDto) {
    const current = Math.max(1, Math.trunc(query.page ?? 1));
    const take = Math.min(100, Math.max(1, Math.trunc(query.pageSize ?? 25)));
    return {
      skip: (current - 1) * take,
      take,
      meta: (total: number) => ({
        page: current,
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      }),
    };
  }
  private assertRemediation() {
    if (!this.env.values.INSURANCE_OPERATIONS_RETRY_ENABLED)
      throw new BadRequestException("Operations remediation is disabled");
  }
  private async userForReference(reference: string) {
    const [assessment, quote, handoff] = await Promise.all([
      this.prisma.insuranceNeedAssessment.findUnique({
        where: { referenceNumber: reference },
        select: { userId: true },
      }),
      this.prisma.insuranceQuoteRequest.findUnique({
        where: { referenceNumber: reference },
        select: { userId: true },
      }),
      this.prisma.insurancePurchaseHandoff.findUnique({
        where: { referenceNumber: reference },
        select: { userId: true },
      }),
    ]);
    const userId = assessment?.userId ?? quote?.userId ?? handoff?.userId;
    return userId
      ? this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        })
      : null;
  }
  private async configurationWarnings() {
    const warningUntil = new Date(
      Date.now() + this.env.values.INSURANCE_EXPIRY_WARNING_DAYS * 86_400_000,
    );
    const [noRateCard, expiringLicences, unhealthyProviders] =
      await this.prisma.$transaction([
        this.prisma.insuranceProduct.count({
          where: {
            status: "ACTIVE",
            rateCards: { none: { status: InsuranceRateCardStatus.PUBLISHED } },
          },
        }),
        this.prisma.insuranceOrganizationLicence.count({
          where: {
            status: "VALID",
            validUntil: { lte: warningUntil, gte: new Date() },
          },
        }),
        this.prisma.insuranceIntegrationProvider.count({
          where: { healthStatus: { in: ["DEGRADED", "UNAVAILABLE"] } },
        }),
      ]);
    return [
      {
        code: "ACTIVE_PRODUCT_NO_PUBLISHED_RATE_CARD",
        severity: "WARNING",
        count: noRateCard,
      },
      {
        code: "LICENCE_EXPIRING",
        severity: "WARNING",
        count: expiringLicences,
      },
      {
        code: "PROVIDER_UNHEALTHY",
        severity: "CRITICAL",
        count: unhealthyProviders,
      },
    ].filter((warning) => warning.count > 0);
  }
}

function opaque(value: string) {
  return `USR-${value
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase()}`;
}
function maskEmail(value: string | null) {
  if (!value) return null;
  const [local, domain] = value.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}
function maskPhone(value: string | null) {
  return value ? `***${value.slice(-4)}` : null;
}
function failureGroup(category: string | null, code: string | null) {
  if (category === "PROVIDER_UNAVAILABLE") return "PROVIDER_ERROR";
  if (category === "PRICING") return "PRICING";
  if (category === "CONFIGURATION") return "PRODUCT_CONFIGURATION";
  if (category === "ELIGIBILITY") return "ELIGIBILITY";
  return code ? "INTERNAL_SYSTEM" : null;
}
function providerSummary(provider: {
  id: string;
  code: string;
  name: string;
  environment: string;
  status: string;
  healthStatus: string;
  authType: string;
  timeoutMs: number;
  retryPolicy: unknown;
  capabilities: string[];
  lastHealthCheckAt: Date | null;
  organization: { legalName: string; tradeName: string | null };
  productMappings: unknown[];
  requests: Array<{
    status: InsuranceProviderRequestStatus;
    durationMs: number | null;
    completedAt: Date | null;
    errorCategory: string | null;
  }>;
}) {
  const completed = provider.requests.filter((request) => request.completedAt);
  const successful = completed.filter(
    (request) => request.status === "SUCCEEDED",
  );
  const durations = completed.flatMap((request) =>
    request.durationMs === null ? [] : [request.durationMs],
  );
  return {
    id: provider.id,
    code: provider.code,
    name: provider.name,
    environment: provider.environment,
    status: provider.status,
    healthStatus: provider.healthStatus,
    authType: provider.authType,
    timeoutMs: provider.timeoutMs,
    retryPolicy: provider.retryPolicy,
    capabilities: provider.capabilities,
    lastHealthCheckAt: provider.lastHealthCheckAt,
    organization: provider.organization,
    productMappings: provider.productMappings.length,
    requests: {
      total: provider.requests.length,
      successful: successful.length,
      failed: completed.filter((request) => request.status === "FAILED").length,
      successRate: completed.length
        ? successful.length / completed.length
        : null,
      averageDurationMs: durations.length
        ? Math.round(
            durations.reduce((total, duration) => total + duration, 0) /
              durations.length,
          )
        : null,
    },
  };
}
