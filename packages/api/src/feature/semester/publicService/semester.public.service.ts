import { Injectable } from "@nestjs/common";

import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { BasePublicService } from "@sparcs-clubs/api/common/base/base.public.service";
import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import { MSemester, SemesterQuery } from "../model/semester.model";
import { RegistrationDeadlineRepository } from "../repository/registration.deadline.repository";
import { SemesterRepository } from "../repository/semester.repository";

type SemesterSearchQuery = {};

type SemesterLoadQuery = {
  date?: Date;
};

type SemesterIsQuery = {
  id: number;
  date?: Date;
};

@Injectable()
export class SemesterPublicService extends BasePublicService<
  MSemester,
  SemesterQuery,
  SemesterLoadQuery,
  SemesterIsQuery,
  SemesterSearchQuery
> {
  constructor(
    private readonly semesterRepository: SemesterRepository,
    private readonly registrationDeadlineRepository: RegistrationDeadlineRepository,
  ) {
    super(semesterRepository, MSemester);
  }

  /**
   * @description 해당 Semester이 해당 date를 포함하는 지 여부를 반환합니다.
   * @param id Semester ID
   * @param date? Date, 기본값: 현재 시간
   * @returns 해당 Semester이 해당 date를 포함하는 지 여부
   */
  async is(query: SemesterIsQuery): Promise<boolean> {
    const queryParam = {
      ...query,
      date: query.date ?? new Date(),
    };

    const res = await super.is(queryParam);
    return res;
  }

  /**
   * @description 해당 date가 해당 Semester 인지 검증합니다.
   * @param id Semester ID
   * @param date? Date, 기본값: 현재 시간
   * @throws BadRequestException 해당 date가 해당 Semester 가 아닐 경우
   */
  async validate(query: SemesterIsQuery): Promise<void> {
    await super.validate(query);
  }

  /**
   * @description 해당 date를 포함하는 학기를 반환합니다.
   * @param date? Date, 기본값: 현재 시간
   * @returns MSemester of the semester
   * @throws NotFoundException 해당 학기가 존재하지 않을 경우 (DB에 안 넣은 것임)
   */
  async load(query?: SemesterLoadQuery): Promise<MSemester> {
    const dateParam = query?.date ?? new Date();

    const res = await super.load({
      date: dateParam,
    });
    return res;
  }

  /**
   * @description 해당 학기의 활동 마감 기한의 ID를 반환합니다.
   * @param date? Date, 기본값: 현재 시간
   * @returns MSemester of the semester
   * @throws NotFoundException 해당 학기가 존재하지 않을 경우 (DB에 안 넣은 것임)
   */
  async loadId(query?: SemesterLoadQuery): Promise<number> {
    const semester = await this.load(query);
    return semester.id;
  }

  // TODO: 아래 두 함수 적용해야 할 곳 (등록기간에 이전 학기 정보로 표기되어야 하는 곳들)에 적용해야 함
  /**
   * @description 만약 지금이 동아리 등록 제출 기간일 경우 이전 학기를, 그렇지 않으면 현재 학기를 반환합니다.
   * @param date? Date, 기본값: 현재 시간
   * @returns MSemester
   * @throws NotFoundException 해당 학기가 존재하지 않을 경우 (DB에 안 넣은 것임)
   */
  async loadCheckRegistrationDeadline(): Promise<MSemester> {
    const today = new Date();
    const semester = await this.load();
    const checkFlag = await this.registrationDeadlineRepository.count({
      deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
      date: today,
    });
    if (checkFlag > 0) {
      // 지금이 동아리 등록 제출 기간일 경우
      const previousSemester = await this.semesterRepository
        .find({
          endTerm: semester.startTerm,
        })
        .then(takeOnlyOne());
      return previousSemester;
    }
    return semester;
  }

  /**
   * @description 만약 지금이 동아리 등록 제출 기간일 경우 이전 학기를, 그렇지 않으면 현재 학기를 반환합니다.
   * @description 위 조건의 id를 반환합니다.
   * @param date? Date, 기본값: 현재 시간
   * @returns id of the semester
   * @throws NotFoundException 해당 학기가 존재하지 않을 경우 (DB에 안 넣은 것임)
   */
  async loadIdCheckRegistrationDeadline(): Promise<number> {
    const semester = await this.loadCheckRegistrationDeadline();
    return semester.id;
  }
}
