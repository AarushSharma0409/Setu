import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class ReplaceVendorCategoriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsUUID(undefined, { each: true })
  categoryIds!: string[];
}
