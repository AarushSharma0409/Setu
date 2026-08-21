import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  it("verifies bcrypt passwords and does not store plaintext", async () => {
    const service = new PasswordService();
    const hash = await service.hash("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    expect(await service.verify("correct horse battery staple", hash)).toBe(
      true,
    );
    expect(await service.verify("wrong password", hash)).toBe(false);
  });
});
