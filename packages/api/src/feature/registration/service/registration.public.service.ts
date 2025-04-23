import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";

import { ClubRegistrationRepository } from "../repository/club-registration.repository";

@Injectable()
export class RegistrationPublicService {
  constructor(
    private readonly clubRegistrationRepository: ClubRegistrationRepository,
  ) {}

  /**
   * @param RegistrationEventEnum의 배열의 객체
   * @returns void
   * @description 오늘 날짜가 enums배열에 존재하는 이벤트의 마감일에 속하는지 확인합니다.
   */
  async checkDeadline(param: { enums: Array<RegistrationDeadlineEnum> }) {
    const today = getKSTDate();
    await this.clubRegistrationRepository
      .selectDeadlineByDate(today, param.enums)
      .then(arr => {
        if (arr.length === 0)
          throw new HttpException(
            `Today(${today}) is not in the range of deadline`,
            HttpStatus.BAD_REQUEST,
          );
        return arr[0];
      });
  }

  /**
   * @param clubId
   * @returns void
   * @description clubId에 해당하는 동아리의 신청 상태를 초기화합니다.
   */
  async resetClubRegistrationStatusEnum(clubId: number) {
    await this.clubRegistrationRepository.resetClubRegistrationStatusEnum(
      clubId,
    );
  }
}
