import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateQuoteInterestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  service!: string;
}
