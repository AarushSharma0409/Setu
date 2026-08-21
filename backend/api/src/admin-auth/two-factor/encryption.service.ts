import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { EnvService } from "../../common/env/env.service";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

@Injectable()
export class AdminTwoFactorEncryptionService {
  private readonly key: Buffer;

  constructor(envService: EnvService) {
    this.key = Buffer.from(
      envService.values.ADMIN_2FA_ENCRYPTION_KEY,
      "base64",
    );
  }

  encrypt(value: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [iv, tag, ciphertext]
      .map((part) => part.toString("base64url"))
      .join(".");
  }

  decrypt(envelope: string): string {
    const [encodedIv, encodedTag, encodedCiphertext] = envelope.split(".");

    if (!encodedIv || !encodedTag || !encodedCiphertext) {
      throw new Error("Invalid encrypted 2FA secret envelope");
    }

    const iv = decodeCanonical(encodedIv);
    const tag = decodeCanonical(encodedTag);
    const ciphertext = decodeCanonical(encodedCiphertext);

    if (iv.length !== IV_LENGTH || tag.length !== 16) {
      throw new Error("Invalid encrypted 2FA secret envelope");
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  }
}

function decodeCanonical(value: string): Buffer {
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    throw new Error("Invalid encrypted 2FA secret envelope");
  }
  return decoded;
}
