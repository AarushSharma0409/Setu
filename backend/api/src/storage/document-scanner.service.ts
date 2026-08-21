import * as net from "node:net";

import { Injectable, Logger } from "@nestjs/common";

import { EnvService } from "../common/env/env.service";

export interface DocumentScanResult {
  status: "not_configured" | "clean" | "rejected";
  engine?: string;
}

/**
 * ClamAV INSTREAM adapter. Files are scanned before they are written to
 * object storage. The scanner is deliberately small and protocol-based so
 * the API image does not need a native antivirus library.
 */
@Injectable()
export class DocumentScannerService {
  private readonly logger = new Logger(DocumentScannerService.name);

  constructor(private readonly envService: EnvService) {}

  scan(input: {
    buffer: Buffer;
    mimeType: string;
  }): Promise<DocumentScanResult> {
    const env = this.envService.values;
    if (!env.DOCUMENT_SCAN_ENABLED) {
      this.logger.warn("Document malware scanning is disabled");
      return Promise.resolve({ status: "not_configured" });
    }

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: env.CLAMAV_HOST,
        port: env.CLAMAV_PORT,
      });
      let response = "";
      let settled = false;

      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        callback();
      };

      const timer = setTimeout(() => {
        finish(() => reject(new Error("ClamAV scan timed out")));
      }, env.DOCUMENT_SCAN_TIMEOUT_MS);

      socket.once("connect", () => {
        socket.write(Buffer.from("zINSTREAM\0", "ascii"));
        for (let offset = 0; offset < input.buffer.length; offset += 8192) {
          const chunk = input.buffer.subarray(offset, offset + 8192);
          const size = Buffer.allocUnsafe(4);
          size.writeUInt32BE(chunk.length, 0);
          socket.write(size);
          socket.write(chunk);
        }
        const end = Buffer.alloc(4);
        socket.end(end);
      });

      socket.on("data", (chunk: Buffer) => {
        response += chunk.toString("utf8");
        if (!response.includes("\n")) return;
        clearTimeout(timer);
        const line = response.trim();
        if (line.endsWith("FOUND")) {
          finish(() => resolve({ status: "rejected", engine: "clamav" }));
          return;
        }
        if (line.endsWith("OK")) {
          finish(() => resolve({ status: "clean", engine: "clamav" }));
          return;
        }
        finish(() => reject(new Error(`Unexpected ClamAV response: ${line}`)));
      });

      socket.once("error", (error) => {
        clearTimeout(timer);
        finish(() => reject(error));
      });
      socket.once("close", () => clearTimeout(timer));
    });
  }
}
