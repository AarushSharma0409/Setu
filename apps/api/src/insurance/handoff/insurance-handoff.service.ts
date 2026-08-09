import { createHash, randomBytes } from "node:crypto";

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceCapability,
  InsuranceConsentPurpose,
  InsuranceConsentStatus,
  InsuranceIntegrationStatus,
  InsuranceOrganizationStatus,
  InsuranceProviderMappingStatus,
  InsuranceQuoteStatus,
} from "@prisma/client";

import { EnvService } from "../../common/env/env.service";
import { PrismaService } from "../../database/prisma.service";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";
import { ProviderAdapterRegistry } from "../integrations/provider-adapter.registry";
import { sameTrustedProviderHost } from "../integrations/provider-url.security";

@Injectable()
export class InsuranceHandoffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly capability: InsuranceCapabilityServiceImpl,
    private readonly adapters: ProviderAdapterRegistry,
  ) {}

  async create(userId: string, quoteId: string) {
    await this.capability.assertEnabled(
      InsuranceCapability.REDIRECT_TO_PURCHASE,
    );
    const now = new Date();
    const quote = await this.prisma.insuranceQuote.findFirst({
      where: { id: quoteId, userId },
      include: {
        quoteRequest: {
          include: {
            assessment: { include: { consents: true, disclosures: true } },
          },
        },
        organization: { include: { licences: true } },
        product: true,
      },
    });
    if (!quote) throw new NotFoundException("Quote not found");
    if (
      quote.status !== InsuranceQuoteStatus.GENERATED ||
      !quote.validUntil ||
      quote.validUntil <= now
    )
      throw new BadRequestException(
        "This quote can no longer be continued online",
      );
    if (
      quote.organization.status !== InsuranceOrganizationStatus.ACTIVE ||
      quote.product.status !== "ACTIVE"
    )
      throw new BadRequestException(
        "Online continuation is not available for this quote",
      );
    if (
      !quote.organization.licences.some(
        (licence) =>
          licence.status === "VALID" &&
          licence.validFrom <= now &&
          (!licence.validUntil || licence.validUntil >= now),
      )
    )
      throw new BadRequestException(
        "Online continuation is not available for this quote",
      );
    this.assertEvidence(
      quote.quoteRequest.assessment.consents,
      quote.quoteRequest.assessment.disclosures,
    );

    const mapping = await this.prisma.insuranceProviderProductMapping.findFirst(
      {
        where: {
          productId: quote.productId,
          status: InsuranceProviderMappingStatus.ACTIVE,
          effectiveFrom: { lte: now },
          OR: [
            { productVersionId: quote.productVersionId },
            { productVersionId: null },
          ],
          AND: [
            { OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }] },
          ],
          integrationProvider: {
            status: InsuranceIntegrationStatus.ACTIVE,
            organizationId: quote.organizationId,
          },
        },
        include: { integrationProvider: true },
        orderBy: { effectiveFrom: "desc" },
      },
    );
    if (
      !mapping ||
      !mapping.integrationProvider.capabilities.includes("PURCHASE_HANDOFF")
    )
      throw new BadRequestException(
        "Online continuation is currently unavailable",
      );
    const adapter = this.adapters.get(mapping.integrationProvider.code);
    if (!adapter.supportsPurchaseHandoff())
      throw new BadRequestException(
        "Online continuation is currently unavailable",
      );

    const token = randomBytes(32).toString("base64url");
    const stateTokenHash = hash(token);
    const expiresAt = new Date(
      Math.min(
        quote.validUntil.getTime(),
        now.getTime() + this.env.values.INSURANCE_HANDOFF_TTL_MINUTES * 60_000,
      ),
    );
    const existing = await this.prisma.insurancePurchaseHandoff.findFirst({
      where: {
        userId,
        quoteId,
        integrationProviderId: mapping.integrationProviderId,
        status: { in: ["CREATED", "READY"] },
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });
    const handoff = existing
      ? await this.prisma.insurancePurchaseHandoff.update({
          where: { id: existing.id },
          data: { stateTokenHash, expiresAt },
        })
      : await this.prisma.insurancePurchaseHandoff.create({
          data: {
            referenceNumber: handoffReference(),
            userId,
            quoteRequestId: quote.quoteRequestId,
            quoteId: quote.id,
            organizationId: quote.organizationId,
            productId: quote.productId,
            integrationProviderId: mapping.integrationProviderId,
            stateTokenHash,
            expiresAt,
            attribution: {
              quoteReference: quote.quoteRequest.referenceNumber,
              selectedAt: now.toISOString(),
              source: "customer_quote",
            },
          },
        });
    const request = await this.prisma.insuranceProviderRequest.create({
      data: {
        quoteRequestId: quote.quoteRequestId,
        quoteId: quote.id,
        integrationProviderId: mapping.integrationProviderId,
        operationType: "HANDOFF",
        requestHash: hash(`${handoff.id}:${stateTokenHash}`),
      },
    });
    try {
      const result = await adapter.createPurchaseHandoff(
        {
          handoffReference: handoff.referenceNumber,
          stateToken: token,
          externalProductCode: mapping.externalProductCode,
          quoteReference: quote.quoteRequest.referenceNumber,
        },
        mapping.integrationProvider.baseUrlReference,
      );
      const destination = sameTrustedProviderHost(
        mapping.integrationProvider.baseUrlReference,
        result.redirectUrl,
      );
      const updated = await this.prisma.$transaction(async (tx) => {
        const ready = await tx.insurancePurchaseHandoff.update({
          where: { id: handoff.id },
          data: {
            status: "READY",
            externalReference: result.externalReference,
            expiresAt:
              result.expiresAt && result.expiresAt < expiresAt
                ? result.expiresAt
                : expiresAt,
          },
        });
        await tx.insuranceProviderRequest.update({
          where: { id: request.id },
          data: {
            status: "SUCCEEDED",
            externalReference: result.externalReference,
            completedAt: new Date(),
            durationMs: Date.now() - now.getTime(),
          },
        });
        if (!existing)
          await tx.insuranceRedirectEvent.create({
            data: {
              handoffId: ready.id,
              userId,
              quoteId: quote.id,
              integrationProviderId: mapping.integrationProviderId,
              eventType: "HANDOFF_CREATED",
              destinationHost: destination.host,
            },
          });
        return ready;
      });
      return {
        handoffId: updated.id,
        referenceNumber: updated.referenceNumber,
        redirectUrl: destination.toString(),
        expiresAt: updated.expiresAt,
        providerName: mapping.integrationProvider.name,
      };
    } catch (error) {
      await this.prisma.$transaction([
        this.prisma.insurancePurchaseHandoff.update({
          where: { id: handoff.id },
          data: { status: "FAILED", failedAt: new Date() },
        }),
        this.prisma.insuranceProviderRequest.update({
          where: { id: request.id },
          data: {
            status: "FAILED",
            errorCategory: "PROVIDER_UNAVAILABLE",
            completedAt: new Date(),
            durationMs: Date.now() - now.getTime(),
          },
        }),
      ]);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(
            "We could not prepare the handoff right now. Your quote has not changed.",
          );
    }
  }

  async recordRedirect(userId: string, handoffId: string) {
    const handoff = await this.prisma.insurancePurchaseHandoff.findFirst({
      where: { id: handoffId, userId },
    });
    if (!handoff) throw new NotFoundException("Handoff not found");
    if (handoff.expiresAt <= new Date()) {
      await this.prisma.insurancePurchaseHandoff.update({
        where: { id: handoff.id },
        data: { status: "EXPIRED" },
      });
      throw new BadRequestException("This handoff has expired");
    }
    if (handoff.status !== "READY" && handoff.status !== "REDIRECTED")
      throw new BadRequestException("This handoff cannot be redirected");
    await this.prisma.$transaction([
      this.prisma.insurancePurchaseHandoff.update({
        where: { id: handoff.id },
        data: {
          status: "REDIRECTED",
          redirectedAt: handoff.redirectedAt ?? new Date(),
        },
      }),
      this.prisma.insuranceRedirectEvent.create({
        data: {
          handoffId: handoff.id,
          userId,
          quoteId: handoff.quoteId,
          integrationProviderId: handoff.integrationProviderId,
          eventType: "REDIRECT_INITIATED",
        },
      }),
    ]);
    return { ok: true };
  }

  async returned(stateToken: string) {
    const handoff = await this.prisma.insurancePurchaseHandoff.findUnique({
      where: { stateTokenHash: hash(stateToken) },
      include: { integrationProvider: { select: { name: true } } },
    });
    if (!handoff || handoff.expiresAt <= new Date())
      throw new NotFoundException("Handoff session not found");
    const consumed = await this.prisma.insurancePurchaseHandoff.updateMany({
      where: {
        id: handoff.id,
        stateTokenHash: hash(stateToken),
        expiresAt: { gt: new Date() },
        status: { in: ["READY", "REDIRECTED"] },
      },
      data: { status: "ACKNOWLEDGED", completedAt: new Date() },
    });
    if (consumed.count !== 1)
      throw new NotFoundException("Handoff session not found");
    await this.prisma.insuranceRedirectEvent.create({
      data: {
        handoffId: handoff.id,
        userId: handoff.userId,
        quoteId: handoff.quoteId,
        integrationProviderId: handoff.integrationProviderId,
        eventType: "RETURN_RECEIVED",
      },
    });
    return {
      referenceNumber: handoff.referenceNumber,
      providerName: handoff.integrationProvider.name,
      status: "ACKNOWLEDGED",
      expiresAt: handoff.expiresAt,
    };
  }

  private assertEvidence(
    consents: Array<{
      purpose: InsuranceConsentPurpose;
      status: InsuranceConsentStatus;
    }>,
    disclosures: unknown[],
  ) {
    const has = (purpose: InsuranceConsentPurpose) =>
      consents.some(
        (consent) =>
          consent.purpose === purpose &&
          consent.status === InsuranceConsentStatus.GRANTED,
      );
    if (
      !has(InsuranceConsentPurpose.INSURER_DATA_SHARING) ||
      !has(InsuranceConsentPurpose.REDIRECT_HANDOFF) ||
      disclosures.length === 0
    )
      throw new ForbiddenException(
        "Required consent or disclosure acknowledgement is missing",
      );
  }
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function handoffReference() {
  return `HOF-${new Date().getUTCFullYear()}-${randomBytes(5).toString("base64url").toUpperCase()}`;
}
