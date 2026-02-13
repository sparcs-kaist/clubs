import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class PrivacyPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param userId User 테이블의 id
   * @description 해당 유저의 개인정보 제공 및 활용동의를 기록합니다.
   * @returns 기록 성공 여부를 boolean으로 리턴합니다.
   * 실패의 경우 exception을 발생시키기 때문에 항상 true를 리턴해야 합니다.
   */
  async insertAgreementByUserId(param: { userId: number }): Promise<boolean> {
    const isInsertionSucceed = await this.prisma.$transaction<boolean>(
      async tx => {
        // 이미 개인정보 제공동의를 제출한 유저인지 검사합니다.
        const agreements = await tx.userPrivacyPolicyAgreement.findMany({
          where: {
            userId: param.userId,
            deletedAt: null,
          },
        });
        if (agreements.length !== 0)
          throw new HttpException(
            "You already agreed to privacy-policy",
            HttpStatus.BAD_REQUEST,
          );

        await tx.userPrivacyPolicyAgreement.create({
          data: { userId: param.userId },
        });

        return true;
      },
    );

    return isInsertionSucceed;
  }

  /**
   * @param userId User 테이블의 id
   * @returns 해당 유저의 개인정보 제공 및 활용동의를 조회합니다.
   * 리턴 배열의 길이가 1인지 검사하지 않습니다.
   */
  async selectAgreementByUserId(param: { userId: number }) {
    const result = await this.prisma.userPrivacyPolicyAgreement.findMany({
      where: {
        userId: param.userId,
        deletedAt: null,
      },
    });

    return result;
  }
}
