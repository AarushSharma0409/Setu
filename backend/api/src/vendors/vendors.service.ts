import { createHash, randomUUID } from "node:crypto";
import { extname } from "node:path";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import {
  AccountStatus,
  NotificationRecipientType,
  NotificationType,
  Prisma,
  UserRole,
  VendorDocumentStatus,
  VendorDocumentType,
  VendorStatus,
} from "@prisma/client";

import { ReplaceVendorCategoriesDto } from "./dto/replace-vendor-categories.dto";
import { ReplaceVendorServiceAreasDto } from "./dto/replace-vendor-service-areas.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
import { EnvService } from "../common/env/env.service";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { DocumentScannerService } from "../storage/document-scanner.service";
import { ObjectStorageService } from "../storage/object-storage.service";

interface UploadedDocumentFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const vendorInclude = {
  categories: {
    include: {
      category: {
        select: { id: true, name: true, slug: true, description: true },
      },
    },
    orderBy: { category: { name: "asc" } },
  },
  serviceAreas: {
    include: {
      city: {
        select: {
          id: true,
          stateId: true,
          name: true,
          slug: true,
          state: { select: { name: true } },
        },
      },
    },
    orderBy: { city: { name: "asc" } },
  },
  documents: {
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      type: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      uploadedAt: true,
    },
  },
} satisfies Prisma.VendorProfileInclude;

