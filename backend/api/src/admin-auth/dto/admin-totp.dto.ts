import { Transform } from "class-transformer";
import { IsString, Matches, MinLength } from "class-validator";

export class AdminTwoFactorChallengeDto {
  @IsString()
  @MinLength(20)
  challengeToken!: string;
}

export class AdminTwoFactorVerifyDto extends AdminTwoFactorChallengeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.replace(/\s/g, "") : value,
  )
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class AdminTwoFactorEnrollmentConfirmDto extends AdminTwoFactorVerifyDto {}

export class AdminRecoveryCodeDto extends AdminTwoFactorChallengeDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{4,8}(?:-[A-Za-z0-9]{4,8})?$/)
  code!: string;
}
