import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { CreateCategoryDto, CreateCityDto, CreateStateDto, SetCatalogStatusDto } from "./dto/admin-catalog.dto";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async overview() {
    const [categories, states, cities] = await this.prisma.$transaction([
      this.prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      this.prisma.state.findMany({ orderBy: { name: "asc" } }),
      this.prisma.city.findMany({ orderBy: [{ state: { name: "asc" } }, { name: "asc" }], include: { state: { select: { name: true, code: true } } } }),
    ]);
    return { categories, states, cities };
  }
  async createCategory(actorId: string, dto: CreateCategoryDto) {
    const slug = slugify(dto.name); if (!slug) throw new ConflictException("Category name is not valid");
    if (await this.prisma.category.findUnique({ where: { slug } })) throw new ConflictException("A category with this name already exists");
    const item = await this.prisma.category.create({ data: { name: dto.name.trim(), slug, description: clean(dto.description), sortOrder: dto.sortOrder ?? 0 } });
    await this.audit.record({ adminUserId: actorId, action: "CATALOG_CATEGORY_CREATED", entityType: "Category", entityId: item.id }); return item;
  }
  async createState(actorId: string, dto: CreateStateDto) {
    const code = dto.code.trim().toUpperCase(); if (await this.prisma.state.findUnique({ where: { code } })) throw new ConflictException("A state with this code already exists");
    const item = await this.prisma.state.create({ data: { name: dto.name.trim(), code } }); await this.audit.record({ adminUserId: actorId, action: "CATALOG_STATE_CREATED", entityType: "State", entityId: item.id }); return item;
  }
  async createCity(actorId: string, dto: CreateCityDto) {
    if (!(await this.prisma.state.findUnique({ where: { id: dto.stateId } }))) throw new NotFoundException("State not found");
    const slug = slugify(dto.name); if (!slug) throw new ConflictException("City name is not valid");
    if (await this.prisma.city.findUnique({ where: { stateId_slug: { stateId: dto.stateId, slug } } })) throw new ConflictException("A city with this name already exists in this state");
    const item = await this.prisma.city.create({ data: { stateId: dto.stateId, name: dto.name.trim(), slug } }); await this.audit.record({ adminUserId: actorId, action: "CATALOG_CITY_CREATED", entityType: "City", entityId: item.id }); return item;
  }
  async setCategoryStatus(actorId: string, id: string, dto: SetCatalogStatusDto) { const item = await this.prisma.category.update({ where: { id }, data: { isActive: dto.isActive } }).catch(() => { throw new NotFoundException("Category not found"); }); await this.audit.record({ adminUserId: actorId, action: "CATALOG_CATEGORY_STATUS_CHANGED", entityType: "Category", entityId: id, metadata: dto }); return item; }
  async setCityStatus(actorId: string, id: string, dto: SetCatalogStatusDto) { const item = await this.prisma.city.update({ where: { id }, data: { isActive: dto.isActive } }).catch(() => { throw new NotFoundException("City not found"); }); await this.audit.record({ adminUserId: actorId, action: "CATALOG_CITY_STATUS_CHANGED", entityType: "City", entityId: id, metadata: dto }); return item; }
}
function slugify(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function clean(value: string | undefined) { const trimmed = value?.trim(); return trimmed || undefined; }
