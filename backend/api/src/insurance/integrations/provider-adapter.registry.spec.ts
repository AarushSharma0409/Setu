import { ProviderAdapterRegistry } from "./provider-adapter.registry";
import { SetuMockProviderAdapter } from "./setu-mock-provider.adapter";

describe("ProviderAdapterRegistry", () => {
  it("uses explicit registration and rejects unknown providers", () => {
    const registry = new ProviderAdapterRegistry();
    const adapter = new SetuMockProviderAdapter();
    registry.register(adapter);
    expect(registry.get("SETU_MOCK")).toBe(adapter);
    expect(() => registry.get("UNAPPROVED_PROVIDER")).toThrow("not available");
  });
});
