import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const PUBLIC_VENDOR_SORTS = [
  "relevance",
  "name_asc",
  "name_desc",
  "newest",
  "oldest",
] as const;

export type PublicVendorSort = (typeof PUBLIC_VENDOR_SORTS)[number];

export class PublicVendorQueryDto {
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;

  @IsOptional()
  @IsIn(PUBLIC_VENDOR_SORTS)
  sort: PublicVendorSort = "name_asc";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  yearEstablishedFrom?: number;
}

export class PublicCategorySlugDto {
  @IsString()
  @MaxLength(120)
  categorySlug!: string;
}

export class PublicCitySlugDto {
  @IsString()
  @MaxLength(120)
  stateSlug!: string;

  @IsString()
  @MaxLength(120)
  citySlug!: string;
}

export class PublicVendorSlugDto {
  @IsString()
  @MaxLength(180)
  vendorSlug!: string;
}

export function normalizeSearch(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || undefined;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
