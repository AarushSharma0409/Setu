import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VendorStatus } from "@prisma/client";

import {
  PublicVendorQueryDto,
  PublicVendorSort,
  slugify,
} from "./dto/public-discovery.dto";
import { PrismaService } from "../database/prisma.service";

export const publicVendorWhere: Prisma.VendorProfileWhereInput = {
  status: VendorStatus.APPROVED,
  businessName: { not: null },
  primaryCity: { is: { isActive: true, state: { isActive: true } } },
  categories: { some: { category: { isActive: true } } },
  serviceAreas: {
    some: { city: { isActive: true, state: { isActive: true } } },
  },
};

const publicVendorSelect = {
  id: true,
  slug: true,
  businessName: true,
  legalName: true,
  description: true,
  contactEmail: true,
  contactPhone: true,
  websiteUrl: true,
  yearEstablished: true,
  postalCode: true,
  reviewedAt: true,
  primaryCity: {
    select: {
      name: true,
      slug: true,
      state: { select: { name: true, code: true } },
    },
  },
  categories: {
    where: { category: { isActive: true } },
    orderBy: { category: { name: "asc" } },
    select: { category: { select: { name: true, slug: true } } },
  },
  serviceAreas: {
    where: { city: { isActive: true, state: { isActive: true } } },
    orderBy: { city: { name: "asc" } },
    select: {
      city: {
        select: {
          name: true,
          slug: true,
          state: { select: { name: true, code: true } },
        },
      },
    },
  },
} satisfies Prisma.VendorProfileSelect;

type PublicVendorRecord = Prisma.VendorProfileGetPayload<{
  select: typeof publicVendorSelect;
}>;

@Injectable()
export class PublicDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, slug: true, description: true },
    });
    return { categories };
  }

  async category(slug: string, query: Partial<PublicVendorQueryDto> = {}) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      select: { id: true, name: true, slug: true, description: true },
    });
    if (!category) throw new NotFoundException("Category not found");

    const result = await this.listVendors({ ...query, category: slug });
    return { category, ...result };
  }

  async listCities() {
    const cities = await this.prisma.city.findMany({
      where: { isActive: true, state: { isActive: true } },
      orderBy: [{ state: { name: "asc" } }, { name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        state: { select: { name: true, code: true } },
      },
    });
    return { cities: cities.map((city) => this.mapCity(city)) };
  }

  async city(
    stateSlug: string,
    citySlug: string,
    query: Partial<PublicVendorQueryDto> = {},
  ) {
    const city = await this.prisma.city.findFirst({
      where: {
        slug: citySlug,
        isActive: true,
        state: { code: stateSlug.toUpperCase(), isActive: true },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        state: { select: { name: true, code: true } },
      },
    });
    if (!city) throw new NotFoundException("City not found");

    const result = await this.listVendors({
      ...query,
      city: city.slug,
      state: city.state.code.toLowerCase(),
    });
    return {
      city: this.mapCity({
        id: city.id,
        name: city.name,
        slug: city.slug,
        state: city.state,
      }),
      ...result,
    };
  }

  async listVendors(query: Partial<PublicVendorQueryDto>) {
    const where = await this.buildVendorWhere(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const orderBy = this.orderBy(query.sort ?? "name_asc");
    const [totalItems, vendors] = await this.prisma.$transaction([
      this.prisma.vendorProfile.count({ where }),
      this.prisma.vendorProfile.findMany({
        where,
        select: publicVendorSelect,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    return {
      items: vendors.map((vendor) => this.mapSummary(vendor)),
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

  async vendor(slug: string) {
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { ...publicVendorWhere, slug },
      select: publicVendorSelect,
    });
    if (!vendor) throw new NotFoundException("Vendor not found");
    return { vendor: this.mapDetail(vendor) };
  }

  private async buildVendorWhere(
    query: Partial<PublicVendorQueryDto>,
  ): Promise<Prisma.VendorProfileWhereInput> {
    const where: Prisma.VendorProfileWhereInput = { ...publicVendorWhere };
    if (query.q) {
      const terms = query.q.split(" ").filter(Boolean);
      where.AND = terms.map((term) => ({
        OR: [
          { businessName: { contains: term, mode: "insensitive" } },
          { legalName: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          {
            categories: {
              some: {
                category: { name: { contains: term, mode: "insensitive" } },
              },
            },
          },
          {
            serviceAreas: {
              some: {
                city: { name: { contains: term, mode: "insensitive" } },
              },
            },
          },
        ],
      }));
    }
    if (query.category) {
      const category = await this.prisma.category.findFirst({
        where: { slug: query.category, isActive: true },
        select: { id: true },
      });
      if (!category) return { id: "__no_public_category__" };
      where.categories = { some: { categoryId: category.id } };
    }
    if (query.city || query.state) {
      const cityWhere: Prisma.CityWhereInput = {
        isActive: true,
        state: { isActive: true },
      };
      if (query.city) cityWhere.slug = query.city;
      if (query.state) {
        cityWhere.state = { isActive: true, code: query.state.toUpperCase() };
      }
      where.serviceAreas = { some: { city: cityWhere } };
    }
    if (query.yearEstablishedFrom) {
      where.yearEstablished = { gte: query.yearEstablishedFrom };
    }
    return where;
  }

  private orderBy(
    sort: PublicVendorSort,
  ): Prisma.VendorProfileOrderByWithRelationInput[] {
    if (sort === "name_desc") return [{ businessName: "desc" }, { id: "asc" }];
    if (sort === "newest") return [{ reviewedAt: "desc" }, { id: "asc" }];
    if (sort === "oldest") return [{ reviewedAt: "asc" }, { id: "asc" }];
    return [{ businessName: "asc" }, { id: "asc" }];
  }

  private mapCity(city: {
    id: string;
    name: string;
    slug: string;
    state: { name: string; code: string };
  }) {
    return {
      id: city.id,
      name: city.name,
      slug: city.slug,
      stateName: city.state.name,
      stateCode: city.state.code,
      stateSlug: slugify(city.state.name),
    };
  }

  private mapSummary(vendor: PublicVendorRecord) {
    return {
      id: vendor.id,
      slug: vendor.slug ?? "",
      businessName: vendor.businessName ?? "Verified provider",
      descriptionExcerpt: excerpt(vendor.description),
      primaryCity: this.mapCity({
        id: "",
        name: vendor.primaryCity?.name ?? "",
        slug: vendor.primaryCity?.slug ?? "",
        state: vendor.primaryCity?.state ?? { name: "", code: "" },
      }),
      categories: vendor.categories.map(({ category }) => category),
      serviceAreas: vendor.serviceAreas.map(({ city }) =>
        this.mapCity({ id: "", ...city }),
      ),
      yearEstablished: vendor.yearEstablished,
      websiteUrl: vendor.websiteUrl,
      verificationStatusLabel: "Verified" as const,
    };
  }

  private mapDetail(vendor: PublicVendorRecord) {
    return {
      ...this.mapSummary(vendor),
      legalName: vendor.legalName,
      description: vendor.description ?? "",
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      address: vendor.primaryCity
        ? {
            city: vendor.primaryCity.name,
            state: vendor.primaryCity.state.name,
            postalCode: vendor.postalCode,
          }
        : undefined,
      approvedAt: vendor.reviewedAt?.toISOString() ?? null,
      verificationBadge: { label: "Verified" as const },
    };
  }
}

function excerpt(description: string | null): string {
  const value = description?.trim() ?? "Verified service provider on Setu.";
  return value.length > 180 ? `${value.slice(0, 177).trimEnd()}...` : value;
}
