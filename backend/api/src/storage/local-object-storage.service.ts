import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import { Injectable } from "@nestjs/common";

import type {
  SignedReadUrlInput,
  StoredObjectInput,
} from "./object-storage.service";
import { ObjectStorageService } from "./object-storage.service";
import { EnvService } from "../common/env/env.service";

@Injectable()
export class LocalObjectStorageService implements ObjectStorageService {
  private readonly rootDir: string;

  constructor(private readonly envService: EnvService) {
    this.rootDir = resolve(
      process.cwd(),
      envService.values.OBJECT_STORAGE_LOCAL_DIR,
    );
  }

  async putObject(input: StoredObjectInput): Promise<void> {
    const target = this.resolveKey(input.key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, input.buffer, { flag: "wx" });
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  getSignedReadUrl(input: SignedReadUrlInput): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + input.expiresInSeconds;
    const encodedKey = input.key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return Promise.resolve(
      `http://localhost:${this.envService.values.API_PORT}/local-objects/${encodedKey}?expires=${expiresAt}`,
    );
  }

  private resolveKey(key: string): string {
    const normalizedKey = key.replaceAll("\\", "/");
    const target = resolve(this.rootDir, normalizedKey);

    const relativeTarget = relative(this.rootDir, target);
    if (
      relativeTarget.startsWith("..") ||
      relativeTarget.includes(":") ||
      relativeTarget === ""
    ) {
      throw new Error("Invalid object storage key");
    }

    return target;
  }
}
