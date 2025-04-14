import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import type { ApiUsr004ResponseCreated } from "@clubs/interface/api/user/endpoint/apiUsr004";
import type { ApiUsr005ResponseOk } from "@clubs/interface/api/user/endpoint/apiUsr005";

import PrivacyPolicyRepository from "./privacy-policy.repository";

@Injectable()
export default class PrivacyPolicyService {
  constructor(
    private readonly privacyPolicyRepository: PrivacyPolicyRepository,
  ) {}

  /**
   * @param userId User 테이블의 id 입니다.
   * @description getUserPrivacyPolicyStatus 서비스 진입점입니다.
   * @returns 해당 유저의 개인정보 동의를 리턴합니다.
   */
  async getUserPrivacyPolicyStatus(param: {
    userId: number;
  }): Promise<ApiUsr005ResponseOk> {
    const agreements =
      await this.privacyPolicyRepository.selectAgreementByUserId({
        userId: param.userId,
      });
    if (agreements.length > 1)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);

    return {
      status: {
        isAgree: agreements.length === 1,
        updatedAt:
          agreements.length === 1 ? agreements[0].createdAt : undefined,
      },
    };
  }

  /**
   * @param userId User 테이블의 id 입니다.
   * @description postUserPrivacyPolicyAgree의 서비스 진입점입니다.
   * 해당 유저의 개인정보 동의를 기록합니다.
   */
  async postUserPrivacyPolicyAgree(param: {
    userId: number;
  }): Promise<ApiUsr004ResponseCreated> {
    // 이미 동의를 제출했는지의 여부는 트랜잭션에서 검사합니다.
    if (
      !(await this.privacyPolicyRepository.insertAgreementByUserId({
        userId: param.userId,
      }))
    )
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);

    return {};
  }
}
