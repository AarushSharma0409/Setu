import {
  InsurancePurchaseHandoffStatus,
  InsuranceQuoteRequestStatus,
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsBooleanString,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class OperationsWindowDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
}

export class OperationsListDto extends OperationsWindowDto {
  @IsOptional() @Type(() => Number) page?: number;
  @IsOptional() @Type(() => Number) pageSize?: number;
  @IsOptional() @IsString() @MaxLength(80) reference?: string;
}

export class QuoteOperationsListDto extends OperationsListDto {
  @IsOptional()
  @IsEnum(InsuranceQuoteRequestStatus)
  status?: InsuranceQuoteRequestStatus;
  @IsOptional() @IsBooleanString() hasFailures?: string;
}

export class HandoffOperationsListDto extends OperationsListDto {
  @IsOptional()
  @IsEnum(InsurancePurchaseHandoffStatus)
  status?: InsurancePurchaseHandoffStatus;
}

export class RemediationReasonDto {
  @IsString() @MinLength(3) @MaxLength(80) reasonCode!: string;
  @IsString() @MinLength(5) @MaxLength(500) reasonText!: string;
}

export class SupportSearchDto {
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
  @IsOptional() @IsString() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}

export class EvidenceLookupDto {
  @IsUUID() id!: string;
}
