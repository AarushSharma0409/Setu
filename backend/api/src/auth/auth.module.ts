import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";
import { TokenService } from "./token.service";
import { EnvModule } from "../common/env/env.module";

@Module({
  imports: [EnvModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokenService, SessionService, PasswordService],
  exports: [JwtModule, TokenService, SessionService, PasswordService],
})
export class AuthModule {}
