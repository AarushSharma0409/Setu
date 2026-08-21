import { Injectable } from "@nestjs/common";

import {
  type InsuranceProviderAdapter,
  unsupportedProvider,
} from "./provider-adapter";

@Injectable()
export class ProviderAdapterRegistry {
  private readonly adapters = new Map<string, InsuranceProviderAdapter>();

  register(adapter: InsuranceProviderAdapter) {
    this.adapters.set(adapter.providerCode, adapter);
  }

  get(providerCode: string): InsuranceProviderAdapter {
    return this.adapters.get(providerCode) ?? unsupportedProvider(providerCode);
  }
}
