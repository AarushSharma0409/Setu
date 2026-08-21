import { createHash, randomUUID } from "crypto";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceCapability,
  InsuranceLicenceStatus,
  InsuranceOrganizationStatus,
  InsuranceOrganizationType,
  InsurancePolicyTypeStatus,
  InsuranceProductStatus,
  InsuranceProductDocumentType,
  InsuranceProductVersionStatus,
} from "@prisma/client";

import {
  AddonDto,
  AvailabilityDto,
  CoverageDto,
  CreateProductDto,
  DeductibleDto,
  EligibilityRuleDto,
  ExclusionDto,
  PremiumBasisDto,
  ProductListDto,
  SumInsuredDto,
  UpdateProductVersionDto,
  WaitingPeriodDto,
} from "./dto/product.dto";
import {
  assertDeductible,
  assertEffectivePeriod,
  catalogueRequirements,
  periodsOverlap,
} from "./product-policy";
import { AuditService } from "../../audit/audit.service";
import { EnvService } from "../../common/env/env.service";
import { PrismaService } from "../../database/prisma.service";
import { ObjectStorageService } from "../../storage/object-storage.service";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";

type CatalogueInput = {
  coverages?: CoverageDto[];
  eligibilityRules?: EligibilityRuleDto[];
  sumInsuredOptions?: SumInsuredDto[];
  premiumBasis?: PremiumBasisDto;
  waitingPeriods?: WaitingPeriodDto[];
  exclusions?: ExclusionDto[];
  addons?: AddonDto[];
  deductibles?: DeductibleDto[];
  availability?: AvailabilityDto[];
};

