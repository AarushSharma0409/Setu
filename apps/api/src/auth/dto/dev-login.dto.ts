import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";

export class DevLoginDto {
  @ValidateIf((value: DevLoginDto) => !value.phone)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ValidateIf((value: DevLoginDto) => !value.email)
  @IsString()
  @MinLength(8)
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
