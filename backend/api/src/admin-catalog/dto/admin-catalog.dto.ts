import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class CreateCategoryDto {
  @IsString() @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}
export class CreateStateDto { @IsString() @MaxLength(80) name!: string; @IsString() @MaxLength(10) code!: string; }
export class CreateCityDto { @IsUUID() stateId!: string; @IsString() @MaxLength(100) name!: string; }
export class SetCatalogStatusDto { @IsBoolean() isActive!: boolean; }
