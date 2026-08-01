import { Module } from "@nestjs/common";

import { DocumentScannerService } from "./document-scanner.service";
import { LocalObjectStorageService } from "./local-object-storage.service";
import { ObjectStorageService } from "./object-storage.service";
import { EnvModule } from "../common/env/env.module";

@Module({
  imports: [EnvModule],
  providers: [
    LocalObjectStorageService,
    DocumentScannerService,
    {
      provide: ObjectStorageService,
      useExisting: LocalObjectStorageService,
    },
  ],
  exports: [ObjectStorageService, DocumentScannerService],
})
export class StorageModule {}
