import { IsUUID, MaxLength } from "class-validator";

export class CreateQuoteRequestDto {
  @IsUUID()
  assessmentId!: string;
}

export class RecalculateQuoteRequestDto {
  @IsUUID()
  assessmentId!: string;

  @IsUUID()
  recalculationOfQuoteRequestId!: string;
}

export class QuoteRequestListDto {
  @MaxLength(64)
  cursor?: string;
}
