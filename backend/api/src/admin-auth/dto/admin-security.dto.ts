import { IsString, Matches, MinLength } from "class-validator";

const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).{12,}$/;

export class ChangeAdminPasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @MinLength(12) @Matches(passwordRule, { message: "Password must contain at least one letter and one number" }) newPassword!: string;
}

export class RegenerateRecoveryCodesDto {
  @IsString() code!: string;
}
