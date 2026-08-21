import { Injectable } from "@nestjs/common";

import type {
  InsuranceProviderAdapter,
  ProviderHandoffInput,
  ProviderHandoffResult,
  ProviderHealthResult,
} from "./provider-adapter";

/**
 * Offline-only adapter used for deterministic local development and tests.
 * It is not an insurer or broker API implementation and never makes network calls.
 */
@Injectable()
export class SetuMockProviderAdapter implements InsuranceProviderAdapter {
  readonly providerCode = "SETU_MOCK";

  supportsQuoteRequest() {
    return false;
  }
  supportsPurchaseHandoff() {
    return true;
  }
  supportsCallbacks() {
    return false;
  }

  healthCheck(): Promise<ProviderHealthResult> {
    return Promise.resolve({
      status: "HEALTHY",
      checkedAt: new Date(),
      summary: "Offline mock adapter is available",
    });
  }

  createPurchaseHandoff(
    input: ProviderHandoffInput,
    baseUrl: string,
  ): Promise<ProviderHandoffResult> {
    const destination = new URL("/continue", baseUrl);
    destination.searchParams.set("state", input.stateToken);
    destination.searchParams.set("handoff", input.handoffReference);
    destination.searchParams.set("product", input.externalProductCode);
    return Promise.resolve({
      redirectUrl: destination.toString(),
      externalReference: `mock-${input.handoffReference}`,
    });
  }
}
