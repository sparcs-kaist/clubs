import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import { SemesterModule } from "../semester/semester.module";
import UserModule from "../user/user.module";
import { AuthController } from "./controller/auth.controller";
import { ExchangeLoginController } from "./controller/exchange-login.controller";
import { SsoLoginDiagnosticInterceptor } from "./controller/sso-login-diagnostic.interceptor";
import { AuthRepository } from "./repository/auth.repository";
import { AuthExchangeLoginRepository } from "./repository/exchange-login/auth-exchange-login.repository";
import { SsoLoginFailureRepository } from "./repository/sso-login-failure/sso-login-failure.repository";
import { AuthService } from "./service/auth.service";
import { ExchangeLoginService } from "./service/exchange-login.service";
import { SsoClientService } from "./service/sso-client.service";
import { SsoLoginFailureService } from "./service/sso-login-failure.service";
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
    SemesterModule,
  ],
  controllers: [AuthController, ExchangeLoginController],
  providers: [
    AuthService,
    SsoLoginDiagnosticInterceptor,
    SsoLoginFailureRepository,
    SsoLoginFailureService,
    SsoClientService,
    AuthRepository,
    AuthExchangeLoginRepository,
    ExchangeLoginService,
    JwtRefreshStrategy,
    JwtAccessStrategy,
  ],
})
export class AuthModule {}
