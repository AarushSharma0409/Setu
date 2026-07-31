import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { AdminSystemController } from "./admin-system.controller";
import { AppController } from "./app.controller";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AuthModule } from "../auth/auth.module";
import { CategoriesModule } from "../categories/categories.module";
import { EnvModule } from "../common/env/env.module";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { RequestLoggingInterceptor } from "../common/interceptors/request-logging.interceptor";
import { DatabaseModule } from "../database/database.module";
import { HealthModule } from "../health/health.module";
import { LocationsModule } from "../locations/locations.module";
import { RedisModule } from "../redis/redis.module";
import { UsersModule } from "../users/users.module";
import { VendorsModule } from "../vendors/vendors.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    EnvModule,
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    AdminAuthModule,
    UsersModule,
    CategoriesModule,
    LocationsModule,
    VendorsModule,
  ],
  controllers: [AppController, AdminSystemController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
