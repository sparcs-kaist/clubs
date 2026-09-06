import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";

import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";

import { ClubRegistrationRepository } from "../repository/club-registration.repository";
import { MemberRegistrationRepository } from "../repository/member-registration.repository";

@Injectable()
export class RegistrationPublicService {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private readonly clubRegistrationRepository: ClubRegistrationRepository,
    private readonly memberRegistrationRepository: MemberRegistrationRepository,
  ) {}

  /**
   * @param RegistrationEventEnum의 배열의 객체
   * @returns void
   * @description 오늘 날짜가 enums배열에 존재하는 이벤트의 마감일에 속하는지 확인합니다.
   */
  async checkDeadline(param: { enums: Array<RegistrationDeadlineEnum> }) {
    const today = this.clock.now();
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

  async isDeadline(param: {
    enums: Array<RegistrationDeadlineEnum>;
  }): Promise<boolean> {
    const deadlines =
      await this.clubRegistrationRepository.selectDeadlineByDate(
        this.clock.now(),
        param.enums,
      );
    return deadlines.length > 0;
  }

  async getRegisteredClubIds(
    clubIds: number[],
    semesterId: number,
  ): Promise<number[]> {
    // ponytail: 집행부 전용 저빈도 목록은 기존 단건 조회를 재사용한다. 병목이 확인되면 배치 조회로 교체한다.
    const registrations = await Promise.all(
      clubIds.map(clubId =>
        this.clubRegistrationRepository.findByClubAndSemesterId(
          clubId,
          semesterId,
        ),
      ),
    );
    return clubIds.filter((_, index) => registrations[index].length > 0);
  }

  async hasClubRegistration(
    clubId: number,
    semesterId: number,
  ): Promise<boolean> {
    const ids = await this.getRegisteredClubIds([clubId], semesterId);
    return ids.length > 0;
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

  @Transactional()
  async rejectPendingMemberRegistrations(
    clubId: number,
    semesterId: number,
  ): Promise<void> {
    await this.memberRegistrationRepository.rejectPending(clubId, semesterId);
  }
}
