import { Global, Module } from "@nestjs/common";

import { RedisService } from "./redis.service";
import { EnvModule } from "../common/env/env.module";

@Global()
@Module({
  imports: [EnvModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
