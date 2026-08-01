import { Module } from "@nestjs/common";

import { DocumentScannerService } from "./document-scanner.service";
import { LocalObjectStorageService } from "./local-object-storage.service";
import { ObjectStorageService } from "./object-storage.service";
import { EnvModule } from "../common/env/env.module";
import { EnvService } from "../common/env/env.service";

@Module({
  imports: [EnvModule],
  providers: [
    LocalObjectStorageService,
    DocumentScannerService,
    {
      provide: ObjectStorageService,
      inject: [EnvService, LocalObjectStorageService],
      useFactory: (
        env: EnvService,
        local: LocalObjectStorageService,
      ): ObjectStorageService => {
        if (env.values.OBJECT_STORAGE_PROVIDER !== "local") {
          throw new Error(
            "The S3 object-storage adapter is not installed; production must deploy the approved adapter before enabling S3",
          );
        }
        return local;
      },
    },
  ],
  exports: [ObjectStorageService, DocumentScannerService],
})
export class StorageModule {}
