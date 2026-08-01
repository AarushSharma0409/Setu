import { Injectable, Logger } from "@nestjs/common";

export interface DocumentScanResult {
  status: "not_configured" | "clean" | "rejected";
  engine?: string;
}

/**
 * Explicit boundary for production malware scanning. Sprint 6 validates file
 * signatures and never executes uploaded content; a real scanner should be
 * injected here before documents are marked safe in production.
 */
@Injectable()
export class DocumentScannerService {
  private readonly logger = new Logger(DocumentScannerService.name);

  scan(input: { buffer: Buffer; mimeType: string }): Promise<DocumentScanResult> {
    this.logger.debug(`Document scan boundary invoked for ${input.mimeType}`);
    return Promise.resolve({ status: "not_configured" });
  }
}
