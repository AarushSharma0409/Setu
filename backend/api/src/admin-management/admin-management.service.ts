import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AccountStatus, AdminRole } from "@prisma/client";

import { CreateAdminUserDto, SetAdminPasswordDto, UpdateAdminUserDto } from "./dto/admin-management.dto";
import { adminView } from "../admin-auth/admin-auth.service";
import { AuditService } from "../audit/audit.service";
import { PasswordService } from "../auth/password.service";
import { SessionService } from "../auth/session.service";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AdminManagementService {
  constructor(private readonly prisma: PrismaService, private readonly passwords: PasswordService, private readonly sessions: SessionService, private readonly audit: AuditService) {}

  async list() {
    const items = await this.prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, email: true, role: true, status: true, twoFactorEnabled: true, lastLoginAt: true, createdAt: true } });
    return { items };
  }

  async create(actorId: string, dto: CreateAdminUserDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.adminUser.findUnique({ where: { email } })) throw new ConflictException("An administrator with this email already exists");
    const admin = await this.prisma.adminUser.create({ data: { email, passwordHash: await this.passwords.hash(dto.password), role: dto.role, status: AccountStatus.ACTIVE, twoFactorEnabled: false } });
    await this.audit.record({ adminUserId: actorId, action: "ADMIN_USER_CREATED", entityType: "AdminUser", entityId: admin.id, metadata: { role: admin.role } });
    return { admin: adminView(admin) };
  }

  async update(actorId: string, targetId: string, dto: UpdateAdminUserDto) {
    const target = await this.prisma.adminUser.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException("Administrator not found");
    if (target.id === actorId && (dto.role || dto.status === AccountStatus.DISABLED)) throw new ConflictException("You cannot change your own access level or disable your own account");
    if (target.role === AdminRole.SUPER_ADMIN && (dto.role || dto.status === AccountStatus.DISABLED)) {
      const remaining = await this.prisma.adminUser.count({ where: { role: AdminRole.SUPER_ADMIN, status: AccountStatus.ACTIVE, id: { not: target.id } } });
      if (!remaining) throw new ConflictException("Set up another active super administrator before changing this account");
    }
    const admin = await this.prisma.adminUser.update({ where: { id: targetId }, data: { role: dto.role, status: dto.status } });
    if (dto.status && dto.status !== AccountStatus.ACTIVE) await this.sessions.revokeAllForAdmin(targetId);
    await this.audit.record({ adminUserId: actorId, action: "ADMIN_USER_UPDATED", entityType: "AdminUser", entityId: targetId, metadata: { role: dto.role, status: dto.status } });
    return { admin: adminView(admin) };
  }

  async setPassword(actorId: string, targetId: string, dto: SetAdminPasswordDto) {
    const target = await this.prisma.adminUser.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException("Administrator not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({ where: { id: targetId }, data: { passwordHash: await this.passwords.hash(dto.password), failedLoginCount: 0, lockedUntil: null } });
      await this.sessions.revokeAllForAdmin(targetId, tx);
      await this.audit.record({ adminUserId: actorId, action: "ADMIN_PASSWORD_RESET", entityType: "AdminUser", entityId: targetId }, tx);
    });
    return { ok: true };
  }
}
