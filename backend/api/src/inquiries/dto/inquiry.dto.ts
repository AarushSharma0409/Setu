import { Type } from "class-transformer";
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from "class-validator";

export const INQUIRY_STATUSES = [
  "NEW",
  "VIEWED",
  "CONTACTED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "WITHDRAWN",
] as const;

export class CreateInquiryDto {
  @IsUUID()
  vendorId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(160)
  @Matches(/\S/)
  subject!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  @Matches(/\S/)
  message!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  serviceCityId?: string;

  @IsOptional()
  @IsIn(["PLATFORM", "PHONE", "EMAIL"])
  preferredContactMethod?: string;
}

export class InquiryListQueryDto {
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
  @IsEnum({
    NEW: "NEW",
    VIEWED: "VIEWED",
    CONTACTED: "CONTACTED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
    WITHDRAWN: "WITHDRAWN",
  })
  status?: (typeof INQUIRY_STATUSES)[number];

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["activity_desc", "new_first", "created_desc"])
  sort: "activity_desc" | "new_first" | "created_desc" = "activity_desc";
}

export class InquiryMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Matches(/\S/)
  body!: string;
}

export class InquiryStatusDto {
  @IsEnum({
    NEW: "NEW",
    VIEWED: "VIEWED",
    CONTACTED: "CONTACTED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
    WITHDRAWN: "WITHDRAWN",
  })
  status!: (typeof INQUIRY_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class InquiryActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
