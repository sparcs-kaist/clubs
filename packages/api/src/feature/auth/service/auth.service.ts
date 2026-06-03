import { HttpException, Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ApiAut001RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut001";
import { ApiAut002ResponseCreated } from "@clubs/interface/api/auth/endpoint/apiAut002";
import { ApiAut003ResponseOk } from "@clubs/interface/api/auth/endpoint/apiAut003";
import { ApiAut004RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut004";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import logger from "@sparcs-clubs/api/common/util/logger";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import { Request } from "../dto/auth.dto";
import { KaistV2Info, SSOUser } from "../dto/sparcs-sso.dto";
import { AuthRepository } from "../repository/auth.repository";
import {
  type ExtractedUserInfo,
  safeExtractUserInfoFromV2,
} from "../util/user-info-extractor";
import { SsoClientService } from "./sso-client.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly ssoClient: SsoClientService,
    private readonly appConfigService: AppConfigService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * @param query
   * @param req
   * @description getAuthSignIn의 서비스 진입점입니다.
   * @returns SPRACS SSO의 로그인 url을 리턴합니다.
   */
  public async getAuthSignIn(query: ApiAut001RequestQuery, req: Request) {
    req.session.next = query.next ?? "/";
    const { url, state } = this.ssoClient.getLoginParams();

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

    const ssoProfile: SSOUser = await this.ssoClient.getUserInfo(query.code);

    // SSO 프로필 정보 로깅 (보안상 민감한 정보는 제외)
    logger.info("SSO profile retrieved", {
      uid: ssoProfile.uid,
      sid: ssoProfile.sid,
      hasKaistInfo: !!ssoProfile.kaist_info,
      hasKaistV2Info: !!ssoProfile.kaist_v2_info,
    });
    logger.info(JSON.stringify(ssoProfile));

    const isKaistIamLogin: boolean = true;
    if (!this.appConfigService.isLocal) {
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

    let userInfo: ExtractedUserInfo | undefined;
    let localSid = ssoProfile.sid;
    let socpsCd = "S"; // 기본값
    let stdStatusKor: string | null = null;
    let stdProgCode: string | null = null;

    // SSO에서 받은 V2 정보 파싱
    if (typeof ssoProfile.kaist_v2_info === "string") {
      try {
        ssoProfile.kaist_v2_info = JSON.parse(ssoProfile.kaist_v2_info);
      } catch (e) {
        logger.error("Failed to parse kaist_v2_info", e);
        ssoProfile.kaist_v2_info = null;
      }
    }

    // SSO에서 받은 V2 정보가 있으면 우선 사용
    if (ssoProfile.kaist_v2_info) {
      const extractionResult = safeExtractUserInfoFromV2(
        ssoProfile.kaist_v2_info,
      );
      if (extractionResult.success) {
        userInfo = extractionResult.data;
        socpsCd = ssoProfile.kaist_v2_info?.socps_cd || "S";
        stdStatusKor = ssoProfile.kaist_v2_info?.std_status_kor || null;
        stdProgCode = ssoProfile.kaist_v2_info?.std_prog_code || null;

        logger.info("Successfully extracted user info from SSO V2 data", {
          sid: ssoProfile.sid,
          userType: userInfo.type,
          hasStudentNumber: !!userInfo.studentNumber,
          hasEmail: !!userInfo.email,
        });
      } else {
        logger.error("Invalid kaist_v2_info from SSO", {
          error: extractionResult.error,
          sid: ssoProfile.sid,
        });

        if (!this.appConfigService.isLocal) {
          return {
            nextUrl: "/error/invalid-login",
            refreshToken: null,
            refreshTokenOptions: null,
          };
        }
        // local 환경이면 아래 fallback으로 진행
        ssoProfile.kaist_v2_info = null;
      }
    }

    // SSO V2 정보가 없거나 추출 실패한 경우, local 환경에서만 ENV fallback 사용
    if (!userInfo) {
      if (this.appConfigService.isLocal) {
        logger.info(
          "SSO V2 info not available, falling back to ENV mock data for local development",
        );

        const mockV2Info: KaistV2Info = {
          std_no: this.appConfigService.userV2StdNo,
          email: this.appConfigService.userV2Email,
          user_nm: this.appConfigService.userV2UserNm,
          socps_cd: this.appConfigService.userV2SocpsCd,
          std_dept_id: this.appConfigService.userV2StdDeptId,
          kaist_uid: this.appConfigService.userV2KaistUid,
          user_id: this.appConfigService.userV2UserId,

          user_eng_nm: "Test User",
          login_type: "L004",
          std_dept_kor_nm: "테스트 학과",
          std_dept_eng_nm: "Test Department",
          busn_phone: null,
          std_status_kor: "재학",
          ebs_user_status_kor: null,
          camps_div_cd: "D",
          std_prog_code: "0",
          kaist_org_id: this.appConfigService.userV2StdDeptId,
          emp_dept_id: this.appConfigService.userV2EmpDeptId,
          emp_dept_kor_nm: "테스트 교수부서",
          emp_dept_eng_nm: "Test Professor Department",
          emp_no: "1267",
          emp_status_kor: "재직",
        };

        const localExtractionResult = safeExtractUserInfoFromV2(mockV2Info);
        if (localExtractionResult.success) {
          userInfo = localExtractionResult.data;
          socpsCd = mockV2Info.socps_cd;
          stdStatusKor = mockV2Info.std_status_kor;
          stdProgCode = mockV2Info.std_prog_code;

          logger.info("Successfully extracted user info from ENV mock data", {
            userType: userInfo.type,
            socpsCd: mockV2Info.socps_cd,
          });
        } else {
          logger.error("Failed to extract user info from ENV mock data", {
            error: localExtractionResult.error,
          });
          return {
            nextUrl: "/error/invalid-login",
            refreshToken: null,
            refreshTokenOptions: null,
          };
        }

        localSid = this.appConfigService.userSid || localSid;
      } else {
        return {
          nextUrl: "/error/invalid-login",
          refreshToken: null,
          refreshTokenOptions: null,
        };
      }
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
      stdStatusKor,
      stdProgCode,
    );
    // executiverepository가 common에서 제거됨에 따라 집행부원 토큰 추가 로직은 후에 재구성이 필요합니다.
    // if(user.executive){
    //   if(!(await this.executiveRepository.findExecutiveById(user.executive.id))) throw new HttpException("Cannot find Executive", 403);
    // }
    const accessToken = this.getAccessToken(user);
    const refreshToken = this.getRefreshToken(user);
    const current = this.clock.now();
    const accessTokenTokenExpiresAt = new Date(
      current.getTime() + this.appConfigService.accessTokenExpiresInMs,
    );
    const refreshTokenExpiresAt = new Date(
      current.getTime() + this.appConfigService.refreshTokenExpiresInMs,
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
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
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
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
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
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
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
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
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
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
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
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
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
        secret: this.appConfigService.refreshTokenSecretKey,
        expiresIn: this.appConfigService.refreshTokenExpiresIn,
      },
    );
    return refreshToken;
  }
}
