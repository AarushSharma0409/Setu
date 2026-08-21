import { BadRequestException } from "@nestjs/common";

export interface ProviderHealthResult {
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  checkedAt: Date;
  summary: string;
}

export interface ProviderHandoffInput {
  handoffReference: string;
  stateToken: string;
  externalProductCode: string;
  quoteReference: string;
}

export interface ProviderHandoffResult {
  redirectUrl: string;
  externalReference: string;
  expiresAt?: Date;
}

/** A provider adapter owns every provider-specific mapping and protocol detail. */
export interface InsuranceProviderAdapter {
  readonly providerCode: string;
  supportsQuoteRequest(): boolean;
  supportsPurchaseHandoff(): boolean;
  supportsCallbacks(): boolean;
  healthCheck(): Promise<ProviderHealthResult>;
  createPurchaseHandoff(
    input: ProviderHandoffInput,
    baseUrl: string,
  ): Promise<ProviderHandoffResult>;
}

export function unsupportedProvider(code: string): never {
  throw new BadRequestException(`Provider adapter ${code} is not available`);
}
