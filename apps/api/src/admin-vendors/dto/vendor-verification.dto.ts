import { VendorStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class VendorVerificationQueueQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsDateString()
  submittedFrom?: string;

  @IsOptional()
  @IsDateString()
  submittedTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["oldest", "newest", "businessName"])
  sort: "oldest" | "newest" | "businessName" = "oldest";
}

export class ApproveVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class RejectVendorDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class SuspendVendorDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;

  @IsOptional()
  @IsUUID()
  adminUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
