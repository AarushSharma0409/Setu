import { hasAllowedExtension, hasExpectedSignature } from "./vendors.service";

describe("vendor document security", () => {
  it("requires an extension matching the allowlisted MIME type", () => {
    expect(hasAllowedExtension("identity.pdf", "application/pdf")).toBe(true);
    expect(hasAllowedExtension("identity.html", "application/pdf")).toBe(false);
    expect(hasAllowedExtension("identity.svg", "image/png")).toBe(false);
  });

  it("checks file signatures instead of trusting MIME metadata", () => {
    expect(
      hasExpectedSignature(Buffer.from("%PDF-1.7"), "application/pdf"),
    ).toBe(true);
    expect(
      hasExpectedSignature(Buffer.from("not a pdf"), "application/pdf"),
    ).toBe(false);
    expect(
      hasExpectedSignature(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
    ).toBe(true);
  });
});
