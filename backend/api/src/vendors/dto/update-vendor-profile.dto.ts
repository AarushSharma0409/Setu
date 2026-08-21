import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
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
  @Matches(/^(?:\+91)?[6-9]\d{9}$/, {
    message: "contactPhone must be a valid 10-digit Indian mobile number",
  })
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
  @Matches(/^[1-9][0-9]{5}$/)
  postalCode?: string;

  @IsOptional()
  @IsUUID()
  primaryCityId?: string;
}
