import { HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ApiAut001RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut001";
import { ApiAut002ResponseCreated } from "@clubs/interface/api/auth/endpoint/apiAut002";
import { ApiAut003ResponseOk } from "@clubs/interface/api/auth/endpoint/apiAut003";
import { ApiAut004RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut004";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getSsoConfig } from "@sparcs-clubs/api/env";

import { Request } from "../dto/auth.dto";
import { KaistV2Info, SSOUser } from "../dto/sparcs-sso.dto";
import { AuthRepository } from "../repository/auth.repository";
import { Client } from "../util/sparcs-sso";
import {
  type ExtractedUserInfo,
  safeExtractUserInfoFromV2,
} from "../util/user-info-extractor";

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

    // SSO 프로필 정보 로깅 (보안상 민감한 정보는 제외)
    logger.info("SSO profile retrieved", {
      uid: ssoProfile.uid,
      sid: ssoProfile.sid,
      hasKaistInfo: !!ssoProfile.kaist_info,
      hasKaistV2Info: !!ssoProfile.kaist_v2_info,
    });
    logger.info(JSON.stringify(ssoProfile));

    const isKaistIamLogin: boolean = true;
    if (process.env.NODE_ENV !== "local") {
      if (!ssoProfile.sid || !ssoProfile.kaist_v2_info) {
        logger.warn("Missing required SSO data", {
          hasSid: !!ssoProfile.sid,
          hasKaistV2Info: !!ssoProfile.kaist_v2_info,
        });
        return {
          nextUrl: "/error/sso-data-missing",
          refreshToken: null,
          refreshTokenOptions: null,
        };
      }
    }

    // 로컬 환경에서는 ENV 기반 Mock 데이터를 우선 사용
    let userInfo: ExtractedUserInfo;
    let localSid = ssoProfile.sid;
    let socpsCd = "S"; // 기본값

    if (process.env.NODE_ENV === "local") {
      logger.info(
        "Using local V2 mock data for development (priority over SSO data)",
      );

      // 로컬 환경에서는 ENV 기반 Mock 데이터 생성 및 사용
      const mockV2Info: KaistV2Info = {
        std_no: process.env.USER_V2_STD_NO!,
        email: process.env.USER_V2_EMAIL!,
        user_nm: process.env.USER_V2_USER_NM!,
        socps_cd: process.env.USER_V2_SOCPS_CD!,
        std_dept_id: process.env.USER_V2_STD_DEPT_ID!,
        kaist_uid: process.env.USER_V2_KAIST_UID!,
        user_id: process.env.USER_V2_USER_ID!,

        // 로컬 개발용 기본값들
        user_eng_nm: "Test User",
        login_type: "L004",
        std_dept_kor_nm: "테스트 학과",
        std_dept_eng_nm: "Test Department",
        busn_phone: null,
        std_status_kor: "재학",
        ebs_user_status_kor: null,
        camps_div_cd: "D",
        std_prog_code: "0",
        kaist_org_id: process.env.USER_V2_STD_DEPT_ID!,
        emp_dept_id: process.env.USER_V2_EMP_DEPT_ID || "20686",
        emp_dept_kor_nm: "테스트 교수부서",
        emp_dept_eng_nm: "Test Professor Department",
        emp_no: "1267",
        emp_status_kor: "재직",
      };

      // Mock V2 정보에서 사용자 정보 추출
      const localExtractionResult = safeExtractUserInfoFromV2(mockV2Info);
      if (localExtractionResult.success) {
        userInfo = localExtractionResult.data;
        socpsCd = mockV2Info.socps_cd;

        logger.info(
          "Successfully extracted user info from local V2 mock data",
          {
            userType: userInfo.type,
            socpsCd: mockV2Info.socps_cd,
          },
        );
      } else {
        logger.error("Failed to extract user info from local V2 mock data", {
          error: localExtractionResult.error,
        });
        return {
          nextUrl: "/error/invalid-login",
          refreshToken: null,
          refreshTokenOptions: null,
        };
      }

      localSid = process.env.USER_SID || localSid;
    } else {
      // 프로덕션 환경에서만 SSO에서 받은 V2 정보 파싱 및 검증
      if (typeof ssoProfile.kaist_v2_info === "string") {
        try {
          ssoProfile.kaist_v2_info = JSON.parse(ssoProfile.kaist_v2_info);
        } catch (e) {
          logger.error("Failed to parse kaist_v2_info", e);
          return {
            nextUrl: "/error/invalid-login",
            refreshToken: null,
            refreshTokenOptions: null,
          };
        }
      }

      // V2 정보 안전 추출 (검증 포함)
      const extractionResult = safeExtractUserInfoFromV2(
        ssoProfile.kaist_v2_info,
      );
      if (!extractionResult.success) {
        logger.error("Invalid kaist_v2_info", {
          error: extractionResult.error,
          sid: ssoProfile.sid,
        });
        return {
          nextUrl: "/error/invalid-login",
          refreshToken: null,
          refreshTokenOptions: null,
        };
      }

      userInfo = extractionResult.data;
      socpsCd = ssoProfile.kaist_v2_info?.socps_cd || "S";

      logger.info("Successfully extracted user info from V2 data", {
        sid: ssoProfile.sid,
        userType: userInfo.type,
        hasStudentNumber: !!userInfo.studentNumber,
        hasEmail: !!userInfo.email,
      });
    }

    // 최종 사용자 정보
    const { studentNumber, email, name, type, department } = userInfo;

    const user = await this.authRepository.findOrCreateUser(
      email,
      studentNumber,
      localSid,
      name,
      type,
      department,
      socpsCd,
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
