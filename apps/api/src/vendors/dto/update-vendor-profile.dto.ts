import {
  IsEmail,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Max,
  Min,
} from "class-validator";

export class UpdateVendorProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  businessName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  legalName?: string;

  @IsOptional()
  @IsString()
  @Length(20, 1000)
  description?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsPhoneNumber("IN")
  contactPhone?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  websiteUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  yearEstablished?: number;

  @IsOptional()
  @IsString()
  @Length(5, 180)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @Length(1, 180)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @Length(4, 12)
  postalCode?: string;

  @IsOptional()
  @IsUUID()
  primaryCityId?: string;
}
