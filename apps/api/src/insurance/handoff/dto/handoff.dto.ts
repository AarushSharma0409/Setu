import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateHandoffDto {
  @IsOptional() @IsString() @MaxLength(128) idempotencyKey?: string;
}
