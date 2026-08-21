import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  NotificationRecipientType,
  NotificationType,
  VendorDocumentStatus,
  VendorStatus,
  VendorVerificationDecisionType,
} from "@prisma/client";

import {
  ApproveVendorDto,
  RejectVendorDto,
  SuspendVendorDto,
  ReactivateVendorDto,
  VendorVerificationQueueQueryDto,
} from "./dto/vendor-verification.dto";
import { AuditService } from "../audit/audit.service";
import { EnvService } from "../common/env/env.service";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { ObjectStorageService } from "../storage/object-storage.service";


const adminVendorInclude = {
  owner: {
    select: { id: true, email: true, phone: true, name: true, status: true },
  },
  primaryCity: {
    select: {
      id: true,
      name: true,
      state: { select: { id: true, name: true, code: true } },
    },
  },
  categories: {
    include: {
      category: {
        select: { id: true, name: true, slug: true, description: true },
      },
    },
  },
  serviceAreas: {
    include: {
      city: {
        select: {
          id: true,
          name: true,
          slug: true,
          state: { select: { id: true, name: true } },
        },
      },
    },
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
  verificationDecisions: {
    orderBy: { createdAt: "desc" },
    include: { adminUser: { select: { id: true, email: true, role: true } } },
  },
} satisfies Prisma.VendorProfileInclude;

@Injectable()
export class AdminVendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly objectStorage: ObjectStorageService,
    private readonly envService: EnvService,
    private readonly mail: MailService,
    private readonly auditService: AuditService,
  ) {}

  async queue(query: VendorVerificationQueueQueryDto) {
    return this.list({
      ...query,
      status: query.status ?? VendorStatus.PENDING_REVIEW,
    });
  }

  async list(query: VendorVerificationQueueQueryDto) {
    const status = query.status;
    const where: Prisma.VendorProfileWhereInput = {
      status,
      primaryCityId: query.cityId,
      submittedAt:
        query.submittedFrom || query.submittedTo
          ? {
              gte: query.submittedFrom
                ? new Date(query.submittedFrom)
                : undefined,
              lte: query.submittedTo ? new Date(query.submittedTo) : undefined,
            }
          : undefined,
      categories: query.categoryId
        ? { some: { categoryId: query.categoryId } }
        : undefined,
      OR: query.search
        ? [
            { businessName: { contains: query.search, mode: "insensitive" } },
            { legalName: { contains: query.search, mode: "insensitive" } },
            {
              owner: { email: { contains: query.search, mode: "insensitive" } },
            },
            {
              owner: { phone: { contains: query.search, mode: "insensitive" } },
            },
          ]
        : undefined,
    };

    const orderBy =
      query.sort === "newest"
        ? [{ submittedAt: "desc" as const }, { id: "desc" as const }]
        : query.sort === "businessName"
          ? [{ businessName: "asc" as const }, { id: "asc" as const }]
          : [{ submittedAt: "asc" as const }, { id: "asc" as const }];

    const [vendors, total] = await this.prisma.$transaction([
      this.prisma.vendorProfile.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          owner: { select: { id: true, email: true, phone: true, name: true } },
          primaryCity: {
            select: { id: true, name: true, state: { select: { name: true } } },
          },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          serviceAreas: {
            select: {
              city: {
                select: {
                  id: true,
                  name: true,
                  state: { select: { name: true } },
                },
              },
            },
          },
          _count: { select: { documents: true } },
        },
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    return {
      items: vendors.map((vendor) => ({
        vendorId: vendor.id,
        businessName: vendor.businessName,
        owner: vendor.owner,
        primaryCity: vendor.primaryCity,
        categories: vendor.categories.map(({ category }) => category),
        submittedAt: vendor.submittedAt,
        documentCount: vendor._count.documents,
        status: vendor.status,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async detail(adminUserId: string, vendorId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: adminVendorInclude,
    });

    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }

    await this.auditService.record({
      adminUserId,
      action: "VENDOR_APPLICATION_VIEWED",
      entityType: "VendorProfile",
      entityId: vendor.id,
    });

    return this.toDetail(vendor);
  }

  async documentAccess(
    adminUserId: string,
    vendorId: string,
    documentId: string,
  ) {
    const document = await this.prisma.vendorDocument.findFirst({
      where: { id: documentId, vendorId },
      select: {
        id: true,
        storageKey: true,
        originalFileName: true,
        mimeType: true,
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    const url = await this.objectStorage.getSignedReadUrl({
      key: document.storageKey,
      expiresInSeconds: this.envService.values.ADMIN_DOCUMENT_URL_TTL_SECONDS,
    });
    await this.auditService.record({
      adminUserId,
      action: "VENDOR_DOCUMENT_VIEWED",
      entityType: "VendorDocument",
      entityId: document.id,
      metadata: { vendorId: vendorId, mimeType: document.mimeType },
    });

    return {
      url,
      expiresInSeconds: this.envService.values.ADMIN_DOCUMENT_URL_TTL_SECONDS,
      fileName: document.originalFileName,
      mimeType: document.mimeType,
    };
  }

  async approve(adminUserId: string, vendorId: string, dto: ApproveVendorDto) {
    return this.decide(adminUserId, vendorId, VendorStatus.APPROVED, {
      decision: VendorVerificationDecisionType.APPROVED,
      notes: clean(dto.notes),
    });
  }

  async reject(adminUserId: string, vendorId: string, dto: RejectVendorDto) {
    return this.decide(adminUserId, vendorId, VendorStatus.REJECTED, {
      decision: VendorVerificationDecisionType.REJECTED,
      reason: clean(dto.reason),
      notes: clean(dto.notes),
    });
  }

  async suspend(adminUserId: string, vendorId: string, dto: SuspendVendorDto) {
    return this.decide(
      adminUserId,
      vendorId,
      VendorStatus.SUSPENDED,
      {
        decision: VendorVerificationDecisionType.SUSPENDED,
        reason: clean(dto.reason),
        notes: clean(dto.notes),
      },
      VendorStatus.APPROVED,
    );
  }

  async reactivate(
    adminUserId: string,
    vendorId: string,
    dto: ReactivateVendorDto,
  ) {
    return this.decide(
      adminUserId,
      vendorId,
      VendorStatus.APPROVED,
      {
        decision: VendorVerificationDecisionType.APPROVED,
        notes: clean(dto.notes),
      },
      VendorStatus.SUSPENDED,
      "VENDOR_REACTIVATED",
    );
  }

  private async decide(
    adminUserId: string,
    vendorId: string,
    nextStatus: VendorStatus,
    decision: {
      decision: VendorVerificationDecisionType;
      reason?: string;
      notes?: string;
    },
    expectedStatus: VendorStatus = VendorStatus.PENDING_REVIEW,
    auditAction?: string,
  ) {
    const action =
      auditAction ??
      (nextStatus === VendorStatus.APPROVED
        ? "VENDOR_APPROVED"
        : nextStatus === VendorStatus.REJECTED
          ? "VENDOR_REJECTED"
          : "VENDOR_SUSPENDED");

    await this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendorProfile.findUnique({
        where: { id: vendorId },
        select: { id: true, status: true },
      });
      if (!vendor) {
        throw new NotFoundException("Vendor not found");
      }
      if (vendor.status !== expectedStatus) {
        throw new ConflictException(
          "Vendor status changed; refresh and try again",
        );
      }

      const changed = await tx.vendorProfile.updateMany({
        where: { id: vendorId, status: expectedStatus },
        data: {
          status: nextStatus,
          reviewedAt: new Date(),
          reviewedByAdminUserId: adminUserId,
          rejectionReason:
            nextStatus === VendorStatus.REJECTED ? decision.reason : null,
          suspendedAt:
            nextStatus === VendorStatus.SUSPENDED ? new Date() : null,
          suspendedByAdminUserId:
            nextStatus === VendorStatus.SUSPENDED ? adminUserId : null,
          suspensionReason:
            nextStatus === VendorStatus.SUSPENDED ? decision.reason : null,
        },
      });
      if (changed.count !== 1) {
        throw new ConflictException(
          "Vendor status changed; refresh and try again",
        );
      }

      if (
        nextStatus === VendorStatus.APPROVED ||
        nextStatus === VendorStatus.REJECTED
      ) {
        await tx.vendorDocument.updateMany({
          where: { vendorId, status: VendorDocumentStatus.PENDING_REVIEW },
          data: {
            status:
              nextStatus === VendorStatus.APPROVED
                ? VendorDocumentStatus.APPROVED
                : VendorDocumentStatus.REJECTED,
          },
        });
      }

      if (
        nextStatus === VendorStatus.APPROVED &&
        expectedStatus === VendorStatus.PENDING_REVIEW
      ) {
        await tx.notification.create({
          data: {
            recipientType: NotificationRecipientType.VENDOR,
            vendorId,
            type: NotificationType.VENDOR_APPLICATION_APPROVED,
            title: "Your vendor application is approved",
            body: "Your business is now approved and visible to customers on Setu. You can start managing inquiries from your vendor workspace.",
          },
        });
      }

      if (nextStatus === VendorStatus.SUSPENDED) {
        await tx.notification.create({
          data: {
            recipientType: NotificationRecipientType.VENDOR,
            vendorId,
            type: NotificationType.VENDOR_APPLICATION_SUSPENDED,
            title: "Your Setu vendor profile is suspended",
            body: "Your profile is temporarily hidden from customers. Review the note in your vendor workspace or contact Setu support for next steps.",
          },
        });
      }

      await tx.vendorVerificationDecision.create({
        data: {
          vendorId,
          adminUserId,
          decision: decision.decision,
          reason: decision.reason,
          notes: decision.notes,
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId,
          action,
          entityType: "VendorProfile",
          entityId: vendorId,
          metadata: {
            nextStatus,
            hasReason: Boolean(decision.reason),
            hasNotes: Boolean(decision.notes),
          },
        },
      });
    });

    const updated = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: adminVendorInclude,
    });
    if (
      updated &&
      nextStatus === VendorStatus.APPROVED &&
      expectedStatus === VendorStatus.PENDING_REVIEW
    ) {
      await this.mail.send({
        event: "vendor_approved",
        to: updated.contactEmail ?? updated.owner.email,
        subject: "Your Setu vendor profile has been approved",
        title: "Your vendor profile is approved",
        body: `Hello ${updated.businessName ?? "there"},\n\nYour Setu vendor profile has been approved. Your profile is now visible to customers and you can manage inquiries from your vendor workspace.`,
        cta: { label: "Open vendor workspace", url: this.mail.publicUrl("/vendor") },
      });
    }
    if (updated && nextStatus === VendorStatus.SUSPENDED) {
      await this.mail.send({
        event: "vendor_suspended",
        to: updated.contactEmail ?? updated.owner.email,
        subject: "Important update to your Setu vendor account",
        title: "Your vendor profile is temporarily suspended",
        body: `Hello ${updated.businessName ?? "there"},\n\nYour Setu vendor profile is temporarily suspended and is no longer visible to customers.${decision.reason ? `\n\nReason: ${decision.reason}` : "\n\nPlease contact Setu support for next steps."}`,
        cta: { label: "Open vendor workspace", url: this.mail.publicUrl("/vendor") },
      });
    }
    if (
      updated &&
      nextStatus === VendorStatus.APPROVED &&
      expectedStatus === VendorStatus.SUSPENDED
    ) {
      await this.mail.send({
        event: "vendor_reactivated",
        to: updated.contactEmail ?? updated.owner.email,
        subject: "Your Setu vendor account has been reactivated",
        title: "Your vendor profile is active again",
        body: `Hello ${updated.businessName ?? "there"},\n\nYour Setu vendor profile has been reactivated and is visible to customers again. You can continue managing eligible inquiries from your workspace.`,
        cta: { label: "Open vendor workspace", url: this.mail.publicUrl("/vendor") },
      });
    }
    if (updated && nextStatus === VendorStatus.REJECTED) {
      await this.mail.send({
        event: "vendor_rejected",
        to: updated.contactEmail ?? updated.owner.email,
        subject: "Update on your Setu vendor verification",
        title: "Your verification application needs attention",
        body: `Hello ${updated.businessName ?? "there"},\n\nYour Setu vendor verification application was not approved at this time.${decision.reason ? `\n\nReason: ${decision.reason}` : "\n\nPlease contact Setu support for next steps."}`,
        cta: { label: "Open Setu", url: this.mail.publicUrl("/") },
      });
    }
    return updated ? this.toDetail(updated) : { vendorId, status: nextStatus };
  }

  private toDetail(
    vendor: Prisma.VendorProfileGetPayload<{
      include: typeof adminVendorInclude;
    }>,
  ) {
    return {
      id: vendor.id,
      owner: vendor.owner,
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
      primaryCity: vendor.primaryCity,
      serviceAreas: vendor.serviceAreas.map(({ city }) => city),
      categories: vendor.categories.map(({ category }) => category),
      status: vendor.status,
      submittedAt: vendor.submittedAt,
      reviewedAt: vendor.reviewedAt,
      rejectionReason: vendor.rejectionReason,
      suspensionReason: vendor.suspensionReason,
      documents: vendor.documents,
      verificationDecisions: vendor.verificationDecisions,
    };
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
