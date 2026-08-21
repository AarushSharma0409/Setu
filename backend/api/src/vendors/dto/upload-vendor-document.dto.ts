import { VendorDocumentType } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UploadVendorDocumentDto {
  @IsEnum(VendorDocumentType)
  type!: VendorDocumentType;
}
