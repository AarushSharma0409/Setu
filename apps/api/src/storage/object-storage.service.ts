export interface StoredObjectInput {
  buffer: Buffer;
  key: string;
  mimeType: string;
}

export interface SignedReadUrlInput {
  key: string;
  expiresInSeconds: number;
}

export abstract class ObjectStorageService {
  abstract putObject(input: StoredObjectInput): Promise<void>;
  abstract deleteObject(key: string): Promise<void>;
  abstract getSignedReadUrl(input: SignedReadUrlInput): Promise<string>;
}
