import { createHash, randomUUID } from "node:crypto";
import { extname } from "node:path";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceDocumentStatus,
  InsuranceDocumentType,
  InsuranceLicenceStatus,
  InsuranceOperatingModelStatus,
  InsuranceOrganizationStatus,
  InsurancePolicyTypeStatus,
  InsuranceTemplateStatus,
  Prisma,
} from "@prisma/client";

import {
  CreateConsentTemplateDto,
  CreateDisclosureDto,
  CreateLicenceDto,
  CreateOperatingModelDto,
  CreateOrganizationDto,
  CreatePolicyTypeDto,
  DecisionDto,
  OrganizationListDto,
  UpdateConsentTemplateDto,
  UpdateDisclosureDto,
  UpdateLicenceDto,
  UpdateOperatingModelDto,
  UpdateOrganizationDto,
  UpdatePolicyTypeDto,
} from "./dto/insurance.dto";
import { AuditService } from "../audit/audit.service";
import { EnvService } from "../common/env/env.service";
import { PrismaService } from "../database/prisma.service";
import { DocumentScannerService } from "../storage/document-scanner.service";
import { ObjectStorageService } from "../storage/object-storage.service";

export interface UploadedInsuranceDocument {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const organizationInclude = {
  insuranceLines: { include: { insuranceLine: true } },
  licences: { orderBy: [{ validUntil: "asc" }, { createdAt: "desc" }] },
  documents: {
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      licenceId: true,
      type: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      uploadedAt: true,
      reviewedAt: true,
      rejectionReason: true,
    },
  },
  users: {
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.InsuranceOrganizationInclude;

@Injectable()
export class InsuranceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly audit: AuditService,
    private readonly objectStorage: ObjectStorageService,
    private readonly scanner: DocumentScannerService,
  ) {}

  async dashboard() {
    const warningDate = new Date();
    warningDate.setDate(
      warningDate.getDate() +
        this.env.values.INSURANCE_LICENCE_EXPIRY_WARNING_DAYS,
    );
    const [
      activeModel,
      pending,
      activeInsurers,
      activeIntermediaries,
      expiring,
      policyTypes,
      disclosures,
      consents,
    ] = await this.prisma.$transaction([
      this.prisma.insuranceOperatingModel.count({
        where: { status: InsuranceOperatingModelStatus.ACTIVE },
      }),
      this.prisma.insuranceOrganization.count({
        where: { status: InsuranceOrganizationStatus.PENDING_VERIFICATION },
      }),
      this.prisma.insuranceOrganization.count({
        where: { status: InsuranceOrganizationStatus.ACTIVE, type: "INSURER" },
      }),
      this.prisma.insuranceOrganization.count({
        where: {
          status: InsuranceOrganizationStatus.ACTIVE,
          type: { not: "INSURER" },
        },
      }),
      this.prisma.insuranceOrganizationLicence.count({
        where: {
          status: InsuranceLicenceStatus.VALID,
          validUntil: { gte: new Date(), lte: warningDate },
        },
      }),
      this.prisma.insurancePolicyType.count({
        where: { status: InsurancePolicyTypeStatus.ACTIVE },
      }),
      this.prisma.insuranceDisclosureTemplate.count({
        where: { status: InsuranceTemplateStatus.PUBLISHED },
      }),
      this.prisma.insuranceConsentTemplate.count({
        where: { status: InsuranceTemplateStatus.PUBLISHED },
      }),
    ]);
    return {
      activeOperatingModel: activeModel,
      organizationsPendingVerification: pending,
      activeInsurers,
      activeIntermediaries,
      licencesExpiringSoon: expiring,
      activePolicyTypes: policyTypes,
      publishedDisclosures: disclosures,
      publishedConsentTemplates: consents,
    };
  }

  async listOperatingModels() {
    const items = await this.prisma.insuranceOperatingModel.findMany({
      orderBy: [{ createdAt: "desc" }, { configurationVersion: "desc" }],
    });
    return { items };
  }

  async createOperatingModel(
    adminUserId: string,
    dto: CreateOperatingModelDto,
  ) {
    this.assertDateRange(dto.licenceValidFrom, dto.licenceValidUntil);
    this.assertNoCapabilityConflict(dto);
    const latest = await this.prisma.insuranceOperatingModel.aggregate({
      where: {
        legalEntityName: dto.legalEntityName,
        primaryJurisdiction: dto.primaryJurisdiction,
      },
      _max: { configurationVersion: true },
    });
    const model = await this.prisma.insuranceOperatingModel.create({
      data: {
        ...operatingModelData(dto),
        configurationVersion: (latest._max.configurationVersion ?? 0) + 1,
        createdByAdminUserId: adminUserId,
      },
    });
    await this.record(
      adminUserId,
      "INSURANCE_OPERATING_MODEL_CREATED",
      "InsuranceOperatingModel",
      model.id,
      {
        configurationVersion: model.configurationVersion,
        status: model.status,
      },
    );
    return model;
  }

