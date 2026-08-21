import { AdminTwoFactorEncryptionService } from "./encryption.service";

describe("AdminTwoFactorEncryptionService", () => {
  const env = {
    values: {
      ADMIN_2FA_ENCRYPTION_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
    },
  } as never;

  it("encrypts and decrypts secrets", () => {
    const service = new AdminTwoFactorEncryptionService(env);
    const encrypted = service.encrypt("base32-secret");

    expect(encrypted).not.toContain("base32-secret");
    expect(service.decrypt(encrypted)).toBe("base32-secret");
  });

  it("rejects tampered ciphertext", () => {
    const service = new AdminTwoFactorEncryptionService(env);
    const encrypted = service.encrypt("base32-secret");
    const [iv, tag, ciphertext] = encrypted.split(".");
    const tamperedTag = `${tag.slice(0, -1)}${tag.endsWith("a") ? "b" : "a"}`;
    const tampered = [iv, tamperedTag, ciphertext].join(".");

    expect(() => service.decrypt(tampered)).toThrow();
  });
});
