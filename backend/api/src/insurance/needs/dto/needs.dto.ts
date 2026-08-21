import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateAssessmentDto {
  @IsUUID("4") policyTypeId!: string;
  @IsOptional() @IsBoolean() abandonExisting = false;
}
export class AnswerItemDto {
  @IsUUID("4") questionId!: string;
  value!: unknown;
}
export class SaveAnswersDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(80) sectionKey!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
  @IsOptional() @Type(() => Number) version?: number;
}
export class WithdrawAssessmentDto {
  @Transform(trim) @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
