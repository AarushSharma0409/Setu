import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
} from "class-validator";

export class ReplaceVendorServiceAreasDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  cityIds!: string[];

  @IsOptional()
  @IsUUID()
  primaryCityId?: string;
}