type VendorWithRelations = Prisma.VendorProfileGetPayload<{
  include: typeof vendorInclude;
}>;

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    private readonly envService: EnvService,
    private readonly objectStorage: ObjectStorageService,
    private readonly documentScanner: DocumentScannerService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async startOnboarding(user: AuthenticatedPrincipal) {
    await this.prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({ where: { id: user.sub } });

      if (!currentUser || currentUser.status !== AccountStatus.ACTIVE) {
        throw new UnauthorizedException("Authentication required");
      }

      if (currentUser.role === UserRole.USER) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: { role: UserRole.VENDOR },
        });
      }

      const existing = await tx.vendorProfile.findUnique({
        where: { ownerUserId: currentUser.id },
      });

      if (!existing) {
        await tx.vendorProfile.create({
          data: {
            ownerUserId: currentUser.id,
            contactEmail: currentUser.email,
            contactPhone: currentUser.phone,
          },
        });
      }
    });

    return this.getMine(user);
  }

  async getMine(user: AuthenticatedPrincipal) {
    const vendor = await this.findVendorForUser(user.sub);

    if (!vendor) {
      throw new NotFoundException("Vendor onboarding has not been started");
    }

    return { vendor: this.toSummary(vendor) };
  }

  async updateProfile(
    user: AuthenticatedPrincipal,
    dto: UpdateVendorProfileDto,
  ) {
    const vendor = await this.ensureDraftVendor(user.sub);

    if (dto.primaryCityId) {
      await this.ensureActiveCities([dto.primaryCityId]);
    }

    const slug = dto.businessName
      ? await this.nextVendorSlug(dto.businessName, vendor.id)
      : undefined;

    await this.prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: {
        businessName: clean(dto.businessName),
        slug,
        legalName: clean(dto.legalName),
        description: clean(dto.description),
        contactEmail: clean(dto.contactEmail),
        contactPhone: clean(dto.contactPhone),
        websiteUrl: clean(dto.websiteUrl),
        yearEstablished: dto.yearEstablished,
        addressLine1: clean(dto.addressLine1),
        addressLine2: clean(dto.addressLine2),
        postalCode: clean(dto.postalCode),
        primaryCityId: dto.primaryCityId,
      },
    });

    return this.getMine(user);
  }

  async replaceCategories(
    user: AuthenticatedPrincipal,
    dto: ReplaceVendorCategoriesDto,
  ) {
    const vendor = await this.ensureDraftVendor(user.sub);
    const categoryIds = unique(dto.categoryIds);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, isActive: true },
      select: { id: true },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException("One or more categories are invalid");
    }

    await this.prisma.$transaction([
      this.prisma.vendorCategory.deleteMany({ where: { vendorId: vendor.id } }),
      this.prisma.vendorCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          vendorId: vendor.id,
          categoryId,
        })),
      }),
    ]);

    const owner = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { email: true, name: true },
    });
    const vendorEmail = vendor.contactEmail ?? owner?.email;
    await this.mail.send({
      event: "vendor_verification_submitted",
      to: vendorEmail,
      subject: "Your Setu vendor profile has been submitted for verification",
      title: "Your profile is under review",
      body: `Hello ${vendor.businessName ?? owner?.name ?? "there"},\n\nWe received your vendor verification submission. Your business profile is now under review and we will notify you when its status changes.`,
      cta: {
        label: "Open vendor workspace",
        url: this.mail.publicUrl("/vendor"),
      },
    });
    await this.mail.send({
      event: "vendor_verification_admin_notification",
      to: this.envService.values.ADMIN_NOTIFICATION_EMAIL,
      subject: "New Setu vendor verification request",
      title: "A vendor application needs review",
      body: `Business: ${vendor.businessName ?? "Not provided"}\nOwner: ${owner?.name ?? "Not provided"}\nContact: ${vendorEmail ?? "Not provided"}\nCategories: ${vendor.categories.map(({ category }) => category.name).join(", ") || "Not provided"}\nService cities: ${vendor.serviceAreas.map(({ city }) => city.name).join(", ") || "Not provided"}\nStatus: Pending review`,
      cta: {
        label: "Review vendor",
        url: this.mail.adminUrl(`/dashboard/vendors/${vendor.id}`),
      },
    });

    return this.getMine(user);
  }

  async replaceServiceAreas(
    user: AuthenticatedPrincipal,
    dto: ReplaceVendorServiceAreasDto,
  ) {
    const vendor = await this.ensureDraftVendor(user.sub);
    const cityIds = unique(dto.cityIds);
    const primaryCityId = dto.primaryCityId ?? cityIds[0];

    if (!cityIds.includes(primaryCityId)) {
      throw new BadRequestException("Primary city must be in service areas");
    }

    await this.ensureActiveCities(cityIds);

    await this.prisma.$transaction([
      this.prisma.vendorServiceArea.deleteMany({
        where: { vendorId: vendor.id },
      }),
      this.prisma.vendorServiceArea.createMany({
        data: cityIds.map((cityId) => ({
          vendorId: vendor.id,
          cityId,
          isPrimary: cityId === primaryCityId,
        })),
      }),
      this.prisma.vendorProfile.update({
        where: { id: vendor.id },
        data: { primaryCityId },
      }),
    ]);

    return this.getMine(user);
  }

  async listDocuments(user: AuthenticatedPrincipal) {
    const vendor = await this.findVendorForUser(user.sub);

    if (!vendor) {
      throw new NotFoundException("Vendor onboarding has not been started");
    }

    return { documents: this.toSummary(vendor).documents };
  }

  async uploadDocument(
    user: AuthenticatedPrincipal,
    type: VendorDocumentType,
    file: UploadedDocumentFile | undefined,
  ) {
    const vendor = await this.ensureDraftVendor(user.sub);

    if (!file) {
      throw new BadRequestException("Document file is required");
    }

    this.validateDocumentFile(file);

    const checksumSha256 = createHash("sha256")
      .update(file.buffer)
      .digest("hex");
    const storageKey = this.createStorageKey(vendor.id, file.originalname);

    const scan = await this.documentScanner.scan({
      buffer: file.buffer,
      mimeType: file.mimetype,
    });

    if (scan.status === "rejected") {
      throw new BadRequestException(
        "This document was rejected by the malware scanner",
      );
    }
    if (scan.status === "not_configured" && this.envService.isProduction) {
      throw new ServiceUnavailableException(
        "Document security scanning is temporarily unavailable",
      );
    }

    try {
      await this.objectStorage.putObject({
        buffer: file.buffer,
        key: storageKey,
        mimeType: file.mimetype,
      });

      await this.prisma.vendorDocument.create({
        data: {
          vendorId: vendor.id,
          type,
          storageKey,
          originalFileName: sanitizeFileName(file.originalname),
          mimeType: file.mimetype,
          sizeBytes: file.size,
          checksumSha256,
          metadata: {
            malwareScan: scan.status,
            malwareScanner: scan.engine ?? null,
          },
        },
      });
    } catch (error) {
      await this.objectStorage.deleteObject(storageKey).catch(() => undefined);
      throw error;
    }

    return this.getMine(user);
  }

  async deleteDocument(user: AuthenticatedPrincipal, documentId: string) {
    const vendor = await this.ensureDraftVendor(user.sub);
    const document = await this.prisma.vendorDocument.findFirst({
      where: { id: documentId, vendorId: vendor.id },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    await this.prisma.$transaction([
      this.prisma.vendorDocument.delete({ where: { id: document.id } }),
    ]);
    try {
      await this.objectStorage.deleteObject(document.storageKey);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: "storage_orphan_detected",
          documentId: document.id,
          vendorId: vendor.id,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }

    return { ok: true };
  }

  async submit(user: AuthenticatedPrincipal) {
    const vendor = await this.findVendorForUser(user.sub);

    if (!vendor) {
      throw new NotFoundException("Vendor onboarding has not been started");
    }

    if (vendor.status === VendorStatus.PENDING_REVIEW) {
      return { vendor: this.toSummary(vendor) };
    }

    if (vendor.status !== VendorStatus.DRAFT) {
      throw new ConflictException("Vendor profile cannot be submitted");
    }

    const missingRequirements = this.missingRequirements(vendor);

    if (missingRequirements.length > 0) {
      throw new BadRequestException({
        message: "Vendor onboarding is incomplete",
        missingRequirements,
      });
    }

    await this.prisma.$transaction([
      this.prisma.vendorProfile.update({
        where: { id: vendor.id },
        data: {
          status: VendorStatus.PENDING_REVIEW,
          submittedAt: new Date(),
        },
      }),
      this.prisma.vendorDocument.updateMany({
        where: { vendorId: vendor.id, status: VendorDocumentStatus.UPLOADED },
        data: { status: VendorDocumentStatus.PENDING_REVIEW },
      }),
      this.prisma.notification.create({
        data: {
          recipientType: NotificationRecipientType.VENDOR,
          vendorId: vendor.id,
          type: NotificationType.VENDOR_APPLICATION_SUBMITTED,
          title: "Application submitted for review",
          body: "Your vendor application is in the verification queue. We aim to review complete applications within 24 hours.",
        },
      }),
    ]);

    return this.getMine(user);
  }

  private async ensureDraftVendor(ownerUserId: string) {
    const vendor = await this.findVendorForUser(ownerUserId);

    if (!vendor) {
      throw new NotFoundException("Vendor onboarding has not been started");
    }

    if (vendor.status !== VendorStatus.DRAFT) {
      throw new ForbiddenException("Submitted vendor profiles are read-only");
    }

    return vendor;
  }

  private async findVendorForUser(ownerUserId: string) {
    return this.prisma.vendorProfile.findUnique({
      where: { ownerUserId },
      include: vendorInclude,
    });
  }

  private async ensureActiveCities(cityIds: string[]) {
    const cities = await this.prisma.city.findMany({
      where: { id: { in: cityIds }, isActive: true, state: { isActive: true } },
      select: { id: true },
    });

    if (cities.length !== cityIds.length) {
      throw new BadRequestException("One or more cities are invalid");
    }
  }

  private async nextVendorSlug(
    businessName: string,
    currentVendorId: string,
  ): Promise<string> {
    const baseSlug = slugify(businessName);

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
      const existing = await this.prisma.vendorProfile.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing || existing.id === currentVendorId) {
        return candidate;
      }
    }

    return `${baseSlug}-${randomUUID().slice(0, 8)}`;
  }

  private validateDocumentFile(file: UploadedDocumentFile) {
    const allowedMimeTypes = this.envService.values.DOCUMENT_ALLOWED_MIME_TYPES;

    if (file.size <= 0) {
      throw new BadRequestException("Document file cannot be empty");
    }

    if (file.size > this.envService.values.DOCUMENT_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException("Document file is too large");
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("Document file type is not allowed");
    }

    if (!hasAllowedExtension(file.originalname, file.mimetype)) {
      throw new BadRequestException("Document file extension is not allowed");
    }

    if (!hasExpectedSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException("Document file content is invalid");
    }
  }

  private createStorageKey(vendorId: string, originalName: string): string {
    const extension = extname(originalName).toLowerCase();
    return `vendors/${vendorId}/documents/${randomUUID()}${extension}`;
  }

  private toSummary(vendor: VendorWithRelations) {
    return {
      id: vendor.id,
      status: vendor.status,
      businessName: vendor.businessName,
      legalName: vendor.legalName,
      description: vendor.description,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      websiteUrl: vendor.websiteUrl,
      yearEstablished: vendor.yearEstablished,
      addressLine1: vendor.addressLine1,
      addressLine2: vendor.addressLine2,
      postalCode: vendor.postalCode,
      primaryCityId: vendor.primaryCityId,
      submittedAt: vendor.submittedAt,
      categories: vendor.categories.map(({ category }) => category),
      serviceAreas: vendor.serviceAreas.map(({ city }) => ({
        id: city.id,
        stateId: city.stateId,
        stateName: city.state.name,
        name: city.name,
        slug: city.slug,
      })),
      documents: vendor.documents,
      missingRequirements: this.missingRequirements(vendor),
    };
  }

  private missingRequirements(vendor: VendorWithRelations): string[] {
    const missing: string[] = [];

    if (!vendor.businessName) {
      missing.push("Business name");
    }

    if (!vendor.description) {
      missing.push("Business description");
    }

    if (!vendor.contactEmail && !vendor.contactPhone) {
      missing.push("Business contact email or phone");
    }

    if (!vendor.primaryCityId) {
      missing.push("Primary city");
    }

    if (vendor.categories.length === 0) {
      missing.push("At least one category");
    }

    if (vendor.serviceAreas.length === 0) {
      missing.push("At least one service area");
    }

    if (vendor.documents.length === 0) {
      missing.push("At least one business document");
    }

    return missing;
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || `vendor-${randomUUID().slice(0, 8)}`;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
}

export function hasAllowedExtension(
  fileName: string,
  mimeType: string,
): boolean {
  const extension = extname(fileName).toLowerCase();
  const expectedExtensions: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  };

  return expectedExtensions[mimeType]?.includes(extension) ?? false;
}

export function hasExpectedSignature(
  buffer: Buffer,
  mimeType: string,
): boolean {
  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 4).toString("utf8") === "%PDF";
  }

  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return false;
}