@Injectable()
export class InsuranceProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: ObjectStorageService,
    private readonly capability: InsuranceCapabilityServiceImpl,
    private readonly env: EnvService,
  ) {}

  async list(query: ProductListDto) {
    const where = {
      organizationId: query.organizationId,
      policyTypeId: query.policyTypeId,
      status: query.status,
      OR: query.search
        ? [
            { code: { contains: query.search, mode: "insensitive" as const } },
            { slug: { contains: query.search, mode: "insensitive" as const } },
            {
              versions: {
                some: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ]
        : undefined,
      currentVersion: query.versionStatus
        ? { status: query.versionStatus }
        : undefined,
    };
    const orderBy =
      query.sort === "name"
        ? { currentVersion: { name: query.direction } }
        : { [query.sort]: query.direction };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceProduct.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy,
        include: {
          organization: { select: { id: true, legalName: true, slug: true } },
          policyType: { select: { id: true, code: true, name: true } },
          currentVersion: {
            select: {
              id: true,
              versionNumber: true,
              status: true,
              name: true,
              effectiveFrom: true,
              effectiveUntil: true,
            },
          },
          _count: { select: { versions: true, documents: true } },
        },
      }),
      this.prisma.insuranceProduct.count({ where }),
    ]);
    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async detail(productId: string) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id: productId },
      include: {
        organization: {
          select: { id: true, legalName: true, slug: true, status: true },
        },
        policyType: {
          include: {
            insuranceLine: {
              select: { id: true, code: true, name: true, status: true },
            },
          },
        },
        currentVersion: {
          include: {
            coverages: { orderBy: { sortOrder: "asc" } },
            eligibilityRules: { orderBy: { sortOrder: "asc" } },
            sumInsuredOptions: { orderBy: { sortOrder: "asc" } },
            premiumBasis: true,
            waitingPeriods: { orderBy: { sortOrder: "asc" } },
            exclusions: { orderBy: { sortOrder: "asc" } },
            addons: { orderBy: { sortOrder: "asc" } },
            deductibles: { orderBy: { sortOrder: "asc" } },
            availability: {
              include: { state: true, city: { include: { state: true } } },
            },
            documents: { orderBy: { createdAt: "desc" } },
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          select: {
            id: true,
            versionNumber: true,
            status: true,
            name: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectionReason: true,
            effectiveFrom: true,
            effectiveUntil: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        documents: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!product) throw new NotFoundException("Insurance product not found");
    return product;
  }

  async create(adminUserId: string, dto: CreateProductDto) {
    const eligibility = await this.assertAssociationEligibility(
      dto.organizationId,
      dto.policyTypeId,
    );
    const code = dto.code.toUpperCase();
    const slug = `${slugify(dto.name)}-${code.toLowerCase()}`;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.insuranceProduct.create({
          data: {
            organizationId: dto.organizationId,
            policyTypeId: dto.policyTypeId,
            code,
            slug,
            createdByAdminUserId: adminUserId,
          },
        });
        const version = await tx.insuranceProductVersion.create({
          data: {
            productId: product.id,
            versionNumber: 1,
            name: dto.name,
            shortDescription: dto.shortDescription,
            longDescription: dto.longDescription,
            createdByAdminUserId: adminUserId,
          },
        });
        const result = await tx.insuranceProduct.update({
          where: { id: product.id },
          data: { currentVersionId: version.id },
          include: { currentVersion: true },
        });
        await this.audit.record(
          {
            adminUserId,
            action: "insurance.product.created",
            entityType: "InsuranceProduct",
            entityId: product.id,
            metadata: {
              organizationId: dto.organizationId,
              policyTypeId: dto.policyTypeId,
              code,
              lineCode: eligibility.insuranceLine.code,
            },
          },
          tx,
        );
        return result;
      });
    } catch (error) {
      if (isKnownConstraint(error))
        throw new ConflictException(
          "Product code or slug already exists for this insurer",
        );
      throw error;
    }
  }

  async updateVersion(
    adminUserId: string,
    productId: string,
    versionId: string,
    dto: UpdateProductVersionDto,
  ) {
    await this.assertDraftVersion(productId, versionId);
    const dates = {
      effectiveFrom: dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : undefined,
      effectiveUntil: dto.effectiveUntil
        ? new Date(dto.effectiveUntil)
        : undefined,
    };
    if (dates.effectiveFrom && dates.effectiveUntil)
      assertEffectivePeriod(dates.effectiveFrom, dates.effectiveUntil);
    const version = await this.prisma.insuranceProductVersion.update({
      where: { id: versionId },
      data: { ...dto, ...dates },
      include: { product: true },
    });
    await this.audit.record({
      adminUserId,
      action: "insurance.product.version.updated",
      entityType: "InsuranceProductVersion",
      entityId: versionId,
      metadata: { productId },
    });
    return version;
  }

  async createVersion(adminUserId: string, productId: string) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id: productId },
      include: {
        currentVersion: true,
        versions: { select: { versionNumber: true } },
      },
    });
    if (!product?.currentVersion)
      throw new NotFoundException(
        "Insurance product or current version not found",
      );
    const currentVersion = product.currentVersion;
    if (currentVersion.status !== InsuranceProductVersionStatus.APPROVED)
      throw new BadRequestException(
        "A new version can be created only from an approved product version",
      );
    const next =
      Math.max(...product.versions.map((version) => version.versionNumber)) + 1;
    const created = await this.prisma.$transaction(async (tx) => {
      const version = await tx.insuranceProductVersion.create({
        data: {
          productId,
          versionNumber: next,
          name: currentVersion.name,
          shortDescription: currentVersion.shortDescription,
          longDescription: currentVersion.longDescription,
          coverageSummary: currentVersion.coverageSummary,
          availabilityScope: currentVersion.availabilityScope,
          createdByAdminUserId: adminUserId,
        },
      });
      await tx.insuranceProduct.update({
        where: { id: productId },
        data: {
          currentVersionId: version.id,
          status: InsuranceProductStatus.DRAFT,
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "insurance.product.version.created",
          entityType: "InsuranceProductVersion",
          entityId: version.id,
          metadata: {
            productId,
            versionNumber: next,
            sourceVersionId: currentVersion.id,
          },
        },
        tx,
      );
      return version;
    });
    return created;
  }

  async replaceCatalogue(
    adminUserId: string,
    productId: string,
    versionId: string,
    input: CatalogueInput,
  ) {
    const version = await this.assertDraftVersion(productId, versionId);
    if (input.availability) await this.assertAvailability(input.availability);
    for (const deductible of input.deductibles ?? [])
      assertDeductible(deductible);
    if (
      input.sumInsuredOptions?.filter((option) => option.isDefault).length &&
      input.sumInsuredOptions.filter((option) => option.isDefault).length > 1
    )
      throw new BadRequestException(
        "Only one sum-insured option can be the default",
      );
    await this.prisma.$transaction(async (tx) => {
      if (input.coverages) {
        await tx.insuranceProductCoverage.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductCoverage.createMany({
          data: input.coverages.map((item) => ({
            ...item,
            productVersionId: versionId,
          })),
        });
      }
      if (input.eligibilityRules) {
        await tx.insuranceProductEligibilityRule.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductEligibilityRule.createMany({
          data: input.eligibilityRules.map((item) => ({
            ...item,
            productVersionId: versionId,
          })),
        });
      }
      if (input.sumInsuredOptions) {
        await tx.insuranceProductSumInsuredOption.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductSumInsuredOption.createMany({
          data: input.sumInsuredOptions.map((item) => ({
            ...item,
            productVersionId: versionId,
            currency: item.currency.toUpperCase(),
          })),
        });
      }
      if (input.premiumBasis)
        await tx.insuranceProductPremiumBasis.upsert({
          where: { productVersionId: versionId },
          create: { ...input.premiumBasis, productVersionId: versionId },
          update: input.premiumBasis,
        });
      if (input.waitingPeriods) {
        await tx.insuranceProductWaitingPeriod.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductWaitingPeriod.createMany({
          data: input.waitingPeriods.map((item) => ({
            ...item,
            productVersionId: versionId,
          })),
        });
      }
      if (input.exclusions) {
        await tx.insuranceProductExclusion.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductExclusion.createMany({
          data: input.exclusions.map((item) => ({
            ...item,
            productVersionId: versionId,
          })),
        });
      }
      if (input.addons) {
        await tx.insuranceProductAddon.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductAddon.createMany({
          data: input.addons.map((item) => ({
            ...item,
            productVersionId: versionId,
          })),
        });
      }
      if (input.deductibles) {
        await tx.insuranceProductDeductible.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductDeductible.createMany({
          data: input.deductibles.map((item) => ({
            ...item,
            productVersionId: versionId,
            currency: item.currency?.toUpperCase(),
          })),
        });
      }
      if (input.availability) {
        await tx.insuranceProductAvailability.deleteMany({
          where: { productVersionId: versionId },
        });
        await tx.insuranceProductAvailability.createMany({
          data: input.availability.map((item) => ({
            ...item,
            productVersionId: versionId,
          })),
        });
      }
      await this.audit.record(
        {
          adminUserId,
          action: "insurance.product.catalogue.updated",
          entityType: "InsuranceProductVersion",
          entityId: versionId,
          metadata: { productId, configuredSections: Object.keys(input) },
        },
        tx,
      );
    });
    return this.detail(version.productId);
  }

  async submit(adminUserId: string, productId: string, versionId: string) {
    const version = await this.assertDraftVersion(productId, versionId);
    await this.capability.assertEnabled(
      InsuranceCapability.DISPLAY_INSURANCE_PRODUCTS,
    );
    await this.assertComplete(version);
    await this.prisma.$transaction(async (tx) => {
      await tx.insuranceProductVersion.update({
        where: { id: versionId },
        data: {
          status: InsuranceProductVersionStatus.PENDING_REVIEW,
          submittedAt: new Date(),
          rejectionReason: null,
          rejectedAt: null,
        },
      });
      await tx.insuranceProduct.update({
        where: { id: productId },
        data: { status: InsuranceProductStatus.PENDING_REVIEW },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "insurance.product.version.submitted",
          entityType: "InsuranceProductVersion",
          entityId: versionId,
          metadata: { productId },
        },
        tx,
      );
    });
    return this.detail(productId);
  }

  async approve(adminUserId: string, productId: string, versionId: string) {
    const version = await this.prisma.insuranceProductVersion.findFirst({
      where: { id: versionId, productId },
      include: {
        product: {
          include: {
            policyType: { include: { insuranceLine: true } },
            organization: { include: { licences: true } },
          },
        },
        documents: true,
        coverages: true,
        eligibilityRules: true,
        sumInsuredOptions: true,
        premiumBasis: true,
        waitingPeriods: true,
        exclusions: true,
        availability: true,
      },
    });
    if (!version)
      throw new NotFoundException("Insurance product version not found");
    if (version.status !== InsuranceProductVersionStatus.PENDING_REVIEW)
      throw new BadRequestException("Only a submitted version can be approved");
    await this.capability.assertEnabled(
      InsuranceCapability.DISPLAY_INSURANCE_PRODUCTS,
    );
    await this.assertComplete(version);
    const overlap = await this.prisma.insuranceProductVersion.findMany({
      where: {
        productId,
        status: InsuranceProductVersionStatus.APPROVED,
        id: { not: versionId },
      },
      select: { effectiveFrom: true, effectiveUntil: true },
    });
    assertEffectivePeriod(version.effectiveFrom, version.effectiveUntil);
    if (
      overlap.some(
        (existing) =>
          existing.effectiveFrom &&
          periodsOverlap(
            version.effectiveFrom as Date,
            version.effectiveUntil,
            existing.effectiveFrom,
            existing.effectiveUntil,
          ),
      )
    )
      throw new ConflictException(
        "Approved product versions cannot have overlapping effective periods",
      );
    await this.prisma.$transaction(async (tx) => {
      await tx.insuranceProductVersion.update({
        where: { id: versionId },
        data: {
          status: InsuranceProductVersionStatus.APPROVED,
          approvedAt: new Date(),
          approvedByAdminUserId: adminUserId,
        },
      });
      await tx.insuranceProduct.update({
        where: { id: productId },
        data: {
          status: InsuranceProductStatus.ACTIVE,
          currentVersionId: versionId,
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "insurance.product.version.approved",
          entityType: "InsuranceProductVersion",
          entityId: versionId,
          metadata: { productId },
        },
        tx,
      );
    });
    return this.detail(productId);
  }

  async reject(
    adminUserId: string,
    productId: string,
    versionId: string,
    reason: string,
  ) {
    const version = await this.prisma.insuranceProductVersion.findFirst({
      where: { id: versionId, productId },
    });
    if (!version)
      throw new NotFoundException("Insurance product version not found");
    if (version.status !== InsuranceProductVersionStatus.PENDING_REVIEW)
      throw new BadRequestException("Only a submitted version can be rejected");
    await this.prisma.$transaction(async (tx) => {
      await tx.insuranceProductVersion.update({
        where: { id: versionId },
        data: {
          status: InsuranceProductVersionStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });
      await tx.insuranceProduct.update({
        where: { id: productId },
        data: { status: InsuranceProductStatus.REJECTED },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "insurance.product.version.rejected",
          entityType: "InsuranceProductVersion",
          entityId: versionId,
          metadata: { productId, reason },
        },
        tx,
      );
    });
    return this.detail(productId);
  }

  async withdraw(adminUserId: string, productId: string, reason: string) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Insurance product not found");
    if (product.status !== InsuranceProductStatus.ACTIVE)
      throw new BadRequestException("Only active products can be withdrawn");
    await this.prisma.$transaction(async (tx) => {
      await tx.insuranceProduct.update({
        where: { id: productId },
        data: {
          status: InsuranceProductStatus.WITHDRAWN,
          withdrawnAt: new Date(),
          withdrawalReason: reason,
        },
      });
      await this.audit.record(
        {
          adminUserId,
          action: "insurance.product.withdrawn",
          entityType: "InsuranceProduct",
          entityId: productId,
          metadata: { reason },
        },
        tx,
      );
    });
    return this.detail(productId);
  }

  async documentAccess(productId: string, documentId: string) {
    const document = await this.prisma.insuranceProductDocument.findFirst({
      where: { id: documentId, productId },
    });
    if (!document)
      throw new NotFoundException("Insurance product document not found");
    return {
      url: await this.storage.getSignedReadUrl({
        key: document.storageKey,
        expiresInSeconds: 120,
      }),
      expiresInSeconds: 120,
      fileName: document.originalFileName,
      mimeType: document.mimeType,
    };
  }

  async uploadDocument(
    adminUserId: string,
    productId: string,
    versionId: string,
    input: {
      type: InsuranceProductDocumentType;
      title: string;
      effectiveFrom?: string;
      effectiveUntil?: string;
    },
    file:
      | { buffer: Buffer; originalname: string; mimetype: string; size: number }
      | undefined,
  ) {
    await this.assertDraftVersion(productId, versionId);
    if (!file || !file.buffer.length)
      throw new BadRequestException("A product document file is required");
    if (file.size > this.env.values.INSURANCE_DOCUMENT_MAX_FILE_SIZE_BYTES)
      throw new BadRequestException(
        "Product document exceeds the permitted file size",
      );
    if (
      !this.env.values.INSURANCE_DOCUMENT_ALLOWED_MIME_TYPES.includes(
        file.mimetype,
      )
    )
      throw new BadRequestException(
        "Product document file type is not permitted",
      );
    const dates = {
      effectiveFrom: input.effectiveFrom
        ? new Date(input.effectiveFrom)
        : undefined,
      effectiveUntil: input.effectiveUntil
        ? new Date(input.effectiveUntil)
        : undefined,
    };
    if (dates.effectiveFrom && dates.effectiveUntil)
      assertEffectivePeriod(dates.effectiveFrom, dates.effectiveUntil);
    const storageKey = `insurance/products/${productId}/${versionId}/${randomUUID()}`;
    await this.storage.putObject({
      buffer: file.buffer,
      key: storageKey,
      mimeType: file.mimetype,
    });
    try {
      const document = await this.prisma.insuranceProductDocument.create({
        data: {
          productId,
          productVersionId: versionId,
          type: input.type,
          title: input.title,
          storageKey,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          checksumSha256: createHash("sha256")
            .update(file.buffer)
            .digest("hex"),
          ...dates,
          uploadedByAdminUserId: adminUserId,
        },
      });
      await this.audit.record({
        adminUserId,
        action: "insurance.product.document.uploaded",
        entityType: "InsuranceProductDocument",
        entityId: document.id,
        metadata: {
          productId,
          versionId,
          type: input.type,
          sizeBytes: file.size,
        },
      });
      return document;
    } catch (error) {
      await this.storage.deleteObject(storageKey);
      throw error;
    }
  }

  private async assertDraftVersion(productId: string, versionId: string) {
    const version = await this.prisma.insuranceProductVersion.findFirst({
      where: { id: versionId, productId },
      include: {
        product: {
          include: {
            organization: { include: { licences: true } },
            policyType: { include: { insuranceLine: true } },
          },
        },
        coverages: true,
        eligibilityRules: true,
        sumInsuredOptions: true,
        premiumBasis: true,
        waitingPeriods: true,
        exclusions: true,
        addons: true,
        deductibles: true,
        availability: true,
        documents: true,
      },
    });
    if (!version)
      throw new NotFoundException("Insurance product version not found");
    if (
      version.status !== InsuranceProductVersionStatus.DRAFT &&
      version.status !== InsuranceProductVersionStatus.REJECTED
    )
      throw new ForbiddenException(
        "Approved or submitted product versions are immutable",
      );
    return version;
  }

  private async assertAssociationEligibility(
    organizationId: string,
    policyTypeId: string,
  ) {
    const policyType = await this.prisma.insurancePolicyType.findUnique({
      where: { id: policyTypeId },
      include: { insuranceLine: true },
    });
    const organization = await this.prisma.insuranceOrganization.findUnique({
      where: { id: organizationId },
      include: { licences: true, insuranceLines: true },
    });
    if (
      !policyType ||
      policyType.status !== InsurancePolicyTypeStatus.ACTIVE ||
      policyType.insuranceLine.status !== "ACTIVE"
    )
      throw new BadRequestException(
        "The selected policy type and insurance line must be active",
      );
    if (
      !organization ||
      organization.type !== InsuranceOrganizationType.INSURER ||
      organization.status !== InsuranceOrganizationStatus.ACTIVE
    )
      throw new BadRequestException(
        "The selected organization is not an active insurer",
      );
    const now = new Date();
    const licensed = organization.licences.some(
      (licence) =>
        licence.status === InsuranceLicenceStatus.VALID &&
        licence.validFrom <= now &&
        (!licence.validUntil || licence.validUntil >= now) &&
        licence.permittedLineCodes.includes(policyType.insuranceLine.code),
    );
    const mapped = organization.insuranceLines.some(
      (line) => line.insuranceLineId === policyType.insuranceLineId,
    );
    if (!licensed || !mapped)
      throw new BadRequestException(
        "The insurer does not hold a valid licence for the selected insurance line",
      );
    return policyType;
  }

  private async assertAvailability(items: AvailabilityDto[]) {
    for (const item of items) {
      if (!item.stateId && !item.cityId)
        throw new BadRequestException(
          "Availability must select a state or city",
        );
      if (item.cityId) {
        const city = await this.prisma.city.findUnique({
          where: { id: item.cityId },
          select: { isActive: true, stateId: true },
        });
        if (!city?.isActive || (item.stateId && item.stateId !== city.stateId))
          throw new BadRequestException(
            "Availability city must be active and belong to the selected state",
          );
      }
      if (item.stateId) {
        const state = await this.prisma.state.findUnique({
          where: { id: item.stateId },
          select: { isActive: true },
        });
        if (!state?.isActive)
          throw new BadRequestException("Availability state must be active");
      }
    }
  }

  private async assertComplete(version: {
    product: {
      organizationId: string;
      policyTypeId: string;
      policyType: { code: string };
    };
    name: string;
    shortDescription: string;
    coverageSummary: string | null;
    availabilityScope: string;
    effectiveFrom: Date | null;
    effectiveUntil: Date | null;
    coverages: unknown[];
    eligibilityRules: unknown[];
    sumInsuredOptions: unknown[];
    premiumBasis: unknown;
    waitingPeriods: unknown[];
    exclusions: unknown[];
    availability: unknown[];
    documents: Array<{ status: string }>;
  }): Promise<void> {
    const source = version;
    await this.assertAssociationEligibility(
      source.product.organizationId,
      source.product.policyTypeId,
    );
    assertEffectivePeriod(source.effectiveFrom, source.effectiveUntil);
    const requirements = catalogueRequirements(source.product.policyType.code);
    const missing: string[] = [];
    if (!source.name || !source.shortDescription || !source.coverageSummary)
      missing.push("product descriptions and coverage summary");
    if (!source.coverages.length) missing.push("coverage configuration");
    if (requirements.requiresEligibility && !source.eligibilityRules.length)
      missing.push("eligibility configuration");
    if (requirements.requiresSumInsured && !source.sumInsuredOptions.length)
      missing.push("sum-insured options");
    if (!source.premiumBasis) missing.push("premium-basis metadata");
    if (requirements.requiresWaitingPeriods && !source.waitingPeriods.length)
      missing.push("waiting periods");
    if (!source.exclusions.length) missing.push("exclusions");
    if (!source.availability.length && source.availabilityScope !== "PAN_INDIA")
      missing.push("geographic availability");
    if (
      requirements.requiresDocuments &&
      !source.documents.some((document) => document.status !== "REJECTED")
    )
      missing.push("product documents");
    if (missing.length)
      throw new BadRequestException({
        message: "Product version is incomplete",
        missingRequirements: missing,
      });
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isKnownConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
