import { IsOptional, IsUUID } from "class-validator";

export class ListCitiesDto {
  @IsOptional()
  @IsUUID()
  stateId?: string;
}
