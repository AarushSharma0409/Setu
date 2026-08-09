import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { redactForLog } from "../common/logging/redaction";
import { PrismaService } from "../database/prisma.service";

export interface AuditContext {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEntryInput {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: unknown;
  context?: AuditContext;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditEntryInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: sanitizeMetadata(input.metadata),
        requestId: input.context?.requestId,
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
      },
    });
  }

  async list(input: {
    page: number;
    pageSize: number;
    adminUserId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      adminUserId: input.adminUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      createdAt:
        input.from || input.to ? { gte: input.from, lte: input.to } : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          adminUser: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }
}

export function sanitizeMetadata(value: unknown): Prisma.InputJsonValue {
  const redacted = redactForLog(value);
  if (redacted === null) {
    return {};
  }

  if (
    typeof redacted === "string" ||
    typeof redacted === "number" ||
    typeof redacted === "boolean"
  ) {
    return redacted;
  }

  if (Array.isArray(redacted)) {
    return redacted.map((item) => sanitizeMetadata(item));
  }

  if (typeof redacted === "object") {
    const result: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, item] of Object.entries(redacted)) {
      result[key] = sanitizeMetadata(item);
    }
    return result;
  }

  return "[unserializable]";
}
