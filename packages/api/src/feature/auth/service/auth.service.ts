import { HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ApiAut001RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut001";
import { ApiAut002ResponseCreated } from "@clubs/interface/api/auth/endpoint/apiAut002";
import { ApiAut003ResponseOk } from "@clubs/interface/api/auth/endpoint/apiAut003";
import { ApiAut004RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut004";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getSsoConfig } from "@sparcs-clubs/api/env";

import { Request } from "../dto/auth.dto";
import { SSOUser } from "../dto/sparcs-sso.dto";
import { AuthRepository } from "../repository/auth.repository";
import { Client } from "../util/sparcs-sso";

@Injectable()
export class AuthService {
  private readonly ssoClient;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {
    const ssoConfig = getSsoConfig();
    const ssoClient = new Client(ssoConfig.ssoClientId, ssoConfig.ssoSecretKey);
    this.ssoClient = ssoClient;
  }

  /**
   * @param query
   * @param req
   * @description getAuthSignIn의 서비스 진입점입니다.
   * @returns SPRACS SSO의 로그인 url을 리턴합니다.
   */
  public async getAuthSignIn(query: ApiAut001RequestQuery, req: Request) {
    req.session.next = query.next ?? "/";
    const { url, state } = this.ssoClient.get_login_params();

    req.session.ssoState = state;
    return url;
  }

  /**
   * @param query
   * @param session
   * @description getAuthSignInCallback의 서비스 진입점입니다.
   * @returns
   */
  public async getAuthSignInCallback(
    query: ApiAut004RequestQuery,
    session: Request["session"],
  ) {
    const stateBefore = session.ssoState;
    if (!stateBefore || stateBefore !== query.state) {
      return {
        nextUrl: "/error/invalid-login",
        refreshToken: null,
        refreshTokenOptions: null,
      };
    }

    const ssoProfile: SSOUser = await this.ssoClient.get_user_info(query.code);
    logger.info(JSON.stringify(ssoProfile));

    const isKaistIamLogin: boolean = true;
    if (process.env.NODE_ENV !== "local") {
      if (!ssoProfile.sid || !ssoProfile.kaist_info) {
        return { isKaistIamLogin: false };
      }
    }

    let studentNumber = ssoProfile.kaist_info.ku_std_no;
    let email = ssoProfile.kaist_info.mail?.replace("mailto:", "");
    let { sid } = ssoProfile;
    let name = ssoProfile.kaist_info.ku_kname;
    let type = ssoProfile.kaist_info.ku_person_type || "Student";
    let department = ssoProfile.kaist_info.ku_kaist_org_id;

    // 임시로 kaist v2 추가
    if (typeof ssoProfile.kaist_v2_info === "string") {
      try {
        ssoProfile.kaist_v2_info = JSON.parse(ssoProfile.kaist_v2_info);
      } catch (e) {
        logger.error("Failed to parse kaist_v2_info", e);
      }
    }
    let typeV2 = ssoProfile.kaist_v2_info?.socps_cd || "S";

    if (process.env.NODE_ENV === "local") {
      studentNumber = process.env.USER_KU_STD_NO;
      email = process.env.USER_MAIL;
      sid = process.env.USER_SID;
      name = process.env.USER_KU_KNAME;
      type = process.env.USER_KU_PERSON_TYPE;
      department = process.env.USER_KU_KAIST_ORG_ID;
      typeV2 = process.env.USER_SOCPS_CD;
    }

    const user = await this.authRepository.findOrCreateUser(
      email,
      studentNumber,
      sid,
      name,
      type,
      department,
      typeV2,
    );
    // executiverepository가 common에서 제거됨에 따라 집행부원 토큰 추가 로직은 후에 재구성이 필요합니다.
    // if(user.executive){
    //   if(!(await this.executiveRepository.findExecutiveById(user.executive.id))) throw new HttpException("Cannot find Executive", 403);
    // }
    const accessToken = this.getAccessToken(user);
    const refreshToken = this.getRefreshToken(user);
    const current = new Date(); // todo 시간 변경 필요.
    const accessTokenTokenExpiresAt = new Date(
      current.getTime() + parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN),
    );
    const refreshTokenExpiresAt = new Date(
      current.getTime() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN),
    );
    const nextUrl = session.next ?? "/";

    const token = {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      accessTokenTokenExpiresAt,
    };

    return (await this.authRepository.createRefreshTokenRecord(
      user.id,
      refreshToken,
      refreshTokenExpiresAt,
    ))
      ? {
          next: nextUrl,
          token,
          isKaistIamLogin,
        }
      : (() => {
          throw new HttpException("Cannot store refreshtoken", 500);
        })();
  }

  async postAuthRefresh(_user: {
    id: number;
    sid: string;
    name: string;
    email: string;
  }): Promise<ApiAut002ResponseCreated> {
    const user = await this.authRepository.findUserById(_user.id);
    const accessToken = this.getAccessToken(user);

    return {
      accessToken,
    };
  }

  // TODO: 로직 수정 필요
  async postAuthSignout(
    _user: {
      id: number;
      sid: string;
      name: string;
      email: string;
    },
    refreshToken: string,
  ): Promise<ApiAut003ResponseOk> {
    return (await this.authRepository.deleteRefreshTokenRecord(
      _user.id,
      refreshToken,
    ))
      ? {}
      : (() => {
          throw new HttpException("Cannot delete refreshtoken", 500);
        })();
  }

  getAccessToken(user: {
    id: number;
    sid: string;
    name: string;
    email: string;
    undergraduate?: {
      id: number;
      number: number;
    };
    master?: {
      id: number;
      number: number;
    };
    doctor?: {
      id: number;
      number: number;
    };
    executive?: {
      id: number;
      studentId: number;
    };
    professor?: {
      id: number;
    };
    employee?: {
      id: number;
    };
  }) {
    const accessToken: {
      undergraduate?: string;
      master?: string;
      doctor?: string;
      executive?: string;
      professor?: string;
      employee?: string;
    } = {};

    if (user.undergraduate) {
      accessToken.undergraduate = this.jwtService.sign(
        {
          id: user.id,
          sid: user.sid,
          name: user.name,
          email: user.email,
          type: "undergraduate",
          studentId: user.undergraduate.id,
          studentNumber: user.undergraduate.number,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        },
      );
    }

    if (user.master) {
      accessToken.master = this.jwtService.sign(
        {
          id: user.id,
          sid: user.sid,
          name: user.name,
          email: user.email,
          type: "master",
          studentId: user.master.id,
          studentNumber: user.master.number,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        },
      );
    }

    if (user.doctor) {
      accessToken.doctor = this.jwtService.sign(
        {
          id: user.id,
          sid: user.sid,
          name: user.name,
          email: user.email,
          type: "doctor",
          studentId: user.doctor.id,
          studentNumber: user.doctor.number,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        },
      );
    }

    if (user.executive) {
      accessToken.executive = this.jwtService.sign(
        {
          id: user.id,
          sid: user.sid,
          name: user.name,
          email: user.email,
          type: "executive",
          executiveId: user.executive.id,
          studentId: user.executive.studentId,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        },
      );
    }

    if (user.professor) {
      accessToken.professor = this.jwtService.sign(
        {
          id: user.id,
          sid: user.sid,
          name: user.name,
          email: user.email,
          type: "professor",
          professorId: user.professor.id,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        },
      );
    }

    if (user.employee) {
      accessToken.employee = this.jwtService.sign(
        {
          id: user.id,
          sid: user.sid,
          name: user.name,
          email: user.email,
          type: "employee",
          employeeId: user.employee.id,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        },
      );
    }

    return accessToken;
  }

  getRefreshToken(user: {
    id: number;
    sid: string;
    name: string;
    email: string;
  }) {
    const refreshToken = this.jwtService.sign(
      {
        email: user.email,
        id: user.id,
        sid: user.sid,
        name: user.name,
      },
      {
        secret: process.env.REFRESH_TOKEN_SECRET_KEY,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      },
    );
    return refreshToken;
  }
}
