import { IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  @MaxLength(320)
  identifier!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
