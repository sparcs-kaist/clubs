import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import UserModule from "../user/user.module";
import { AuthController } from "./controller/auth.controller";
import { AuthRepository } from "./repository/auth.repository";
import { AuthService } from "./service/auth.service";
import { SsoClientService } from "./service/sso-client.service";
import { JwtAccessStrategy } from "./strategy/jwt-access.strategy";
import { JwtRefreshStrategy } from "./strategy/jwt-refresh.strategy";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (appConfigService: AppConfigService) => ({
        secret: appConfigService.jwtSecret,
        signOptions: {
          expiresIn: appConfigService.jwtExpiresIn,
        },
      }),
      inject: [AppConfigService],
    }),
    PassportModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SsoClientService,
    AuthRepository,
    JwtRefreshStrategy,
    JwtAccessStrategy,
  ],
})
export class AuthModule {}
