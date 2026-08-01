import { createHash, randomBytes } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AccountStatus,
  InquiryActorType,
  InquiryMessageSenderType,
  InquiryStatus,
  NotificationRecipientType,
  NotificationType,
  Prisma,
  VendorStatus,
} from "@prisma/client";

import {
  CreateInquiryDto,
  InquiryListQueryDto,
  InquiryMessageDto,
  InquiryStatusDto,
} from "./dto/inquiry.dto";
import {
  assertTransition,
  canUserClose,
  canUserWithdraw,
  isTerminal,
} from "./inquiry-state";
import { EnvService } from "../common/env/env.service";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PrismaService } from "../database/prisma.service";
import { publicVendorWhere } from "../public-discovery/public-discovery.service";

const inquiryListSelect = {
  id: true,
  referenceNumber: true,
  subject: true,
  status: true,
  lastMessageAt: true,
  createdAt: true,
  userReadAt: true,
  vendorReadAt: true,
  vendor: {
    select: { id: true, slug: true, businessName: true, status: true },
  },
} satisfies Prisma.InquirySelect;

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
  ) {}

  async create(
    user: AuthenticatedPrincipal,
    dto: CreateInquiryDto,
    idempotencyKey?: string,
  ) {
    const account = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, status: true },
    });
    if (!account || account.status !== AccountStatus.ACTIVE)
      throw new UnauthorizedException("Authentication required");
    const normalized = {
      ...dto,
      subject: dto.subject.trim(),
      message: dto.message.trim(),
    };
    const normalizedIdempotencyKey = idempotencyKey?.trim();
    if (
      normalizedIdempotencyKey &&
      !/^[a-zA-Z0-9._:-]{1,160}$/.test(normalizedIdempotencyKey)
    ) {
      throw new BadRequestException("Idempotency-Key is invalid");
    }
    const requestHash = createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex");

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        if (normalizedIdempotencyKey) {
          const existingKey = await tx.inquiryIdempotencyKey.findFirst({
            where: {
              userId: user.sub,
              key: normalizedIdempotencyKey,
              expiresAt: { gt: new Date() },
            },
            include: { inquiry: true },
          });
          if (existingKey) {
            if (existingKey.requestHash !== requestHash)
              throw new ConflictException(
                "Idempotency key was already used for another request",
              );
            return existingKey.inquiry;
          }
        }

        const vendor = await tx.vendorProfile.findFirst({
          where: { id: dto.vendorId, ...publicVendorWhere },
          select: {
            id: true,
            ownerUserId: true,
            slug: true,
            businessName: true,
            status: true,
            categories: { select: { categoryId: true } },
            serviceAreas: { select: { cityId: true } },
          },
        });
        if (!vendor) throw new NotFoundException("Vendor not found");
        if (vendor.ownerUserId === user.sub)
          throw new ForbiddenException(
            "You cannot contact your own vendor profile",
          );
        if (
          dto.categoryId &&
          !vendor.categories.some((item) => item.categoryId === dto.categoryId)
        )
          throw new BadRequestException(
            "Selected category is not offered by this vendor",
          );
        if (
          dto.serviceCityId &&
          !vendor.serviceAreas.some((item) => item.cityId === dto.serviceCityId)
        )
          throw new BadRequestException(
            "Selected city is not served by this vendor",
          );

        const referenceNumber = await this.nextReferenceNumber(tx);
        const inquiry = await tx.inquiry.create({
          data: {
            referenceNumber,
            userId: user.sub,
            vendorId: vendor.id,
            categoryId: dto.categoryId,
            serviceCityId: dto.serviceCityId,
            subject: normalized.subject,
            preferredContactMethod: dto.preferredContactMethod,
            lastMessageAt: new Date(),
            messages: {
              create: {
                senderType: InquiryMessageSenderType.USER,
                senderUserId: user.sub,
                body: normalized.message,
              },
            },
            statusHistory: {
              create: {
                toStatus: InquiryStatus.NEW,
                actorType: InquiryActorType.SYSTEM,
              },
            },
          },
        });
        await tx.notification.create({
          data: {
            recipientType: NotificationRecipientType.VENDOR,
            vendorId: vendor.id,
            inquiryId: inquiry.id,
            type: NotificationType.INQUIRY_CREATED,
            title: "New inquiry",
            body: `New inquiry ${referenceNumber} received.`,
          },
        });
        if (normalizedIdempotencyKey)
          await tx.inquiryIdempotencyKey.create({
            data: {
              userId: user.sub,
              key: normalizedIdempotencyKey,
              requestHash,
              inquiryId: inquiry.id,
              expiresAt: new Date(
                Date.now() +
                  this.env.values.INQUIRY_IDEMPOTENCY_TTL_SECONDS * 1000,
              ),
            },
          });
        return inquiry;
      });
      return this.createdView(created.id);
    } catch (error) {
      if (isPrismaConflict(error) && normalizedIdempotencyKey) {
        const existing = await this.prisma.inquiryIdempotencyKey.findFirst({
          where: { userId: user.sub, key: normalizedIdempotencyKey },
          select: { inquiryId: true, requestHash: true },
        });
        if (existing?.requestHash === requestHash)
          return this.createdView(existing.inquiryId);
      }
      throw error;
    }
  }

  async userList(user: AuthenticatedPrincipal, query: InquiryListQueryDto) {
    const where: Prisma.InquiryWhereInput = { userId: user.sub };
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;
    const orderBy =
      query.sort === "created_desc"
        ? [{ createdAt: "desc" as const }, { id: "desc" as const }]
        : [
            { lastMessageAt: "desc" as const },
            { createdAt: "desc" as const },
            { id: "desc" as const },
          ];
    return this.listWithPagination(where, query, orderBy, "USER");
  }

  async vendorList(user: AuthenticatedPrincipal, query: InquiryListQueryDto) {
    const vendor = await this.ownedVendor(user.sub);
    const where: Prisma.InquiryWhereInput = { vendorId: vendor.id };
    if (query.status) where.status = query.status;
    if (query.search)
      where.OR = [
        { subject: { contains: query.search.trim(), mode: "insensitive" } },
        {
          referenceNumber: {
            contains: query.search.trim(),
            mode: "insensitive",
          },
        },
      ];
    const orderBy =
      query.sort === "new_first"
        ? [
            { status: "asc" as const },
            { lastMessageAt: "desc" as const },
            { id: "desc" as const },
          ]
        : [{ lastMessageAt: "desc" as const }, { id: "desc" as const }];
    return this.listWithPagination(where, query, orderBy, "VENDOR");
  }

  async userDetail(user: AuthenticatedPrincipal, inquiryId: string) {
    const inquiry = await this.findDetail({ id: inquiryId, userId: user.sub });
    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { userReadAt: new Date() },
    });
    return { inquiry: this.mapDetail(inquiry, "USER") };
  }

  async vendorDetail(user: AuthenticatedPrincipal, inquiryId: string) {
    const vendor = await this.ownedVendor(user.sub);
    const inquiry = await this.findDetail({
      id: inquiryId,
      vendorId: vendor.id,
    });
    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { vendorReadAt: new Date() },
    });
    return { inquiry: this.mapDetail(inquiry, "VENDOR") };
  }

  async userMessage(
    user: AuthenticatedPrincipal,
    inquiryId: string,
    dto: InquiryMessageDto,
  ) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, userId: user.sub },
      include: {
        vendor: { select: { id: true, ownerUserId: true, status: true } },
      },
    });
    if (!inquiry) throw new NotFoundException("Inquiry not found");
    if (isTerminal(inquiry.status))
      throw new ConflictException("This inquiry is closed");
    if (inquiry.vendor.status === VendorStatus.SUSPENDED)
      throw new ConflictException(
        "This vendor is unavailable for new messages",
      );
    return this.createMessage(
      inquiry,
      InquiryMessageSenderType.USER,
      user.sub,
      dto.body,
      user.sub,
      undefined,
    );
  }

  async vendorMessage(
    user: AuthenticatedPrincipal,
    inquiryId: string,
    dto: InquiryMessageDto,
  ) {
    const vendor = await this.ownedVendor(user.sub);
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, vendorId: vendor.id },
      include: { vendor: { select: { id: true, status: true } } },
    });
    if (!inquiry) throw new NotFoundException("Inquiry not found");
    if (isTerminal(inquiry.status))
      throw new ConflictException("This inquiry is closed");
    if (vendor.status !== VendorStatus.APPROVED)
      throw new ConflictException("Vendor messaging is unavailable");
    return this.createMessage(
      inquiry,
      InquiryMessageSenderType.VENDOR,
      vendor.id,
      dto.body,
      inquiry.userId,
      vendor.id,
    );
  }

  async vendorStatus(
    user: AuthenticatedPrincipal,
    inquiryId: string,
    dto: InquiryStatusDto,
  ) {
    const vendor = await this.ownedVendor(user.sub);
    if (vendor.status !== VendorStatus.APPROVED)
      throw new ConflictException("Vendor status changes are unavailable");
    const current = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, vendorId: vendor.id },
      select: {
        id: true,
        status: true,
        version: true,
        userId: true,
        referenceNumber: true,
      },
    });
    if (!current) throw new NotFoundException("Inquiry not found");
    const toStatus = dto.status;
    assertTransition(current.status, toStatus);
    if (
      (toStatus === InquiryStatus.CLOSED ||
        toStatus === InquiryStatus.RESOLVED) &&
      !dto.reason?.trim() &&
      toStatus === InquiryStatus.CLOSED
    )
      throw new BadRequestException("A reason is required to close an inquiry");
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.inquiry.updateMany({
        where: {
          id: current.id,
          vendorId: vendor.id,
          version: current.version,
          status: current.status,
        },
        data: {
          status: toStatus,
          version: { increment: 1 },
          closedAt: toStatus === InquiryStatus.CLOSED ? now : undefined,
        },
      });
      if (updated.count !== 1)
        throw new ConflictException("Inquiry was updated by another request");
      await tx.inquiryStatusHistory.create({
        data: {
          inquiryId: current.id,
          fromStatus: current.status,
          toStatus,
          changedByVendorId: vendor.id,
          actorType: InquiryActorType.VENDOR,
          reason: dto.reason?.trim(),
        },
      });
      await tx.notification.create({
        data: {
          recipientType: NotificationRecipientType.USER,
          userId: current.userId,
          inquiryId: current.id,
          type: NotificationType.INQUIRY_STATUS_CHANGED,
          title: "Inquiry status updated",
          body: `${current.referenceNumber} is now ${toStatus}.`,
        },
      });
    });
    return { ok: true, status: toStatus };
  }

  async userWithdraw(
    user: AuthenticatedPrincipal,
    inquiryId: string,
    reason?: string,
  ) {
    return this.userTransition(
      user,
      inquiryId,
      InquiryStatus.WITHDRAWN,
      reason,
    );
  }
  async userClose(
    user: AuthenticatedPrincipal,
    inquiryId: string,
    reason?: string,
  ) {
    return this.userTransition(user, inquiryId, InquiryStatus.CLOSED, reason);
  }

  private async userTransition(
    user: AuthenticatedPrincipal,
    inquiryId: string,
    toStatus: InquiryStatus,
    reason?: string,
  ) {
    const current = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, userId: user.sub },
      select: {
        id: true,
        status: true,
        version: true,
        vendorId: true,
        referenceNumber: true,
      },
    });
    if (!current) throw new NotFoundException("Inquiry not found");
    if (
      toStatus === InquiryStatus.WITHDRAWN &&
      !canUserWithdraw(current.status)
    )
      throw new ConflictException("This inquiry cannot be withdrawn");
    if (toStatus === InquiryStatus.CLOSED && !canUserClose(current.status))
      throw new ConflictException("This inquiry cannot be closed");
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.inquiry.updateMany({
        where: {
          id: current.id,
          userId: user.sub,
          version: current.version,
          status: current.status,
        },
        data: {
          status: toStatus,
          version: { increment: 1 },
          withdrawnAt:
            toStatus === InquiryStatus.WITHDRAWN ? new Date() : undefined,
          closedAt: toStatus === InquiryStatus.CLOSED ? new Date() : undefined,
        },
      });
      if (result.count !== 1)
        throw new ConflictException("Inquiry was updated by another request");
      await tx.inquiryStatusHistory.create({
        data: {
          inquiryId: current.id,
          fromStatus: current.status,
          toStatus,
          changedByUserId: user.sub,
          actorType: InquiryActorType.USER,
          reason: reason?.trim(),
        },
      });
      const vendor = await tx.vendorProfile.findUnique({
        where: { id: current.vendorId },
        select: { ownerUserId: true },
      });
      if (vendor)
        await tx.notification.create({
          data: {
            recipientType: NotificationRecipientType.VENDOR,
            vendorId: current.vendorId,
            inquiryId: current.id,
            type: NotificationType.INQUIRY_WITHDRAWN,
            title: "Inquiry updated",
            body: `${current.referenceNumber} was ${toStatus.toLowerCase()}.`,
          },
        });
      return result;
    });
    return { ok: updated.count === 1, status: toStatus };
  }

  private async createMessage(
    inquiry: { id: string; referenceNumber: string; userId: string },
    senderType: InquiryMessageSenderType,
    senderId: string,
    body: string,
    recipientUserId?: string,
    recipientVendorId?: string,
  ) {
    const cleaned = body.trim();
    if (!cleaned) throw new BadRequestException("Message cannot be empty");
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inquiryMessage.create({
        data: {
          inquiryId: inquiry.id,
          senderType,
          senderUserId:
            senderType === InquiryMessageSenderType.USER ? senderId : undefined,
          senderVendorId:
            senderType === InquiryMessageSenderType.VENDOR
              ? senderId
              : undefined,
          body: cleaned,
        },
      });
      await tx.inquiry.update({
        where: { id: inquiry.id },
        data: { lastMessageAt: new Date(), version: { increment: 1 } },
      });
      if (recipientUserId)
        await tx.notification.create({
          data: {
            recipientType: NotificationRecipientType.USER,
            userId: recipientUserId,
            inquiryId: inquiry.id,
            type: NotificationType.INQUIRY_MESSAGE,
            title: "New inquiry message",
            body: `New message in ${inquiry.referenceNumber}.`,
          },
        });
      if (recipientVendorId)
        await tx.notification.create({
          data: {
            recipientType: NotificationRecipientType.VENDOR,
            vendorId: recipientVendorId,
            inquiryId: inquiry.id,
            type: NotificationType.INQUIRY_MESSAGE,
            title: "New inquiry message",
            body: `New message in ${inquiry.referenceNumber}.`,
          },
        });
      return created;
    });
    return {
      message: {
        id: message.id,
        senderType: message.senderType,
        body: message.body,
        createdAt: message.createdAt,
      },
    };
  }

  private async listWithPagination(
    where: Prisma.InquiryWhereInput,
    query: InquiryListQueryDto,
    orderBy: Prisma.InquiryOrderByWithRelationInput[],
    viewer: "USER" | "VENDOR",
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [totalItems, items] = await this.prisma.$transaction([
      this.prisma.inquiry.count({ where }),
      this.prisma.inquiry.findMany({
        where,
        select: inquiryListSelect,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const mapped = await Promise.all(
      items.map(async (item) => ({
        ...this.mapList(item),
        unreadMessageCount: await this.unreadCount(
          item.id,
          viewer,
          item.userReadAt,
          item.vendorReadAt,
        ),
      })),
    );
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    return {
      items: mapped,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  private async unreadCount(
    inquiryId: string,
    viewer: "USER" | "VENDOR",
    userReadAt: Date | null,
    vendorReadAt: Date | null,
  ) {
    return this.prisma.inquiryMessage.count({
      where: {
        inquiryId,
        senderType:
          viewer === "USER"
            ? InquiryMessageSenderType.VENDOR
            : InquiryMessageSenderType.USER,
        createdAt: {
          gt:
            viewer === "USER"
              ? (userReadAt ?? new Date(0))
              : (vendorReadAt ?? new Date(0)),
        },
      },
    });
  }

  private async findDetail(where: Prisma.InquiryWhereInput) {
    const result = await this.prisma.inquiry.findFirst({
      where,
      include: {
        vendor: {
          select: { id: true, slug: true, businessName: true, status: true },
        },
        category: {
          select: { id: true, name: true, slug: true, description: true },
        },
        serviceCity: {
          select: {
            id: true,
            name: true,
            slug: true,
            state: { select: { name: true, code: true } },
          },
        },
        messages: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 100,
          select: { id: true, senderType: true, body: true, createdAt: true },
        },
        statusHistory: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            fromStatus: true,
            toStatus: true,
            actorType: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });
    if (!result) throw new NotFoundException("Inquiry not found");
    return result;
  }

  private mapList(item: {
    id: string;
    referenceNumber: string;
    subject: string;
    status: InquiryStatus;
    lastMessageAt: Date;
    createdAt: Date;
    vendor: {
      id: string;
      slug: string | null;
      businessName: string | null;
      status: VendorStatus;
    };
  }) {
    return {
      id: item.id,
      referenceNumber: item.referenceNumber,
      subject: item.subject,
      status: item.status,
      vendor: {
        id: item.vendor.id,
        slug: item.vendor.slug ?? "",
        businessName: item.vendor.businessName ?? "Verified provider",
      },
      lastMessageAt: item.lastMessageAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }

  private mapDetail(
    item: Awaited<ReturnType<InquiriesService["findDetail"]>>,
    viewer: "USER" | "VENDOR",
  ) {
    const base = this.mapList(item);
    return {
      ...base,
      category: item.category,
      serviceCity: item.serviceCity
        ? {
            id: item.serviceCity.id,
            name: item.serviceCity.name,
            slug: item.serviceCity.slug,
            stateName: item.serviceCity.state.name,
            stateCode: item.serviceCity.state.code,
            stateSlug: item.serviceCity.state.code.toLowerCase(),
          }
        : null,
      messages: item.messages,
      statusHistory: item.statusHistory,
      unreadMessageCount: 0,
      actions: {
        canWithdraw: viewer === "USER" && canUserWithdraw(item.status),
        canClose:
          viewer === "USER"
            ? canUserClose(item.status)
            : item.status === InquiryStatus.RESOLVED,
        canMessage:
          !isTerminal(item.status) &&
          (viewer === "USER" || item.vendor.status === VendorStatus.APPROVED),
      },
      vendorAvailability:
        item.vendor.status === VendorStatus.SUSPENDED
          ? ("SUSPENDED" as const)
          : ("AVAILABLE" as const),
    };
  }

  private async createdView(id: string) {
    const item = await this.prisma.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        createdAt: true,
        vendor: { select: { id: true, slug: true, businessName: true } },
      },
    });
    if (!item) throw new NotFoundException("Inquiry not found");
    return {
      id: item.id,
      referenceNumber: item.referenceNumber,
      status: item.status,
      vendor: item.vendor,
      createdAt: item.createdAt,
    };
  }

  private async ownedVendor(userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { ownerUserId: userId },
      select: { id: true, ownerUserId: true, status: true },
    });
    if (!vendor) throw new ForbiddenException("Vendor account required");
    return vendor;
  }

  private async nextReferenceNumber(tx: Prisma.TransactionClient) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomBytes(4)
        .toString("base64url")
        .replace(/[^A-Z0-9]/gi, "")
        .slice(0, 6)
        .toUpperCase()
        .padEnd(6, "X");
      const referenceNumber = `SETU-${new Date().getFullYear()}-${suffix}`;
      const existing = await tx.inquiry.findUnique({
        where: { referenceNumber },
        select: { id: true },
      });
      if (!existing) return referenceNumber;
    }
    throw new ConflictException("Unable to create inquiry reference");
  }
}

function isPrismaConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
