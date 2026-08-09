import { BadRequestException } from "@nestjs/common";

import {
  sameTrustedProviderHost,
  trustedProviderUrl,
} from "./provider-url.security";

describe("provider URL security", () => {
  it("accepts a public HTTPS provider host", () => {
    expect(
      trustedProviderUrl("https://sandbox.provider.example/api").hostname,
    ).toBe("sandbox.provider.example");
  });

  it.each([
    "http://provider.example",
    "https://localhost/test",
    "https://127.0.0.1/test",
    "https://10.0.0.1/test",
    "https://100.64.0.1/test",
    "https://169.254.169.254/latest/meta-data",
    "https://172.16.0.1/test",
    "https://192.168.0.1/test",
    "https://[::1]/test",
    "https://[fd00::1]/test",
    "file:///etc/passwd",
    "ftp://provider.example",
    "https://user:pass@provider.example",
  ])("rejects unsafe destination %s", (value) => {
    expect(() => trustedProviderUrl(value)).toThrow(BadRequestException);
  });

  it("rejects an adapter redirect to another host", () => {
    expect(() =>
      sameTrustedProviderHost(
        "https://provider.example",
        "https://attacker.example/continue",
      ),
    ).toThrow(BadRequestException);
  });
});
