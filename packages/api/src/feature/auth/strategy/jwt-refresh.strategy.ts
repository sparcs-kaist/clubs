import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-jwt";

import { AuthRepository } from "../repository/auth.repository";

// PassportStrategy(인증 방식, 이름)
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "refresh") {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      jwtFromRequest: req => {
        const cookie = req?.cookies?.refreshToken;
        return cookie;
      },
      secretOrKey: process.env.REFRESH_TOKEN_SECRET_KEY,
      ignoreExpiration: false, // 만료된 토큰은 거부
      passReqToCallback: true, // Request 객체를 콜백에 전달
    });
  }

  // 검증 성공 시 실행, 실패 시는 에러
  // ### Passport는 validate에 성공할시 리턴값을 request.user에 저장함!!! ###
  async validate(request: Request, payload) {
    const refreshToken =
      request?.cookies?.refreshToken ||
      (() => {
        throw new UnauthorizedException("No refresh token provided");
      })();
    return (await this.authRepository.findUserAndRefreshToken(
      payload.id,
      refreshToken,
    ))
      ? {
          id: payload.id,
          sid: payload.sid,
          ssoSid: payload.ssoSid,
          name: payload.name,
          email: payload.email,
        }
      : (() => {
          throw new UnauthorizedException("Refresh token not match");
        })();
  }
}
