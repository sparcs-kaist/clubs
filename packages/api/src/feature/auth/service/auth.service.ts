import { HttpException, Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Transactional } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { ApiAut001RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut001";
import { ApiAut002ResponseCreated } from "@clubs/interface/api/auth/endpoint/apiAut002";
import { ApiAut003ResponseOk } from "@clubs/interface/api/auth/endpoint/apiAut003";
import { ApiAut004RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut004";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import {
  RANDOM_GENERATOR,
  RandomGenerator,
} from "@sparcs-clubs/api/common/random/random-generator";
import logger from "@sparcs-clubs/api/common/util/logger";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import {
  LoginIdentity,
  UserIdentitySyncError,
} from "@sparcs-clubs/api/feature/user/model/login-identity";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { ExchangeLoginActor, Request } from "../dto/auth.dto";
import { KaistV2Info, SSOUser } from "../dto/sparcs-sso.dto";
import { AuthRepository } from "../repository/auth.repository";
import {
  captureSsoProfile,
  SsoLoginDiagnostic,
} from "../util/sso-login-diagnostic";
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
    @Inject(RANDOM_GENERATOR) private readonly randomGenerator: RandomGenerator,
    private readonly userPublicService: UserPublicService,
    private readonly semesterPublicService: SemesterPublicService,
  ) {}

  /**
   * @param query
   * @param req
   * @description getAuthSignIn의 서비스 진입점입니다.
   * @returns SPRACS SSO의 로그인 url을 리턴합니다.
   */
  public async getAuthSignIn(query: ApiAut001RequestQuery, req: Request) {
    if (req.ssoLoginDiagnostic)
      req.ssoLoginDiagnostic.stage = "session_initialize";
    req.session.next = query.next ?? "/";
    if (req.ssoLoginDiagnostic)
      req.ssoLoginDiagnostic.stage = "sso_login_params";
    const { url, state } = this.ssoClient.getLoginParams();

    if (req.ssoLoginDiagnostic) {
      req.ssoLoginDiagnostic.secrets ??= [];
      req.ssoLoginDiagnostic.secrets.push(state);
    }

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
    diagnosticContext?: SsoLoginDiagnostic,
  ) {
    const diagnostic: SsoLoginDiagnostic = diagnosticContext ?? {
      stage: "session_validation",
    };
    const fail = (
      name: string,
      message: string,
      nextUrl: string,
      httpStatus = 400,
    ) => {
      diagnostic.failure = {
        name,
        message,
        httpStatus,
        stack: new Error(message).stack,
      };
      return {
        nextUrl,
        refreshToken: null,
        refreshTokenOptions: null,
        next: undefined,
        token: undefined,
        isKaistIamLogin: false,
      };
    };
    diagnostic.stage = "session_validation";
    const stateBefore = session.ssoState;
    if (!stateBefore || stateBefore !== query.state) {
      return fail(
        "InvalidSsoState",
        "SSO session state missing or mismatched",
        "/error/invalid-login",
        401,
      );
    }

    diagnostic.stage = "sso_request";
    const ssoProfile: SSOUser = await this.ssoClient.getUserInfo(
      query.code,
      diagnostic,
    );
    diagnostic.sso ??= { profile: captureSsoProfile(ssoProfile) };
    diagnostic.stage = "sso_profile_validation";

    if (!this.appConfigService.isLocal) {
      if (!ssoProfile.sid || !ssoProfile.kaist_v2_info) {
        logger.warn("Missing required SSO data", {
          hasSid: !!ssoProfile.sid,
          hasKaistV2Info: !!ssoProfile.kaist_v2_info,
        });
        return fail(
          "MissingSsoProfile",
          "Required SSO sid or KAIST V2 profile missing",
          "/error/sso-data-missing",
        );
      }
    }

    let userInfo: ExtractedUserInfo | undefined;
    let localSid = ssoProfile.sid;
    let socpsCd = "S"; // 기본값
    let stdStatusKor: string | null = null;
    let stdProgCode: string | null = null;

    // SSO에서 받은 V2 정보 파싱
    if (typeof ssoProfile.kaist_v2_info === "string") {
      diagnostic.stage = "sso_parse";
      try {
        ssoProfile.kaist_v2_info = JSON.parse(ssoProfile.kaist_v2_info);
      } catch {
        diagnostic.sso.serviceParseError = "kaist_v2_info";
        ssoProfile.kaist_v2_info = null;
      }
    }

    // SSO에서 받은 V2 정보가 있으면 우선 사용
    if (ssoProfile.kaist_v2_info) {
      diagnostic.stage = "sso_field_validation";
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
          stage: diagnostic.stage,
        });

        if (!this.appConfigService.isLocal) {
          return fail(
            "InvalidSsoFields",
            extractionResult.error,
            "/error/invalid-login",
          );
        }
        // local 환경이면 아래 fallback으로 진행
        ssoProfile.kaist_v2_info = null;
      }
    }

    // SSO V2 정보가 없거나 추출 실패한 경우, local 환경에서만 ENV fallback 사용
    if (!userInfo) {
      if (this.appConfigService.isLocal) {
        diagnostic.stage = "local_profile_validation";
        diagnostic.sso.usedLocalFallback = true;
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
        diagnostic.sso.localProfile = captureSsoProfile({
          kaist_v2_info: mockV2Info,
        });
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
            stage: diagnostic.stage,
          });
          return fail(
            "InvalidLocalSsoFields",
            localExtractionResult.error,
            "/error/invalid-login",
          );
        }

        localSid = this.appConfigService.userSid || localSid;
      } else {
        return fail(
          "MissingSsoUserInfo",
          "No usable KAIST V2 user information",
          "/error/invalid-login",
        );
      }
    }

    // A MySQL upsert race needs a fresh transaction snapshot. Reuse the SSO
    // response; retrying the one-time authorization code would fail.
    for (let attempt = 1; ; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop -- each retry starts after the previous transaction rolls back
        return await this.completeSsoSignIn(
          userInfo,
          localSid,
          socpsCd,
          stdStatusKor,
          stdProgCode,
          session,
          diagnostic,
        );
      } catch (error) {
        if (attempt >= 3) throw error;
        if (!(error instanceof Prisma.PrismaClientKnownRequestError))
          throw error;
        if (!["P2002", "P2034"].includes(error.code)) throw error;
      }
    }
  }

  @Transactional()
  public async completeSsoSignIn(
    userInfo: ExtractedUserInfo,
    sid: string,
    socpsCd: string,
    stdStatusKor: string | null,
    stdProgCode: string | null,
    session: Request["session"],
    diagnosticContext: SsoLoginDiagnostic,
  ) {
    const diagnostic = diagnosticContext;
    const { studentNumber, email, name, type, department } = userInfo;

    delete diagnostic.userId;
    delete diagnostic.studentId;
    diagnostic.stage = "db.semester.read";
    const queriedAt = this.clock.now();
    diagnostic.db = { semesterQueriedAt: queriedAt };
    const semester = await this.semesterPublicService.loadForLogin(queriedAt);
    diagnostic.db.semester = semester;
    if (!semester) throw new HttpException("Cannot find current semester", 500);
    diagnostic.stage = "user_processing";
    let user: LoginIdentity;
    try {
      const result = await this.userPublicService.syncSsoIdentity(
        {
          email,
          studentNumber,
          sid,
          name,
          type,
          department,
          typeV2: socpsCd,
          statusV2: stdStatusKor,
          progCodeV2: stdProgCode,
        },
        semester,
      );
      user = result.identity;
      diagnostic.stage = result.diagnostic.stage;
      diagnostic.studentId = result.diagnostic.studentId;
      Object.assign(diagnostic.db, result.diagnostic.db);
    } catch (error) {
      if (error instanceof UserIdentitySyncError) {
        diagnostic.stage = error.diagnostic.stage;
        diagnostic.userId = error.diagnostic.userId;
        diagnostic.studentId = error.diagnostic.studentId;
        Object.assign(diagnostic.db, error.diagnostic.db);
        throw error.cause;
      }
      throw error;
    }
    diagnostic.userId = user.id;
    diagnostic.stage = "access_token_issue";
    const accessToken = this.getAccessToken(user);
    diagnostic.secrets ??= [];
    diagnostic.secrets.push(...Object.values(accessToken));
    diagnostic.stage = "refresh_token_issue";
    const refreshToken = this.getRefreshToken(user);
    diagnostic.secrets.push(refreshToken);
    diagnostic.stage = "token_expiry";
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

    diagnostic.stage = "refresh_token_store";
    return (await this.authRepository.createRefreshTokenRecord(
      user.id,
      refreshToken,
      refreshTokenExpiresAt,
    ))
      ? {
          next: nextUrl,
          token,
          isKaistIamLogin: true,
        }
      : (() => {
          throw new HttpException("Cannot store refreshtoken", 500);
        })();
  }

  async hasActiveRefreshSession(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    if (!(await this.userPublicService.isActiveUser(userId))) return false;
    return this.authRepository.hasActiveRefreshToken(userId, refreshToken);
  }

  async postAuthRefresh(_user: {
    id: number;
    sid: string;
    name: string;
    email: string;
    exchangeActor?: ExchangeLoginActor;
  }): Promise<ApiAut002ResponseCreated> {
    const user = await this.userPublicService.findLoginIdentity(_user.id);
    const accessToken = this.getAccessToken(user, _user.exchangeActor);

    return {
      accessToken,
    };
  }

  @Transactional()
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

  getAccessToken(user: LoginIdentity, exchangeActor?: ExchangeLoginActor) {
    const exchangeClaims = exchangeActor ? { exchangeActor } : {};
    const accessToken: ApiAut002ResponseCreated["accessToken"] = {};

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
          ...exchangeClaims,
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
          ...exchangeClaims,
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
          ...exchangeClaims,
        },
        {
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
        },
      );
    }

    if (user.masterDoctor) {
      accessToken.masterDoctor = this.jwtService.sign(
        {
          id: user.id,
          sid: user.sid,
          name: user.name,
          email: user.email,
          type: "masterDoctor",
          studentId: user.masterDoctor.id,
          studentNumber: user.masterDoctor.number,
          ...exchangeClaims,
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
          ...exchangeClaims,
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
          ...exchangeClaims,
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
          ...exchangeClaims,
        },
        {
          secret: this.appConfigService.accessTokenSecretKey,
          expiresIn: this.appConfigService.accessTokenExpiresIn,
        },
      );
    }

    return accessToken;
  }

  getRefreshToken(
    user: {
      id: number;
      sid: string;
      name: string;
      email: string;
    },
    exchangeActor?: ExchangeLoginActor,
  ) {
    const refreshToken = this.jwtService.sign(
      {
        email: user.email,
        id: user.id,
        sid: user.sid,
        name: user.name,
        ...(exchangeActor
          ? { exchangeActor, jti: this.randomGenerator.uuid() }
          : {}),
      },
      {
        secret: this.appConfigService.refreshTokenSecretKey,
        expiresIn: this.appConfigService.refreshTokenExpiresIn,
      },
    );
    return refreshToken;
  }
}
