import {
  InsuranceIntegrationEnvironment,
  InsuranceIntegrationProviderType,
  InsuranceProviderAuthType,
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateIntegrationDto {
  @IsUUID() organizationId!: string;
  @Matches(/^[A-Z][A-Z0-9_]{2,48}$/) code!: string;
  @IsString() name!: string;
  @IsEnum(InsuranceIntegrationProviderType)
  type!: InsuranceIntegrationProviderType;
  @IsEnum(InsuranceIntegrationEnvironment)
  environment!: InsuranceIntegrationEnvironment;
  @IsEnum(InsuranceProviderAuthType) authType!: InsuranceProviderAuthType;
  @IsUrl({ protocols: ["https"], require_protocol: true })
  baseUrlReference!: string;
  @IsOptional() @IsString() secretReference?: string;
  @IsOptional() @IsString() credentialVersion?: string;
  @Type(() => Number) @IsInt() @Min(500) @Max(60_000) timeoutMs!: number;
  @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) capabilities!: string[];
}

export class UpdateIntegrationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  baseUrlReference?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(500)
  @Max(60_000)
  timeoutMs?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  capabilities?: string[];
  @IsOptional() @IsString() credentialVersion?: string;
}

export class RotateCredentialReferenceDto {
  @IsString() secretReference!: string;
  @IsOptional() @IsString() credentialVersion?: string;
}

export class CreateProductMappingDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsUUID() productVersionId?: string;
  @IsString() externalProductCode!: string;
  @IsOptional() @IsString() externalPlanCode?: string;
  @IsOptional() @IsString() externalVariantCode?: string;
  @IsISO8601() effectiveFrom!: string;
  @IsOptional() @IsISO8601() effectiveUntil?: string;
}
