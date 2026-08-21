import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const indianMobilePattern = /^(?:\+91|91)?[6-9]\d{9}$/;

export class RequestPhoneOtpDto {
  @IsString()
  @Matches(indianMobilePattern, {
    message: "phone must be a valid 10-digit Indian mobile number",
  })
  phone!: string;
}

export class VerifyPhoneOtpDto extends RequestPhoneOtpDto {
  @IsString()
  @Matches(/^\d{4,8}$/, { message: "otp must contain only digits" })
  otp!: string;

  @IsBoolean()
  createAccount!: boolean;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}
