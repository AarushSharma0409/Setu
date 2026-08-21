import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class RateCardEntryDto {
  @IsOptional() @IsInt() @Min(0) ageMin?: number;
  @IsOptional() @IsInt() @Min(0) ageMax?: number;
  @IsOptional() @IsString() sumInsured?: string;
  @IsOptional() @IsInt() @Min(1) policyTerm?: number;
  @IsString() basePremium!: string;
  @IsOptional() @IsString() addonPremium?: string;
  @IsOptional() @IsString() deductibleAdjustment?: string;
  @IsOptional() @IsString() otherAdjustments?: string;
  @IsOptional() @IsString() taxAmount?: string;
  @IsOptional() @IsString() @MaxLength(80) memberConfiguration?: string;
  @IsOptional() @IsString() @MaxLength(80) locationClass?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class CreateRateCardDto {
  @IsUUID() organizationId!: string;
  @IsUUID() productId!: string;
  @IsUUID() productVersionId!: string;
  @IsString() @MaxLength(140) name!: string;
  @IsInt() @Min(1) version!: number;
  @IsDateString() effectiveFrom!: string;
  @IsOptional() @IsDateString() effectiveUntil?: string;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RateCardEntryDto)
  entries!: RateCardEntryDto[];
}
