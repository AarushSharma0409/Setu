import { AccountStatus, AdminRole } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from "class-validator";

const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).{12,}$/;

export class CreateAdminUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(12) @Matches(passwordRule, { message: "Password must contain at least one letter and one number" }) password!: string;
  @IsEnum(AdminRole) role!: AdminRole;
}

export class UpdateAdminUserDto {
  @IsOptional() @IsEnum(AdminRole) role?: AdminRole;
  @IsOptional() @IsEnum(AccountStatus) status?: AccountStatus;
}

export class SetAdminPasswordDto {
  @IsString() @MinLength(12) @Matches(passwordRule, { message: "Password must contain at least one letter and one number" }) password!: string;
}