  async updateOperatingModel(
    adminUserId: string,
    id: string,
    dto: UpdateOperatingModelDto,
  ) {
    this.assertDateRange(dto.licenceValidFrom, dto.licenceValidUntil);
    this.assertNoCapabilityConflict(dto);
    const current = await this.findOperatingModel(id);
    if (current.status !== InsuranceOperatingModelStatus.DRAFT) {
      throw new ConflictException("Only draft operating models can be edited");
    }
    const model = await this.prisma.insuranceOperatingModel.update({
      where: { id },
      data: operatingModelData(dto),
    });
    await this.record(
      adminUserId,
      "INSURANCE_OPERATING_MODEL_UPDATED",
      "InsuranceOperatingModel",
      id,
      {
        configurationVersion: model.configurationVersion,
      },
    );
    return model;
  }

  async activateOperatingModel(adminUserId: string, id: string) {
    const now = new Date();
    const model = await this.prisma.$transaction(async (tx) => {
      const draft = await tx.insuranceOperatingModel.findUnique({
        where: { id },
      });
      if (!draft) throw new NotFoundException("Operating model not found");
      if (draft.status !== InsuranceOperatingModelStatus.DRAFT) {
        throw new ConflictException(
          "Only a draft operating model can be activated",
        );
      }
      if (draft.licenceValidUntil && draft.licenceValidUntil < now) {
        throw new ConflictException(
          "An expired operating-model licence cannot be activated",
        );
      }
      await tx.insuranceOperatingModel.updateMany({
        where: {
          legalEntityName: draft.legalEntityName,
          primaryJurisdiction: draft.primaryJurisdiction,
          status: InsuranceOperatingModelStatus.ACTIVE,
        },
        data: {
          status: InsuranceOperatingModelStatus.ARCHIVED,
          effectiveUntil: now,
        },
      });
      const active = await tx.insuranceOperatingModel.update({
        where: { id },
        data: {
          status: InsuranceOperatingModelStatus.ACTIVE,
          effectiveFrom: now,
          effectiveUntil: null,
        },
      });
      await this.record(
        adminUserId,
        "INSURANCE_OPERATING_MODEL_ACTIVATED",
        "InsuranceOperatingModel",
        id,
        {
          configurationVersion: active.configurationVersion,
        },
        tx,
      );
      return active;
    });
    return model;
  }

  async retireOperatingModel(adminUserId: string, id: string) {
    const current = await this.findOperatingModel(id);
    if (current.status !== InsuranceOperatingModelStatus.ACTIVE) {
      throw new ConflictException(
        "Only an active operating model can be retired",
      );
    }
    const model = await this.prisma.insuranceOperatingModel.update({
      where: { id },
      data: {
        status: InsuranceOperatingModelStatus.ARCHIVED,
        effectiveUntil: new Date(),
      },
    });
    await this.record(
      adminUserId,
      "INSURANCE_OPERATING_MODEL_RETIRED",
      "InsuranceOperatingModel",
      id,
    );
    return model;
  }

