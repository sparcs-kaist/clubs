import { HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ApiAut001RequestQuery } from "@sparcs-clubs/interface/api/auth/endpoint/apiAut001";
import { ApiAut002ResponseCreated } from "@sparcs-clubs/interface/api/auth/endpoint/apiAut002";
import { ApiAut004RequestQuery } from "@sparcs-clubs/interface/api/auth/endpoint/apiAut004";

import { getSsoConfig } from "@sparcs-clubs/api/env";

import { Request } from "../dto/auth.dto";
import { SSOUser } from "../dto/sparcs-sso.dto";
import { AuthRepository } from "../repository/auth.repository";
import { Client } from "../util/sparcs-sso";

@Injectable()
export class AuthService {
  private readonly ssoClient: Client;

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

    let studentNumber = ssoProfile.kaist_info.ku_std_no || "00000000";
    let email =
      ssoProfile.kaist_info.mail?.replace("mailto:", "") ||
      "unknown@kaist.ac.kr";
    let sid = ssoProfile.sid || "00000000";
    let name = ssoProfile.kaist_info.ku_kname || "unknown";
    let type = ssoProfile.kaist_info.ku_person_type || "Student";
    let department = ssoProfile.kaist_info.ku_kaist_org_id || "4421";

    if (process.env.NODE_ENV === "local") {
      studentNumber = process.env.USER_KU_STD_NO;
      email = process.env.USER_MAIL;
      sid = process.env.USER_SID;
      name = process.env.USER_KU_KNAME;
      type = process.env.USER_KU_PERSON_TYPE;
      department = process.env.USER_KU_KAIST_ORG_ID;
    }

    const userResult = await this.authRepository.findOrCreateUser(
      email,
      studentNumber,
      sid,
      name,
      type,
      department,
    );

    const user = {
      ...userResult,
      ssoSid: ssoProfile.sid || sid,
    };
    // console.log("login");
    // console.log("user", user);
    // executiverepository가 common에서 제거됨에 따라 집행부원 토큰 추가 로직은 후에 재구성이 필요합니다.
    // if(user.executive){
    //   if(!(await this.executiveRepository.findExecutiveById(user.executive.id))) throw new HttpException("Cannot find Executive", 403);
    // }
    const accessToken = this.getAccessToken(user);
    const refreshToken = this.getRefreshToken(user);

    // console.log("accessToken", accessToken);
    // console.log("refreshToken", refreshToken);
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
    ssoSid: string;
  }): Promise<ApiAut002ResponseCreated> {
    const user = await this.authRepository.findUserById(_user.id);
    const ssoSid = _user.ssoSid || user.sid;
    const accessToken = this.getAccessToken({ ...user, ssoSid });

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
      ssoSid: string;
    },
    refreshToken: string,
    origin: string,
  ): Promise<string> {
    const deleteResult = await this.authRepository.deleteRefreshTokenRecord(
      _user.id,
      refreshToken,
    );
    if (!deleteResult) {
      throw new HttpException("Cannot delete refreshtoken", 500);
    }
    const sid = _user.ssoSid || _user.sid;

    // console.log("logout");
    // console.log("user", _user);
    // console.log("sid", sid);
    const absoluteUrl = `${origin}`;
    // console.log("absoluteUrl", absoluteUrl);
    const logoutUrl = this.ssoClient.get_logout_url(sid, absoluteUrl);
    // console.log("logoutUrl", logoutUrl);
    return logoutUrl;
  }

  // https://sparcssso.kaist.ac.kr/api/v2/logout/?client_id=test66e3182a161d5091f265&sid=ef555bb2840666056248&timestamp=1741854619&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fsession%2Flogout%3Fnext%3Dhttp%3A%2F%2Flocalhost%3A5173&sign=edabde02a25d56e329e6b16eec20d4e6
  // https://sparcssso.kaist.ac.kr/api/v2/logout/?client_id=test21232f99b1696bc5b282&sid=17ac015dcbe7a824f9d4&timestamp=1741851534&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fauth%2Fsign-out&sign=6843141132f12d3212aa2918554d4e4c
  // https://sparcssso.kaist.ac.kr/api/v2/logout/?client_id=test21232f99b1696bc5b282&sid=17ac015dcbe7a824f9d4&timestamp=1741855527&redirect_uri=http%3A%2F%2Flocalhost%3A8000&sign=038477872ced73b229326b7731fd609b

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
    ssoSid: string;
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
          ssoSid: user.ssoSid,
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
          ssoSid: user.ssoSid,
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
          ssoSid: user.ssoSid,
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
          ssoSid: user.ssoSid,
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
          ssoSid: user.ssoSid,
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
          ssoSid: user.ssoSid,
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
    ssoSid: string;
  }) {
    const refreshToken = this.jwtService.sign(
      {
        email: user.email,
        id: user.id,
        sid: user.sid,
        name: user.name,
        ssoSid: user.ssoSid,
      },
      {
        secret: process.env.REFRESH_TOKEN_SECRET_KEY,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      },
    );
    return refreshToken;
  }
}
