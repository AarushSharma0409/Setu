import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceIntegrationStatus,
  InsuranceOrganizationStatus,
  InsuranceProviderHealthStatus,
  InsuranceProviderMappingStatus,
  Prisma,
} from "@prisma/client";

import {
  CreateIntegrationDto,
  CreateProductMappingDto,
  RotateCredentialReferenceDto,
  UpdateIntegrationDto,
} from "./dto/integration.dto";
import { ProviderAdapterRegistry } from "./provider-adapter.registry";
import { trustedProviderUrl } from "./provider-url.security";
import { AuditService } from "../../audit/audit.service";
import { EnvService } from "../../common/env/env.service";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class InsuranceIntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly env: EnvService,
    private readonly adapters: ProviderAdapterRegistry,
  ) {}

  async dashboard() {
    const since = new Date(Date.now() - 86_400_000);
    const [
      active,
      sandbox,
      production,
      healthy,
      degraded,
      unavailable,
      requests,
      failures,
      handoffs,
      callbacks,
    ] = await this.prisma.$transaction([
      this.prisma.insuranceIntegrationProvider.count({
        where: { status: InsuranceIntegrationStatus.ACTIVE },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { environment: "SANDBOX" },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { environment: "PRODUCTION" },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { healthStatus: "HEALTHY" },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { healthStatus: "DEGRADED" },
      }),
      this.prisma.insuranceIntegrationProvider.count({
        where: { healthStatus: "UNAVAILABLE" },
      }),
      this.prisma.insuranceProviderRequest.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.insuranceProviderRequest.count({
        where: { createdAt: { gte: since }, status: "FAILED" },
      }),
      this.prisma.insurancePurchaseHandoff.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.insuranceProviderEvent.count({
        where: { status: "RECEIVED" },
      }),
    ]);
    return {
      active,
      sandbox,
      production,
      healthy,
      degraded,
      unavailable,
      requestsLast24Hours: requests,
      failuresLast24Hours: failures,
      handoffsCreatedLast24Hours: handoffs,
      callbacksAwaitingProcessing: callbacks,
    };
  }

  async list() {
    const items = await this.prisma.insuranceIntegrationProvider.findMany({
      orderBy: [{ environment: "asc" }, { name: "asc" }],
      include: {
        organization: { select: { legalName: true, tradeName: true } },
        _count: { select: { productMappings: true } },
      },
    });
    return { items: items.map((item) => this.safeProvider(item)) };
  }

  async detail(id: string) {
    const provider = await this.prisma.insuranceIntegrationProvider.findUnique({
      where: { id },
      include: {
        organization: {
          select: { legalName: true, tradeName: true, status: true },
        },
        productMappings: {
          include: {
            product: { select: { code: true, slug: true } },
            productVersion: { select: { versionNumber: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!provider) throw new NotFoundException("Integration not found");
    return {
      ...this.safeProvider(provider),
      productMappings: provider.productMappings,
    };
  }

  async create(adminUserId: string, dto: CreateIntegrationDto) {
    this.assertTrustedProviderUrl(dto.baseUrlReference);
    const organization = await this.prisma.insuranceOrganization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true },
    });
    if (!organization) throw new BadRequestException("Organization not found");
    const provider = await this.prisma.$transaction(async (tx) => {
      const created = await tx.insuranceIntegrationProvider.create({
        data: {
          ...dto,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          baseUrlReference: this.assertTrustedProviderUrl(dto.baseUrlReference),
          retryPolicy: defaultRetryPolicy(
            this.env.values.INSURANCE_PROVIDER_MAX_RETRIES,
          ),
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_INTEGRATION_CREATED",
          entityType: "InsuranceIntegrationProvider",
          entityId: created.id,
          metadata: {
            code: created.code,
            environment: created.environment,
            organizationId: created.organizationId,
          },
        },
        tx,
      );
      return created;
    });
    return this.safeProvider(provider);
  }

  async update(adminUserId: string, id: string, dto: UpdateIntegrationDto) {
    if (dto.baseUrlReference)
      this.assertTrustedProviderUrl(dto.baseUrlReference);
    const provider = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.insuranceIntegrationProvider.update({
        where: { id },
        data: {
          ...dto,
          name: dto.name?.trim(),
          baseUrlReference: dto.baseUrlReference
            ? this.assertTrustedProviderUrl(dto.baseUrlReference)
            : undefined,
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_INTEGRATION_UPDATED",
          entityType: "InsuranceIntegrationProvider",
          entityId: id,
          metadata: { changed: Object.keys(dto) },
        },
        tx,
      );
      return updated;
    });
    return this.safeProvider(provider);
  }

  async rotateCredentialReference(
    adminUserId: string,
    id: string,
    dto: RotateCredentialReferenceDto,
  ) {
    const provider = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.insuranceIntegrationProvider.update({
        where: { id },
        data: {
          secretReference: dto.secretReference.trim(),
          credentialVersion: dto.credentialVersion?.trim(),
          lastRotatedAt: new Date(),
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_INTEGRATION_CREDENTIAL_REFERENCE_ROTATED",
          entityType: "InsuranceIntegrationProvider",
          entityId: id,
          metadata: { credentialVersion: updated.credentialVersion ?? null },
        },
        tx,
      );
      return updated;
    });
    return this.safeProvider(provider);
  }

  async activate(adminUserId: string, id: string) {
    const provider = await this.prisma.insuranceIntegrationProvider.findUnique({
      where: { id },
      include: {
        organization: { include: { licences: true } },
        productMappings: true,
      },
    });
    if (!provider) throw new NotFoundException("Integration not found");
    this.assertActivatable(provider);
    const health = await this.adapters.get(provider.code).healthCheck();
    if (health.status === "UNAVAILABLE")
      throw new BadRequestException("Integration health check failed");
    const updated = await this.prisma.$transaction(async (tx) => {
      const active = await tx.insuranceIntegrationProvider.update({
        where: { id },
        data: {
          status: "ACTIVE",
          healthStatus: health.status,
          lastHealthCheckAt: health.checkedAt,
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_INTEGRATION_ACTIVATED",
          entityType: "InsuranceIntegrationProvider",
          entityId: id,
          metadata: { environment: active.environment, health: health.status },
        },
        tx,
      );
      return active;
    });
    return this.safeProvider(updated);
  }

  async suspend(adminUserId: string, id: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const provider = await tx.insuranceIntegrationProvider.update({
        where: { id },
        data: { status: "SUSPENDED" },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_INTEGRATION_SUSPENDED",
          entityType: "InsuranceIntegrationProvider",
          entityId: id,
        },
        tx,
      );
      return provider;
    });
    return this.safeProvider(updated);
  }

  async health(id: string) {
    const provider = await this.prisma.insuranceIntegrationProvider.findUnique({
      where: { id },
    });
    if (!provider) throw new NotFoundException("Integration not found");
    const health = await this.adapters.get(provider.code).healthCheck();
    const status = health.status as InsuranceProviderHealthStatus;
    await this.prisma.insuranceIntegrationProvider.update({
      where: { id },
      data: { healthStatus: status, lastHealthCheckAt: health.checkedAt },
    });
    return {
      status,
      checkedAt: health.checkedAt,
      summary: health.summary,
      environment: provider.environment,
    };
  }

  async createMapping(
    adminUserId: string,
    integrationId: string,
    dto: CreateProductMappingDto,
  ) {
    const provider = await this.prisma.insuranceIntegrationProvider.findUnique({
      where: { id: integrationId },
      select: { organizationId: true },
    });
    if (!provider) throw new NotFoundException("Integration not found");
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id: dto.productId },
      select: { organizationId: true },
    });
    if (!product || product.organizationId !== provider.organizationId)
      throw new BadRequestException(
        "Product must belong to the integration organization",
      );
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveUntil = dto.effectiveUntil
      ? new Date(dto.effectiveUntil)
      : null;
    if (effectiveUntil && effectiveUntil <= effectiveFrom)
      throw new BadRequestException(
        "Mapping end date must be after start date",
      );
    return this.prisma.$transaction(async (tx) => {
      const mapping = await tx.insuranceProviderProductMapping.create({
        data: {
          integrationProviderId: integrationId,
          productId: dto.productId,
          productVersionId: dto.productVersionId,
          externalProductCode: dto.externalProductCode.trim(),
          externalPlanCode: dto.externalPlanCode?.trim(),
          externalVariantCode: dto.externalVariantCode?.trim(),
          effectiveFrom,
          effectiveUntil,
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "INSURANCE_PROVIDER_PRODUCT_MAPPING_CREATED",
          entityType: "InsuranceProviderProductMapping",
          entityId: mapping.id,
          metadata: {
            integrationId,
            productId: mapping.productId,
            productVersionId: mapping.productVersionId,
          },
        },
        tx,
      );
      return mapping;
    });
  }

  requests(integrationId: string) {
    return this.prisma.insuranceProviderRequest.findMany({
      where: { integrationProviderId: integrationId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  handoffs() {
    return this.prisma.insurancePurchaseHandoff.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        createdAt: true,
        redirectedAt: true,
        expiresAt: true,
        integrationProvider: { select: { name: true, environment: true } },
        product: { select: { code: true } },
      },
    });
  }
  events() {
    return this.prisma.insuranceProviderEvent.findMany({
      orderBy: { receivedAt: "desc" },
      take: 100,
      select: {
        id: true,
        externalEventId: true,
        eventType: true,
        status: true,
        mappedStatus: true,
        receivedAt: true,
        processedAt: true,
        integrationProvider: { select: { name: true } },
      },
    });
  }

  private assertActivatable(
    provider: Prisma.InsuranceIntegrationProviderGetPayload<{
      include: {
        organization: { include: { licences: true } };
        productMappings: true;
      };
    }>,
  ) {
    if (provider.organization.status !== InsuranceOrganizationStatus.ACTIVE)
      throw new BadRequestException("Integration organization must be active");
    const now = new Date();
    if (
      !provider.organization.licences.some(
        (licence) =>
          licence.status === "VALID" &&
          licence.validFrom <= now &&
          (!licence.validUntil || licence.validUntil >= now),
      )
    )
      throw new BadRequestException(
        "Integration organization requires a valid licence",
      );
    if (!provider.secretReference)
      throw new BadRequestException(
        "Integration requires a managed credential reference",
      );
    if (!provider.capabilities.includes("PURCHASE_HANDOFF"))
      throw new BadRequestException(
        "Integration does not declare purchase handoff support",
      );
    if (
      !provider.productMappings.some(
        (mapping) =>
          mapping.status === InsuranceProviderMappingStatus.ACTIVE &&
          mapping.effectiveFrom <= now &&
          (!mapping.effectiveUntil || mapping.effectiveUntil >= now),
      )
    )
      throw new BadRequestException(
        "Integration requires an active product mapping",
      );
    this.assertTrustedProviderUrl(provider.baseUrlReference);
    this.adapters.get(provider.code);
  }

  private assertTrustedProviderUrl(value: string): string {
    const url = trustedProviderUrl(value);
    const allowedHosts = this.env.values.INSURANCE_PROVIDER_ALLOWED_HOSTS;
    if (allowedHosts.length > 0 && !allowedHosts.includes(url.hostname)) {
      throw new BadRequestException(
        "Provider host is not on the approved allowlist",
      );
    }
    if (this.env.isProduction && allowedHosts.length === 0) {
      throw new BadRequestException(
        "Provider host allowlist is required in production",
      );
    }
    return url.toString();
  }

  private safeProvider(provider: {
    id: string;
    code: string;
    name: string;
    type: string;
    environment: string;
    status: string;
    authType: string;
    baseUrlReference: string;
    timeoutMs: number;
    retryPolicy: Prisma.JsonValue;
    capabilities: string[];
    healthStatus: string;
    lastHealthCheckAt: Date | null;
    organization?: { legalName: string; tradeName: string | null };
    secretReference?: string | null;
    credentialVersion?: string | null;
    lastRotatedAt?: Date | null;
    _count?: { productMappings: number };
  }) {
    return {
      id: provider.id,
      code: provider.code,
      name: provider.name,
      type: provider.type,
      environment: provider.environment,
      status: provider.status,
      authType: provider.authType,
      baseUrl: provider.baseUrlReference,
      timeoutMs: provider.timeoutMs,
      retryPolicy: provider.retryPolicy,
      capabilities: provider.capabilities,
      healthStatus: provider.healthStatus,
      lastHealthCheckAt: provider.lastHealthCheckAt,
      organization: provider.organization,
      credentialConfigured: Boolean(provider.secretReference),
      credentialVersion: provider.credentialVersion ?? null,
      lastRotatedAt: provider.lastRotatedAt ?? null,
      productMappingCount: provider._count?.productMappings,
    };
  }
}

function defaultRetryPolicy(maxRetries: number): Prisma.InputJsonObject {
  return {
    maxRetries,
    strategy: "bounded_exponential_backoff",
    retryable: ["TIMEOUT", "NETWORK", "RATE_LIMITED", "PROVIDER_UNAVAILABLE"],
  };
}
