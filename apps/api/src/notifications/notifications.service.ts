import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationRecipientType, NotificationType } from "@prisma/client";

import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(principal: AuthenticatedPrincipal, page = 1, pageSize = 20) {
    const where = this.recipientWhere(principal);
    const [totalItems, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          inquiryId: true,
          readAt: true,
          createdAt: true,
        },
      }),
    ]);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    return {
      items: notifications,
      unreadCount: await this.prisma.notification.count({
        where: { ...where, readAt: null },
      }),
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

  async unreadCount(principal: AuthenticatedPrincipal) {
    return {
      unreadCount: await this.prisma.notification.count({
        where: { ...this.recipientWhere(principal), readAt: null },
      }),
    };
  }

  async markRead(principal: AuthenticatedPrincipal, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, ...this.recipientWhere(principal) },
      data: { readAt: new Date() },
    });
    if (result.count !== 1)
      throw new NotFoundException("Notification not found");
    return { ok: true };
  }

  async markAllRead(principal: AuthenticatedPrincipal) {
    await this.prisma.notification.updateMany({
      where: { ...this.recipientWhere(principal), readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async createForUser(input: {
    userId: string;
    inquiryId: string;
    type: NotificationType;
    title: string;
    body: string;
  }) {
    return this.prisma.notification.create({
      data: {
        recipientType: NotificationRecipientType.USER,
        userId: input.userId,
        inquiryId: input.inquiryId,
        type: input.type,
        title: input.title,
        body: input.body,
      },
    });
  }

  async createForVendor(input: {
    vendorId: string;
    inquiryId: string;
    type: NotificationType;
    title: string;
    body: string;
  }) {
    return this.prisma.notification.create({
      data: {
        recipientType: NotificationRecipientType.VENDOR,
        vendorId: input.vendorId,
        inquiryId: input.inquiryId,
        type: input.type,
        title: input.title,
        body: input.body,
      },
    });
  }

  private recipientWhere(principal: AuthenticatedPrincipal) {
    if (principal.role === "VENDOR")
      return {
        vendorId: { not: null },
        vendor: { ownerUserId: principal.sub },
      };
    return { userId: principal.sub };
  }
}
