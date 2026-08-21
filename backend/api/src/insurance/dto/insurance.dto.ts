import {
  InsuranceCapability,
  InsuranceConsentPurpose,
  InsuranceDisclosureAudience,
  InsuranceDisclosurePurpose,
  InsuranceDocumentType,
  InsuranceOperatingRole,
  InsuranceOrganizationType,
} from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;
const trimArray = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((item: unknown) =>
        typeof item === "string" ? item.trim() : item,
      )
    : value;

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class CreateOperatingModelDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  legalEntityName!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(180)
  tradeName?: string;

  @IsEnum(InsuranceOperatingRole)
  operatingRole!: InsuranceOperatingRole;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenceNumber!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  licenceAuthority!: string;

  @IsOptional()
  @IsDateString()
  licenceIssuedAt?: string;

  @IsDateString()
  licenceValidFrom!: string;

  @IsOptional()
  @IsDateString()
  licenceValidUntil?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  countryCode = "IN";

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  primaryJurisdiction!: string;

  @Transform(trimArray)
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  permittedInsuranceLines: string[] = [];

  @Transform(trimArray)
  @IsArray()
  @ArrayMaxSize(10)
  @IsEnum(InsuranceOrganizationType, { each: true })
  permittedOrganizationTypes: InsuranceOrganizationType[] = [];

  @IsArray()
  @ArrayMaxSize(30)
  @IsEnum(InsuranceCapability, { each: true })
  permittedCapabilities: InsuranceCapability[] = [];

  @IsArray()
  @ArrayMaxSize(30)
  @IsEnum(InsuranceCapability, { each: true })
  restrictedCapabilities: InsuranceCapability[] = [];
}

export class UpdateOperatingModelDto extends CreateOperatingModelDto {}

export class CreateOrganizationDto {
  @IsEnum(InsuranceOrganizationType)
  type!: InsuranceOrganizationType;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  legalName!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(180)
  tradeName?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  registrationNumber!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  regulatoryAuthority!: string;

  @IsOptional()
  @IsDateString()
  registrationValidFrom?: string;

  @IsOptional()
  @IsDateString()
  registrationValidUntil?: string;

  @Transform(trim)
  @IsOptional()
  @IsUrl({ require_tld: false })
  websiteUrl?: string;

  @Transform(trim)
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  supportPhone?: string;

  @Transform(trim)
  @IsOptional()
  @IsEmail()
  grievanceEmail?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  grievancePhone?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  registeredAddress?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  countryCode = "IN";

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  primaryJurisdiction!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID("4", { each: true })
  insuranceLineIds: string[] = [];
}

export class UpdateOrganizationDto extends CreateOrganizationDto {}

export class OrganizationListDto extends PaginationDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(InsuranceOrganizationType)
  type?: InsuranceOrganizationType;

  @Transform(trim)
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID("4")
  insuranceLineId?: string;

  @Transform(({ value }: { value: unknown }) => value === "true")
  @IsOptional()
  @IsBoolean()
  expiringSoon?: boolean;
}

export class DecisionDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class UploadInsuranceDocumentDto {
  @IsEnum(InsuranceDocumentType)
  type!: InsuranceDocumentType;

  @IsOptional()
  @IsUUID("4")
  licenceId?: string;
}

export class CreateLicenceDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  type!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenceNumber!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  authority!: string;

  @IsDateString()
  validFrom!: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @Transform(trimArray)
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  permittedLineCodes: string[] = [];

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  scope?: string;
}

export class UpdateLicenceDto extends CreateLicenceDto {}

export class CreatePolicyTypeDto {
  @IsUUID("4")
  insuranceLineId!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  code!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder = 0;
}

export class UpdatePolicyTypeDto extends CreatePolicyTypeDto {}

export class CreateDisclosureDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsEnum(InsuranceDisclosureAudience)
  audience!: InsuranceDisclosureAudience;

  @IsEnum(InsuranceDisclosurePurpose)
  purpose!: InsuranceDisclosurePurpose;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  content!: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @IsOptional()
  @IsBoolean()
  requiresAcknowledgement = false;
}

export class UpdateDisclosureDto extends CreateDisclosureDto {}

export class CreateConsentTemplateDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsEnum(InsuranceConsentPurpose)
  purpose!: InsuranceConsentPurpose;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Transform(trimArray)
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  dataCategories: string[] = [];

  @Transform(trimArray)
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  processingPurposes: string[] = [];

  @Transform(trimArray)
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  thirdPartyCategories: string[] = [];

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  retentionReference?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  withdrawalDescription?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50_000)
  content!: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;
}

export class UpdateConsentTemplateDto extends CreateConsentTemplateDto {}
