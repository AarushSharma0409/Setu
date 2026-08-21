import { Module } from "@nestjs/common";

import { DocumentScannerService } from "./document-scanner.service";
import { LocalObjectStorageService } from "./local-object-storage.service";
import { ObjectStorageService } from "./object-storage.service";
import { S3ObjectStorageService } from "./s3-object-storage.service";
import { EnvModule } from "../common/env/env.module";
import { EnvService } from "../common/env/env.service";

@Module({
  imports: [EnvModule],
  providers: [
    LocalObjectStorageService,
    S3ObjectStorageService,
    DocumentScannerService,
    {
      provide: ObjectStorageService,
      inject: [EnvService, LocalObjectStorageService, S3ObjectStorageService],
      useFactory: (
        env: EnvService,
        local: LocalObjectStorageService,
        s3: S3ObjectStorageService,
      ): ObjectStorageService => {
        return env.values.OBJECT_STORAGE_PROVIDER === "s3" ? s3 : local;
      },
    },
  ],
  exports: [ObjectStorageService, DocumentScannerService],
})
export class StorageModule {}
