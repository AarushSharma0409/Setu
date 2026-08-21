import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";

import type {
  SignedReadUrlInput,
  StoredObjectInput,
} from "./object-storage.service";
import { ObjectStorageService } from "./object-storage.service";
import { EnvService } from "../common/env/env.service";

@Injectable()
export class S3ObjectStorageService implements ObjectStorageService {
  private client?: S3Client;
  private signingClient?: S3Client;

  constructor(private readonly envService: EnvService) {}

  private get connection(): S3Client {
    this.client ??= this.createClient(
      required(this.envService.values.OBJECT_STORAGE_ENDPOINT),
    );
    return this.client;
  }

  private get signingConnection(): S3Client {
    this.signingClient ??= this.createClient(
      required(this.envService.values.OBJECT_STORAGE_PUBLIC_ENDPOINT),
    );
    return this.signingClient;
  }

  private createClient(endpoint: string): S3Client {
    const env = this.envService.values;
    return new S3Client({
      credentials: {
        accessKeyId: required(env.OBJECT_STORAGE_ACCESS_KEY_ID),
        secretAccessKey: required(env.OBJECT_STORAGE_SECRET_ACCESS_KEY),
      },
      endpoint,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      region: required(env.OBJECT_STORAGE_REGION),
    });
  }

  async putObject(input: StoredObjectInput): Promise<void> {
    await this.connection.send(
      new PutObjectCommand({
        Body: input.buffer,
        Bucket: this.bucket,
        ContentType: input.mimeType,
        Key: input.key,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.connection.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getSignedReadUrl(input: SignedReadUrlInput): Promise<string> {
    return getSignedUrl(
      this.signingConnection,
      new GetObjectCommand({ Bucket: this.bucket, Key: input.key }),
      { expiresIn: input.expiresInSeconds },
    );
  }

  private get bucket(): string {
    return required(this.envService.values.OBJECT_STORAGE_BUCKET);
  }
}

function required(value: string | undefined): string {
  if (!value) throw new Error("S3 object storage configuration is incomplete");
  return value;
}