  async listOrganizations(query: OrganizationListDto) {
    const expiry = new Date();
    expiry.setDate(
      expiry.getDate() + this.env.values.INSURANCE_LICENCE_EXPIRY_WARNING_DAYS,
    );
    const where: Prisma.InsuranceOrganizationWhereInput = {
      type: query.type,
      status: query.status as InsuranceOrganizationStatus | undefined,
      insuranceLines: query.insuranceLineId
        ? { some: { insuranceLineId: query.insuranceLineId } }
        : undefined,
      licences: query.expiringSoon
        ? { some: { validUntil: { gte: new Date(), lte: expiry } } }
        : undefined,
      OR: query.search
        ? [
            { legalName: { contains: query.search, mode: "insensitive" } },
            { tradeName: { contains: query.search, mode: "insensitive" } },
            {
              registrationNumber: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          ]
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceOrganization.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          insuranceLines: { include: { insuranceLine: true } },
          licences: true,
        },
      }),
      this.prisma.insuranceOrganization.count({ where }),
    ]);
    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async createOrganization(adminUserId: string, dto: CreateOrganizationDto) {
    this.assertDateRange(dto.registrationValidFrom, dto.registrationValidUntil);
    await this.assertLinesExist(dto.insuranceLineIds);
    const organization = await this.prisma.insuranceOrganization.create({
      data: {
        ...organizationData(dto),
        slug: await this.uniqueOrganizationSlug(dto.legalName),
        insuranceLines: {
          create: dto.insuranceLineIds.map((insuranceLineId) => ({
            insuranceLineId,
          })),
        },
      },
      include: organizationInclude,
    });
    await this.record(
      adminUserId,
      "INSURANCE_ORGANIZATION_CREATED",
      "InsuranceOrganization",
      organization.id,
      {
        type: organization.type,
      },
    );
    return this.toOrganizationDetail(organization);
  }

  async organizationDetail(adminUserId: string, organizationId: string) {
    const organization = await this.prisma.insuranceOrganization.findUnique({
      where: { id: organizationId },
      include: organizationInclude,
    });
    if (!organization)
      throw new NotFoundException("Insurance organization not found");
    await this.record(
      adminUserId,
      "INSURANCE_ORGANIZATION_VIEWED",
      "InsuranceOrganization",
      organizationId,
    );
    return this.toOrganizationDetail(organization);
  }

  async updateOrganization(
    adminUserId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ) {
    this.assertDateRange(dto.registrationValidFrom, dto.registrationValidUntil);
    const organization = await this.findOrganization(organizationId);
    if (organization.status !== InsuranceOrganizationStatus.DRAFT) {
      throw new ConflictException("Only draft organizations can be edited");
    }
    await this.assertLinesExist(dto.insuranceLineIds);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.insuranceOrganizationLine.deleteMany({
        where: { organizationId },
      });
      return tx.insuranceOrganization.update({
        where: { id: organizationId },
        data: {
          ...organizationData(dto),
          insuranceLines: {
            create: dto.insuranceLineIds.map((insuranceLineId) => ({
              insuranceLineId,
            })),
          },
        },
        include: organizationInclude,
      });
    });
    await this.record(
      adminUserId,
      "INSURANCE_ORGANIZATION_UPDATED",
      "InsuranceOrganization",
      organizationId,
    );
    return this.toOrganizationDetail(updated);
  }

  async submitOrganization(adminUserId: string, organizationId: string) {
    const updated = await this.transitionOrganization(
      adminUserId,
      organizationId,
      InsuranceOrganizationStatus.DRAFT,
      InsuranceOrganizationStatus.PENDING_VERIFICATION,
      "INSURANCE_ORGANIZATION_SUBMITTED",
    );
    return this.toOrganizationDetail(updated);
  }

  async approveOrganization(adminUserId: string, organizationId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.insuranceOrganization.findUnique({
        where: { id: organizationId },
        include: organizationInclude,
      });
      if (!organization)
        throw new NotFoundException("Insurance organization not found");
      if (
        organization.status !== InsuranceOrganizationStatus.PENDING_VERIFICATION
      ) {
        throw new ConflictException(
          "Organization status changed; refresh and try again",
        );
      }
      await this.assertActivationRequirements(organization, tx);
      const changed = await tx.insuranceOrganization.updateMany({
        where: {
          id: organizationId,
          status: InsuranceOrganizationStatus.PENDING_VERIFICATION,
        },
        data: {
          status: InsuranceOrganizationStatus.ACTIVE,
          reviewedAt: new Date(),
          reviewedByAdminUserId: adminUserId,
          rejectionReason: null,
          suspensionReason: null,
        },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          "Organization status changed; refresh and try again",
        );
      await this.record(
        adminUserId,
        "INSURANCE_ORGANIZATION_APPROVED",
        "InsuranceOrganization",
        organizationId,
        undefined,
        tx,
      );
      return tx.insuranceOrganization.findUniqueOrThrow({
        where: { id: organizationId },
        include: organizationInclude,
      });
    });
    return this.toOrganizationDetail(updated);
  }

  async rejectOrganization(
    adminUserId: string,
    organizationId: string,
    dto: DecisionDto,
  ) {
    if (!dto.reason)
      throw new BadRequestException("A rejection reason is required");
    const updated = await this.transitionOrganization(
      adminUserId,
      organizationId,
      InsuranceOrganizationStatus.PENDING_VERIFICATION,
      InsuranceOrganizationStatus.REJECTED,
      "INSURANCE_ORGANIZATION_REJECTED",
      dto.reason,
    );
    return this.toOrganizationDetail(updated);
  }

  async suspendOrganization(
    adminUserId: string,
    organizationId: string,
    dto: DecisionDto,
  ) {
    if (!dto.reason)
      throw new BadRequestException("A suspension reason is required");
    const updated = await this.transitionOrganization(
      adminUserId,
      organizationId,
      InsuranceOrganizationStatus.ACTIVE,
      InsuranceOrganizationStatus.SUSPENDED,
      "INSURANCE_ORGANIZATION_SUSPENDED",
      dto.reason,
    );
    return this.toOrganizationDetail(updated);
  }

  async reactivateOrganization(adminUserId: string, organizationId: string) {
    const updated = await this.transitionOrganization(
      adminUserId,
      organizationId,
      InsuranceOrganizationStatus.SUSPENDED,
      InsuranceOrganizationStatus.ACTIVE,
      "INSURANCE_ORGANIZATION_REACTIVATED",
    );
    return this.toOrganizationDetail(updated);
  }

  async listLicences(organizationId: string) {
    await this.findOrganization(organizationId);
    return {
      items: await this.prisma.insuranceOrganizationLicence.findMany({
        where: { organizationId },
        orderBy: [{ validUntil: "asc" }, { createdAt: "desc" }],
      }),
    };
  }

  async createLicence(
    adminUserId: string,
    organizationId: string,
    dto: CreateLicenceDto,
  ) {
    this.assertDateRange(dto.validFrom, dto.validUntil);
    await this.findOrganization(organizationId);
    const licence = await this.prisma.insuranceOrganizationLicence.create({
      data: {
        organizationId,
        ...licenceData(dto),
        status: licenceStatus(dto.validUntil),
      },
    });
    await this.record(
      adminUserId,
      "INSURANCE_LICENCE_ADDED",
      "InsuranceOrganizationLicence",
      licence.id,
      { organizationId },
    );
    return licence;
  }

  async updateLicence(
    adminUserId: string,
    organizationId: string,
    licenceId: string,
    dto: UpdateLicenceDto,
  ) {
    this.assertDateRange(dto.validFrom, dto.validUntil);
    const licence = await this.prisma.insuranceOrganizationLicence.findFirst({
      where: { id: licenceId, organizationId },
    });
    if (!licence) throw new NotFoundException("Insurance licence not found");
    if (licence.status === InsuranceLicenceStatus.REVOKED)
      throw new ConflictException("Revoked licences are immutable");
    const updated = await this.prisma.insuranceOrganizationLicence.update({
      where: { id: licenceId },
      data: { ...licenceData(dto), status: licenceStatus(dto.validUntil) },
    });
    await this.record(
      adminUserId,
      "INSURANCE_LICENCE_UPDATED",
      "InsuranceOrganizationLicence",
      licenceId,
      { organizationId },
    );
    return updated;
  }

  async listDocuments(organizationId: string) {
    await this.findOrganization(organizationId);
    return {
      items: await this.prisma.insuranceOrganizationDocument.findMany({
        where: { organizationId },
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          licenceId: true,
          type: true,
          originalFileName: true,
          mimeType: true,
          sizeBytes: true,
          status: true,
          uploadedAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      }),
    };
  }

  async uploadDocument(
    adminUserId: string,
    organizationId: string,
    type: InsuranceDocumentType,
    licenceId: string | undefined,
    file: UploadedInsuranceDocument | undefined,
  ) {
    await this.findOrganization(organizationId);
    if (!file) throw new BadRequestException("Document file is required");
    if (licenceId) {
      const licence = await this.prisma.insuranceOrganizationLicence.findFirst({
        where: { id: licenceId, organizationId },
        select: { id: true },
      });
      if (!licence)
        throw new BadRequestException(
          "Licence does not belong to this organization",
        );
    }
    this.validateDocumentFile(file);
    const storageKey = `insurance/organizations/${organizationId}/documents/${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    const scan = await this.scanner.scan({
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
    try {
      await this.objectStorage.putObject({
        buffer: file.buffer,
        key: storageKey,
        mimeType: file.mimetype,
      });
      const document = await this.prisma.insuranceOrganizationDocument.create({
        data: {
          organizationId,
          licenceId,
          type,
          storageKey,
          originalFileName: safeFileName(file.originalname),
          mimeType: file.mimetype,
          sizeBytes: file.size,
          checksumSha256: createHash("sha256")
            .update(file.buffer)
            .digest("hex"),
          status: InsuranceDocumentStatus.PENDING_REVIEW,
          uploadedByAdminUserId: adminUserId,
          metadata: { malwareScan: scan.status },
        },
      });
      await this.record(
        adminUserId,
        "INSURANCE_DOCUMENT_UPLOADED",
        "InsuranceOrganizationDocument",
        document.id,
        { organizationId, type },
      );
      return this.documentSummary(document);
    } catch (error) {
      await this.objectStorage.deleteObject(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async documentAccess(
    adminUserId: string,
    organizationId: string,
    documentId: string,
  ) {
    const document = await this.prisma.insuranceOrganizationDocument.findFirst({
      where: { id: documentId, organizationId },
    });
    if (!document) throw new NotFoundException("Insurance document not found");
    const url = await this.objectStorage.getSignedReadUrl({
      key: document.storageKey,
      expiresInSeconds: this.env.values.INSURANCE_SIGNED_URL_TTL_SECONDS,
    });
    await this.record(
      adminUserId,
      "INSURANCE_DOCUMENT_VIEWED",
      "InsuranceOrganizationDocument",
      documentId,
      { organizationId, mimeType: document.mimeType },
    );
    return {
      url,
      expiresInSeconds: this.env.values.INSURANCE_SIGNED_URL_TTL_SECONDS,
      fileName: document.originalFileName,
      mimeType: document.mimeType,
    };
  }

  async reviewDocument(
    adminUserId: string,
    organizationId: string,
    documentId: string,
    approve: boolean,
    dto: DecisionDto,
  ) {
    if (!approve && !dto.reason)
      throw new BadRequestException("A rejection reason is required");
    const document = await this.prisma.insuranceOrganizationDocument.findFirst({
      where: { id: documentId, organizationId },
    });
    if (!document) throw new NotFoundException("Insurance document not found");
    if (document.status !== InsuranceDocumentStatus.PENDING_REVIEW)
      throw new ConflictException(
        "Document status changed; refresh and try again",
      );
    const updated = await this.prisma.insuranceOrganizationDocument.update({
      where: { id: documentId },
      data: {
        status: approve
          ? InsuranceDocumentStatus.APPROVED
          : InsuranceDocumentStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedByAdminUserId: adminUserId,
        rejectionReason: approve ? null : dto.reason,
      },
    });
    await this.record(
      adminUserId,
      approve ? "INSURANCE_DOCUMENT_APPROVED" : "INSURANCE_DOCUMENT_REJECTED",
      "InsuranceOrganizationDocument",
      documentId,
      { organizationId },
    );
    return this.documentSummary(updated);
  }

  async lines() {
    return {
      items: await this.prisma.insuranceLine.findMany({
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      }),
    };
  }

  async listPolicyTypes() {
    return {
      items: await this.prisma.insurancePolicyType.findMany({
        include: { insuranceLine: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    };
  }

  async policyTypeDetail(id: string) {
    const policyType = await this.prisma.insurancePolicyType.findUnique({
      where: { id },
      include: { insuranceLine: true },
    });
    if (!policyType)
      throw new NotFoundException("Insurance policy type not found");
    return policyType;
  }

  async createPolicyType(adminUserId: string, dto: CreatePolicyTypeDto) {
    await this.assertLinesExist([dto.insuranceLineId]);
    const policyType = await this.prisma.insurancePolicyType.create({
      data: {
        ...policyTypeData(dto),
        slug: await this.uniquePolicyTypeSlug(dto.name),
      },
      include: { insuranceLine: true },
    });
    await this.record(
      adminUserId,
      "INSURANCE_POLICY_TYPE_CREATED",
      "InsurancePolicyType",
      policyType.id,
    );
    return policyType;
  }

  async updatePolicyType(
    adminUserId: string,
    id: string,
    dto: UpdatePolicyTypeDto,
  ) {
    const current = await this.policyTypeDetail(id);
    if (
      current.status !== InsurancePolicyTypeStatus.DRAFT &&
      current.status !== InsurancePolicyTypeStatus.INACTIVE
    )
      throw new ConflictException(
        "Active policy types are immutable; create a new configuration",
      );
    await this.assertLinesExist([dto.insuranceLineId]);
    const updated = await this.prisma.insurancePolicyType.update({
      where: { id },
      data: policyTypeData(dto),
      include: { insuranceLine: true },
    });
    await this.record(
      adminUserId,
      "INSURANCE_POLICY_TYPE_UPDATED",
      "InsurancePolicyType",
      id,
    );
    return updated;
  }

  async setPolicyTypeStatus(adminUserId: string, id: string, active: boolean) {
    await this.policyTypeDetail(id);
    const policyType = await this.prisma.insurancePolicyType.update({
      where: { id },
      data: {
        status: active
          ? InsurancePolicyTypeStatus.ACTIVE
          : InsurancePolicyTypeStatus.INACTIVE,
        isEnabledForMvp: false,
      },
      include: { insuranceLine: true },
    });
    await this.record(
      adminUserId,
      active
        ? "INSURANCE_POLICY_TYPE_ACTIVATED"
        : "INSURANCE_POLICY_TYPE_DEACTIVATED",
      "InsurancePolicyType",
      id,
    );
    return policyType;
  }

  async listDisclosures() {
    return {
      items: await this.prisma.insuranceDisclosureTemplate.findMany({
        orderBy: [{ code: "asc" }, { version: "desc" }],
      }),
    };
  }

  async disclosureDetail(id: string) {
    const disclosure = await this.prisma.insuranceDisclosureTemplate.findUnique(
      { where: { id } },
    );
    if (!disclosure)
      throw new NotFoundException("Insurance disclosure not found");
    return disclosure;
  }

  async createDisclosure(adminUserId: string, dto: CreateDisclosureDto) {
    this.assertDateRange(dto.effectiveFrom, dto.effectiveUntil);
    const aggregate = await this.prisma.insuranceDisclosureTemplate.aggregate({
      where: { code: dto.code, audience: dto.audience },
      _max: { version: true },
    });
    const disclosure = await this.prisma.insuranceDisclosureTemplate.create({
      data: {
        ...disclosureData(dto),
        version: (aggregate._max.version ?? 0) + 1,
        createdByAdminUserId: adminUserId,
      },
    });
    await this.record(
      adminUserId,
      "INSURANCE_DISCLOSURE_CREATED",
      "InsuranceDisclosureTemplate",
      disclosure.id,
    );
    return disclosure;
  }

  async updateDisclosure(
    adminUserId: string,
    id: string,
    dto: UpdateDisclosureDto,
  ) {
    this.assertDateRange(dto.effectiveFrom, dto.effectiveUntil);
    const current = await this.disclosureDetail(id);
    if (current.status !== InsuranceTemplateStatus.DRAFT)
      throw new ConflictException(
        "Published disclosures are immutable; create a new version",
      );
    const updated = await this.prisma.insuranceDisclosureTemplate.update({
      where: { id },
      data: disclosureData(dto),
    });
    await this.record(
      adminUserId,
      "INSURANCE_DISCLOSURE_UPDATED",
      "InsuranceDisclosureTemplate",
      id,
    );
    return updated;
  }

  async publishDisclosure(adminUserId: string, id: string) {
    const current = await this.disclosureDetail(id);
    if (current.status !== InsuranceTemplateStatus.DRAFT)
      throw new ConflictException("Only draft disclosures can be published");
    this.assertDateRange(
      current.effectiveFrom?.toISOString(),
      current.effectiveUntil?.toISOString(),
    );
    const published = await this.prisma.$transaction(async (tx) => {
      await tx.insuranceDisclosureTemplate.updateMany({
        where: {
          code: current.code,
          audience: current.audience,
          status: InsuranceTemplateStatus.PUBLISHED,
        },
        data: {
          status: InsuranceTemplateStatus.RETIRED,
          effectiveUntil: new Date(),
        },
      });
      const result = await tx.insuranceDisclosureTemplate.update({
        where: { id },
        data: {
          status: InsuranceTemplateStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedByAdminUserId: adminUserId,
          effectiveFrom: current.effectiveFrom ?? new Date(),
        },
      });
      await this.record(
        adminUserId,
        "INSURANCE_DISCLOSURE_PUBLISHED",
        "InsuranceDisclosureTemplate",
        id,
        { version: result.version },
        tx,
      );
      return result;
    });
    return published;
  }

  async retireDisclosure(adminUserId: string, id: string) {
    const current = await this.disclosureDetail(id);
    if (current.status !== InsuranceTemplateStatus.PUBLISHED)
      throw new ConflictException("Only published disclosures can be retired");
    const retired = await this.prisma.insuranceDisclosureTemplate.update({
      where: { id },
      data: {
        status: InsuranceTemplateStatus.RETIRED,
        effectiveUntil: new Date(),
      },
    });
    await this.record(
      adminUserId,
      "INSURANCE_DISCLOSURE_RETIRED",
      "InsuranceDisclosureTemplate",
      id,
      { version: retired.version },
    );
    return retired;
  }

  async listConsentTemplates() {
    return {
      items: await this.prisma.insuranceConsentTemplate.findMany({
        orderBy: [{ code: "asc" }, { version: "desc" }],
      }),
    };
  }

  async consentTemplateDetail(id: string) {
    const template = await this.prisma.insuranceConsentTemplate.findUnique({
      where: { id },
    });
    if (!template)
      throw new NotFoundException("Insurance consent template not found");
    return template;
  }

  async createConsentTemplate(
    adminUserId: string,
    dto: CreateConsentTemplateDto,
  ) {
    this.assertDateRange(dto.effectiveFrom, dto.effectiveUntil);
    const aggregate = await this.prisma.insuranceConsentTemplate.aggregate({
      where: { code: dto.code },
      _max: { version: true },
    });
    const template = await this.prisma.insuranceConsentTemplate.create({
      data: {
        ...consentData(dto),
        version: (aggregate._max.version ?? 0) + 1,
        createdByAdminUserId: adminUserId,
      },
    });
    await this.record(
      adminUserId,
      "INSURANCE_CONSENT_TEMPLATE_CREATED",
      "InsuranceConsentTemplate",
      template.id,
    );
    return template;
  }

  async updateConsentTemplate(
    adminUserId: string,
    id: string,
    dto: UpdateConsentTemplateDto,
  ) {
    this.assertDateRange(dto.effectiveFrom, dto.effectiveUntil);
    const current = await this.consentTemplateDetail(id);
    if (current.status !== InsuranceTemplateStatus.DRAFT)
      throw new ConflictException(
        "Published consent templates are immutable; create a new version",
      );
    const updated = await this.prisma.insuranceConsentTemplate.update({
      where: { id },
      data: consentData(dto),
    });
    await this.record(
      adminUserId,
      "INSURANCE_CONSENT_TEMPLATE_UPDATED",
      "InsuranceConsentTemplate",
      id,
    );
    return updated;
  }

  async publishConsentTemplate(adminUserId: string, id: string) {
    const current = await this.consentTemplateDetail(id);
    if (current.status !== InsuranceTemplateStatus.DRAFT)
      throw new ConflictException(
        "Only draft consent templates can be published",
      );
    this.assertDateRange(
      current.effectiveFrom?.toISOString(),
      current.effectiveUntil?.toISOString(),
    );
    const published = await this.prisma.$transaction(async (tx) => {
      await tx.insuranceConsentTemplate.updateMany({
        where: {
          code: current.code,
          status: InsuranceTemplateStatus.PUBLISHED,
        },
        data: {
          status: InsuranceTemplateStatus.RETIRED,
          effectiveUntil: new Date(),
        },
      });
      const result = await tx.insuranceConsentTemplate.update({
        where: { id },
        data: {
          status: InsuranceTemplateStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedByAdminUserId: adminUserId,
          effectiveFrom: current.effectiveFrom ?? new Date(),
        },
      });
      await this.record(
        adminUserId,
        "INSURANCE_CONSENT_TEMPLATE_PUBLISHED",
        "InsuranceConsentTemplate",
        id,
        { version: result.version },
        tx,
      );
      return result;
    });
    return published;
  }

  async retireConsentTemplate(adminUserId: string, id: string) {
    const current = await this.consentTemplateDetail(id);
    if (current.status !== InsuranceTemplateStatus.PUBLISHED)
      throw new ConflictException(
        "Only published consent templates can be retired",
      );
    const retired = await this.prisma.insuranceConsentTemplate.update({
      where: { id },
      data: {
        status: InsuranceTemplateStatus.RETIRED,
        effectiveUntil: new Date(),
      },
    });
    await this.record(
      adminUserId,
      "INSURANCE_CONSENT_TEMPLATE_RETIRED",
      "InsuranceConsentTemplate",
      id,
      { version: retired.version },
    );
    return retired;
  }

  async insuranceAudit(page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceConfigurationHistory.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          adminUser: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.insuranceConfigurationHistory.count(),
    ]);
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private async transitionOrganization(
    adminUserId: string,
    organizationId: string,
    expected: InsuranceOrganizationStatus,
    next: InsuranceOrganizationStatus,
    action: string,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.insuranceOrganization.updateMany({
        where: { id: organizationId, status: expected },
        data: {
          status: next,
          submittedAt:
            next === InsuranceOrganizationStatus.PENDING_VERIFICATION
              ? new Date()
              : undefined,
          reviewedAt:
            next === InsuranceOrganizationStatus.PENDING_VERIFICATION
              ? undefined
              : new Date(),
          reviewedByAdminUserId:
            next === InsuranceOrganizationStatus.PENDING_VERIFICATION
              ? undefined
              : adminUserId,
          rejectionReason:
            next === InsuranceOrganizationStatus.REJECTED ? reason : null,
          suspensionReason:
            next === InsuranceOrganizationStatus.SUSPENDED ? reason : null,
        },
      });
      if (changed.count !== 1) {
        const exists = await tx.insuranceOrganization.findUnique({
          where: { id: organizationId },
          select: { id: true },
        });
        if (!exists)
          throw new NotFoundException("Insurance organization not found");
        throw new ConflictException(
          "Organization status changed; refresh and try again",
        );
      }
      await this.record(
        adminUserId,
        action,
        "InsuranceOrganization",
        organizationId,
        { nextStatus: next, hasReason: Boolean(reason) },
        tx,
      );
      return tx.insuranceOrganization.findUniqueOrThrow({
        where: { id: organizationId },
        include: organizationInclude,
      });
    });
  }

  private async assertActivationRequirements(
    organization: Prisma.InsuranceOrganizationGetPayload<{
      include: typeof organizationInclude;
    }>,
    tx: Prisma.TransactionClient,
  ) {
    if (
      !organization.legalName ||
      !organization.registrationNumber ||
      !organization.regulatoryAuthority
    )
      throw new ConflictException(
        "Organization regulatory identity is incomplete",
      );
    if (
      !(organization.supportEmail || organization.supportPhone) ||
      !(organization.grievanceEmail || organization.grievancePhone)
    )
      throw new ConflictException(
        "Support and grievance contact details are required",
      );
    if (!organization.insuranceLines.length)
      throw new ConflictException(
        "At least one permitted insurance line is required",
      );
    if (
      !organization.documents.some(
        (document) => document.status === InsuranceDocumentStatus.APPROVED,
      )
    )
      throw new ConflictException(
        "At least one approved organization document is required",
      );
    const now = new Date();
    const validLicence = organization.licences.some(
      (licence) =>
        licence.status === InsuranceLicenceStatus.VALID &&
        licence.validFrom <= now &&
        (!licence.validUntil || licence.validUntil >= now),
    );
    if (!validLicence)
      throw new ConflictException(
        "A current valid insurance licence is required",
      );
    const activeModel = await tx.insuranceOperatingModel.findFirst({
      where: {
        status: InsuranceOperatingModelStatus.ACTIVE,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
    });
    if (
      !activeModel ||
      !activeModel.permittedOrganizationTypes.includes(organization.type)
    )
      throw new ConflictException(
        "The active operating model does not allow this organization type",
      );
    const conflicting = await tx.insuranceOrganization.findFirst({
      where: {
        id: { not: organization.id },
        registrationNumber: organization.registrationNumber,
        regulatoryAuthority: organization.regulatoryAuthority,
        status: InsuranceOrganizationStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (conflicting)
      throw new ConflictException(
        "An active organization already uses this registration",
      );
  }

  private async assertLinesExist(ids: string[]) {
    if (!ids.length) return;
    const count = await this.prisma.insuranceLine.count({
      where: { id: { in: ids } },
    });
    if (count !== new Set(ids).size)
      throw new BadRequestException("One or more insurance lines are invalid");
  }

  private async findOperatingModel(id: string) {
    const model = await this.prisma.insuranceOperatingModel.findUnique({
      where: { id },
    });
    if (!model) throw new NotFoundException("Operating model not found");
    return model;
  }

  private async findOrganization(id: string) {
    const organization = await this.prisma.insuranceOrganization.findUnique({
      where: { id },
    });
    if (!organization)
      throw new NotFoundException("Insurance organization not found");
    return organization;
  }

  private assertDateRange(from: string | undefined, until: string | undefined) {
    if (from && until && new Date(until) < new Date(from))
      throw new BadRequestException(
        "The end date must be after the start date",
      );
  }

  private assertNoCapabilityConflict(dto: CreateOperatingModelDto) {
    if (
      dto.permittedCapabilities.some((capability) =>
        dto.restrictedCapabilities.includes(capability),
      )
    )
      throw new BadRequestException(
        "A capability cannot be both permitted and restricted",
      );
  }

  private async uniqueOrganizationSlug(legalName: string) {
    const base = slugify(legalName);
    const existing = await this.prisma.insuranceOrganization.findFirst({
      where: { slug: base },
      select: { id: true },
    });
    return existing ? `${base}-${randomUUID().slice(0, 8)}` : base;
  }

  private async uniquePolicyTypeSlug(name: string) {
    const base = slugify(name);
    const existing = await this.prisma.insurancePolicyType.findFirst({
      where: { slug: base },
      select: { id: true },
    });
    return existing ? `${base}-${randomUUID().slice(0, 8)}` : base;
  }

  private validateDocumentFile(file: UploadedInsuranceDocument) {
    if (file.size > this.env.values.INSURANCE_DOCUMENT_MAX_FILE_SIZE_BYTES)
      throw new BadRequestException(
        "Insurance document exceeds the allowed size",
      );
    if (
      !this.env.values.INSURANCE_DOCUMENT_ALLOWED_MIME_TYPES.includes(
        file.mimetype,
      )
    )
      throw new BadRequestException("Insurance document type is not allowed");
    if (!hasValidSignature(file.buffer, file.mimetype))
      throw new BadRequestException("Insurance document signature is invalid");
  }

  private documentSummary(document: {
    id: string;
    licenceId: string | null;
    type: InsuranceDocumentType;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    status: InsuranceDocumentStatus;
    uploadedAt: Date;
    reviewedAt: Date | null;
    rejectionReason: string | null;
  }) {
    return document;
  }

  private toOrganizationDetail(
    organization: Prisma.InsuranceOrganizationGetPayload<{
      include: typeof organizationInclude;
    }>,
  ) {
    return {
      ...organization,
      insuranceLines: organization.insuranceLines.map(
        ({ insuranceLine }) => insuranceLine,
      ),
    };
  }

  private async record(
    adminUserId: string,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: unknown,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    await Promise.all([
      this.audit.record(
        { adminUserId, action, entityType, entityId, metadata },
        tx,
      ),
      client.insuranceConfigurationHistory.create({
        data: {
          adminUserId,
          action,
          entityType,
          entityId,
          metadata: auditMetadata(metadata),
        },
      }),
    ]);
  }
}

function operatingModelData(dto: CreateOperatingModelDto) {
  return {
    ...dto,
    countryCode: dto.countryCode.toUpperCase(),
    licenceIssuedAt: toDate(dto.licenceIssuedAt),
    licenceValidFrom: new Date(dto.licenceValidFrom),
    licenceValidUntil: toDate(dto.licenceValidUntil),
  };
}

function organizationData(dto: CreateOrganizationDto) {
  return {
    type: dto.type,
    legalName: dto.legalName,
    tradeName: dto.tradeName,
    registrationNumber: dto.registrationNumber,
    regulatoryAuthority: dto.regulatoryAuthority,
    websiteUrl: dto.websiteUrl,
    supportEmail: dto.supportEmail,
    supportPhone: dto.supportPhone,
    grievanceEmail: dto.grievanceEmail,
    grievancePhone: dto.grievancePhone,
    registeredAddress: dto.registeredAddress,
    primaryJurisdiction: dto.primaryJurisdiction,
    countryCode: dto.countryCode.toUpperCase(),
    registrationValidFrom: toDate(dto.registrationValidFrom),
    registrationValidUntil: toDate(dto.registrationValidUntil),
  };
}

function licenceData(dto: CreateLicenceDto) {
  return {
    ...dto,
    validFrom: new Date(dto.validFrom),
    validUntil: toDate(dto.validUntil),
  };
}

function licenceStatus(validUntil: string | undefined): InsuranceLicenceStatus {
  return validUntil && new Date(validUntil) < new Date()
    ? InsuranceLicenceStatus.EXPIRED
    : InsuranceLicenceStatus.VALID;
}

function policyTypeData(dto: CreatePolicyTypeDto) {
  return {
    insuranceLineId: dto.insuranceLineId,
    code: dto.code.toUpperCase(),
    name: dto.name,
    description: dto.description,
    sortOrder: dto.sortOrder,
  };
}

function disclosureData(dto: CreateDisclosureDto) {
  return {
    code: dto.code.toUpperCase(),
    name: dto.name,
    audience: dto.audience,
    purpose: dto.purpose,
    content: dto.content,
    effectiveFrom: toDate(dto.effectiveFrom),
    effectiveUntil: toDate(dto.effectiveUntil),
    requiresAcknowledgement: dto.requiresAcknowledgement,
  };
}

function consentData(dto: CreateConsentTemplateDto) {
  return {
    code: dto.code.toUpperCase(),
    name: dto.name,
    purpose: dto.purpose,
    description: dto.description,
    dataCategories: dto.dataCategories,
    processingPurposes: dto.processingPurposes,
    thirdPartyCategories: dto.thirdPartyCategories,
    retentionReference: dto.retentionReference,
    withdrawalDescription: dto.withdrawalDescription,
    content: dto.content,
    effectiveFrom: toDate(dto.effectiveFrom),
    effectiveUntil: toDate(dto.effectiveUntil),
  };
}

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug || `insurance-${randomUUID().slice(0, 8)}`;
}

function safeFileName(value: string): string {
  const sanitized = [...value]
    .map((character) =>
      character.charCodeAt(0) < 32 || '\\/:*?"<>|'.includes(character)
        ? "_"
        : character,
    )
    .join("");
  return sanitized.slice(0, 180) || "document";
}

function hasValidSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "application/pdf")
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/jpeg")
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  if (mimeType === "image/png")
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  return false;
}

function auditMetadata(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) return {};
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  if (Array.isArray(value)) return value.map(auditMetadata);
  if (typeof value === "object") {
    const result: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, item] of Object.entries(value))
      result[key] = auditMetadata(item);
    return result;
  }
  return "[unserializable]";
}
