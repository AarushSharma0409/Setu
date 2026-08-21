import {
  InsuranceAddonStatus,
  InsuranceAvailabilityScope,
  InsuranceAvailabilityType,
  InsuranceCoverageType,
  InsuranceDeductibleType,
  InsuranceDurationUnit,
  InsuranceEligibilityOperator,
  InsuranceEligibilityRuleType,
  InsurancePremiumBasisType,
  InsurancePremiumImpactType,
  InsuranceProductDocumentType,
  InsuranceProductStatus,
  InsuranceProductVersionStatus,
  InsuranceWaitingPeriodType,
} from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class ProductListDto {
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsUUID("4") organizationId?: string;
  @IsOptional() @IsUUID("4") policyTypeId?: string;
  @IsOptional() @IsEnum(InsuranceProductStatus) status?: InsuranceProductStatus;
  @IsOptional()
  @IsEnum(InsuranceProductVersionStatus)
  versionStatus?: InsuranceProductVersionStatus;
  @IsOptional() @IsEnum(["updatedAt", "createdAt", "name"] as const) sort =
    "updatedAt";
  @IsOptional() @IsEnum(["asc", "desc"] as const) direction: "asc" | "desc" =
    "desc";
}

export class CreateProductDto {
  @IsUUID("4") organizationId!: string;
  @IsUUID("4") policyTypeId!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) code!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shortDescription!: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  longDescription?: string;
}

export class UpdateProductVersionDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shortDescription?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  longDescription?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  coverageSummary?: string;
  @IsOptional()
  @IsEnum(InsuranceAvailabilityScope)
  availabilityScope?: InsuranceAvailabilityScope;
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsDateString() effectiveUntil?: string;
}

export class CoverageDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) code!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000)
  description!: string;
  @IsEnum(InsuranceCoverageType) coverageType!: InsuranceCoverageType;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  limitDescription?: string;
  @IsOptional() @IsBoolean() isCore = false;
  @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class EligibilityRuleDto {
  @IsEnum(InsuranceEligibilityRuleType) ruleType!: InsuranceEligibilityRuleType;
  @IsEnum(InsuranceEligibilityOperator) operator!: InsuranceEligibilityOperator;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(500) value!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(30) unit?: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1_000)
  description!: string;
  @IsOptional() @IsBoolean() isHardRule = true;
  @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class SumInsuredDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount!: number;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(3) currency = "INR";
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) label?: string;
  @IsOptional() @IsBoolean() isDefault = false;
  @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class PremiumBasisDto {
  @IsEnum(InsurancePremiumBasisType) basisType!: InsurancePremiumBasisType;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2_000)
  description!: string;
  @IsOptional() @IsObject() metadata: Record<
    string,
    string | number | boolean
  > = {};
}

export class WaitingPeriodDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) code!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000)
  description!: string;
  @IsEnum(InsuranceWaitingPeriodType) type!: InsuranceWaitingPeriodType;
  @Type(() => Number) @IsInt() @Min(1) durationValue!: number;
  @IsEnum(InsuranceDurationUnit) durationUnit!: InsuranceDurationUnit;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(500) appliesTo?: string;
  @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class ExclusionDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) code!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000)
  description!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) category?: string;
  @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class AddonDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) code!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000)
  description!: string;
  @IsOptional() @IsEnum(InsuranceAddonStatus) status =
    InsuranceAddonStatus.ACTIVE;
  @IsEnum(InsurancePremiumImpactType)
  premiumImpactType!: InsurancePremiumImpactType;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  premiumImpactDescription?: string;
  @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class DeductibleDto {
  @IsEnum(InsuranceDeductibleType) type!: InsuranceDeductibleType;
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  percentage?: number;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2_000)
  description!: string;
  @IsOptional() @IsBoolean() isOptional = false;
  @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class AvailabilityDto {
  @IsOptional() @IsUUID("4") stateId?: string;
  @IsOptional() @IsUUID("4") cityId?: string;
  @IsEnum(InsuranceAvailabilityType)
  availabilityType!: InsuranceAvailabilityType;
}

export class ReplaceCollectionDto<T> {
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) items!: T[];
}

export class CatalogueUpdateDto {
  @IsOptional() @IsArray() coverages?: CoverageDto[];
  @IsOptional() @IsArray() eligibilityRules?: EligibilityRuleDto[];
  @IsOptional() @IsArray() sumInsuredOptions?: SumInsuredDto[];
  @IsOptional() premiumBasis?: PremiumBasisDto;
  @IsOptional() @IsArray() waitingPeriods?: WaitingPeriodDto[];
  @IsOptional() @IsArray() exclusions?: ExclusionDto[];
  @IsOptional() @IsArray() addons?: AddonDto[];
  @IsOptional() @IsArray() deductibles?: DeductibleDto[];
  @IsOptional() @IsArray() availability?: AvailabilityDto[];
}

export class RejectVersionDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(2_000) reason!: string;
}

export class WithdrawProductDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(2_000) reason!: string;
}

export class UploadProductDocumentDto {
  @IsEnum(InsuranceProductDocumentType) type!: InsuranceProductDocumentType;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(180) title!: string;
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsDateString() effectiveUntil?: string;
}
