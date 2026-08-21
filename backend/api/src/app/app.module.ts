import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { AdminSystemController } from "./admin-system.controller";
import { AppController } from "./app.controller";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AdminCatalogModule } from "../admin-catalog/admin-catalog.module";
import { AdminManagementModule } from "../admin-management/admin-management.module";
import { AdminVendorsModule } from "../admin-vendors/admin-vendors.module";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { CategoriesModule } from "../categories/categories.module";
import { EnvModule } from "../common/env/env.module";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { RateLimitGuard } from "../common/guards/rate-limit.guard";
import { RequestLoggingInterceptor } from "../common/interceptors/request-logging.interceptor";
import { DatabaseModule } from "../database/database.module";
import { HealthModule } from "../health/health.module";
import { InquiriesModule } from "../inquiries/inquiries.module";
import { InsuranceModule } from "../insurance/insurance.module";
import { LocationsModule } from "../locations/locations.module";
import { MailModule } from "../mail/mail.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PublicDiscoveryModule } from "../public-discovery/public-discovery.module";
import { RedisModule } from "../redis/redis.module";
import { UsersModule } from "../users/users.module";
import { VendorsModule } from "../vendors/vendors.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    EnvModule,
    MailModule,
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    AdminAuthModule,
    AdminCatalogModule,
    AdminManagementModule,
    AuditModule,
    AdminVendorsModule,
    UsersModule,
    CategoriesModule,
    LocationsModule,
    VendorsModule,
    PublicDiscoveryModule,
    InquiriesModule,
    NotificationsModule,
    InsuranceModule,
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
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
