import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class SensitiveAnswerCryptoService {
  private readonly key: Buffer;

  constructor(env: EnvService) {
    this.key = Buffer.from(
      env.values.INSURANCE_SENSITIVE_DATA_ENCRYPTION_KEY,
      "base64",
    );
    if (this.key.length !== 32)
      throw new Error(
        "Insurance sensitive-data key must be a 32-byte base64 value",
      );
  }

  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    return [iv, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString("base64url"))
      .join(".");
  }

  decrypt(value: string) {
    const [ivValue, tagValue, bodyValue] = value.split(".");
    if (!ivValue || !tagValue || !bodyValue)
      throw new Error("Invalid sensitive answer envelope");
    const iv = Buffer.from(ivValue, "base64url");
    const tag = Buffer.from(tagValue, "base64url");
    const body = Buffer.from(bodyValue, "base64url");
    if (iv.length !== 12 || tag.length !== 16)
      throw new Error("Invalid sensitive answer envelope");
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString(
      "utf8",
    );
  }
}
