import { Module } from "@nestjs/common";

import { LocalObjectStorageService } from "./local-object-storage.service";
import { ObjectStorageService } from "./object-storage.service";
import { EnvModule } from "../common/env/env.module";

@Module({
  imports: [EnvModule],
  providers: [
    LocalObjectStorageService,
    {
      provide: ObjectStorageService,
      useExisting: LocalObjectStorageService,
    },
  ],
  exports: [ObjectStorageService],
})
export class StorageModule {}
