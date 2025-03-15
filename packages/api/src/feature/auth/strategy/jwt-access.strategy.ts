import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

// PassportStrategy(인증 방식, 이름)
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, "access") {
  // NestJS Docs
  constructor() {
    super({
      //   jwtFromRequest: (req) => {
      //     원래 이 안에서 Request에서 무엇을 가져올 지 적어줘야 한다. Bearer 문자열 분리도 하는데 아래 메서드가 대신 해줌
      //   },

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Request Header에서 Bearer auth 뽑아내기
      secretOrKey: process.env.ACCESS_TOKEN_SECRET_KEY,
      ignoreExpiration: false, // 만료된 토큰은 거부
    });
  }

  // 검증 성공 시 실행, 실패 시는 에러
  // ### Passport는 validate에 성공할시 리턴값을 request.user에 저장함!!! ###
  validate(payload) {
    // console.log(payload);
    return {
      id: payload.id,
      sid: payload.sid,
      ssoSid: payload.ssoSid,
      name: payload.name,
      email: payload.email,
      type: payload.type,
      studentId: payload.studentId ? payload.studentId : null,
      studentNumber: payload.studentNumber ? payload.studentNumber : null,
      executiveId: payload.executiveId ? payload.executiveId : null,
      professorId: payload.professorId ? payload.professorId : null,
      employeeId: payload.employeeId ? payload.employeeId : null,
    };
  }
}
