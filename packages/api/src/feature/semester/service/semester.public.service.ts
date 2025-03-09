import { BadRequestException, Injectable } from "@nestjs/common";

import { ActivityDeadlineEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";

import {
  getKSTDate,
  takeAll,
  takeOne,
  takeOnlyOne,
} from "@sparcs-clubs/api/common/util/util";

import { MActivityDeadline } from "../model/activity.deadline.model";
import { MSemester } from "../model/semester.model";
import { ActivityDurationRepository } from "../repository/activity.activity-term.repository";
import { ActivityDeadlineRepository } from "../repository/activity.deadline.repository";
import { FundingDeadlineRepository } from "../repository/funding.deadline.repository";
import { RegistrationDeadlineRepository } from "../repository/registration.deadline.repository";
import { SemesterRepository } from "../repository/semester.repository";

@Injectable()
export class SemesterPublicService {
  constructor(
    private readonly semesterRepository: SemesterRepository,
    private readonly activityDurationRepository: ActivityDurationRepository,
    private readonly activityDeadlineRepository: ActivityDeadlineRepository,
    private readonly fundingDeadlineRepository: FundingDeadlineRepository,
    private readonly registrationDeadlineRepository: RegistrationDeadlineRepository,
  ) {}

  /**
   * @description 현재의 semester를 조회합니다.
   * @param date?
   * @returns date(now)를 포함하는 semester
   */

  async getSemesterByDate(date?: Date): Promise<MSemester> {
    const dateParam = date ?? getKSTDate();
    const semester = await this.semesterRepository
      .find({ date: dateParam })
      .then(takeOnlyOne("Semester"));
    return semester;
  }

  /**
   * @description id를 통해 semester를 조회합니다.
   * @param id
   * @returns id에 따른 semester
   * 만약 id에 따른 semester가 없으면 404 에러를 던집니다.
   */
  async fetchSemester(id: number): Promise<MSemester> {
    const semester = await this.semesterRepository
      .find({ id })
      .then(takeOnlyOne("Semester"));
    return semester;
  }

  /**
   * @description ids를 통해 semester를 조회합니다.
   * @param ids
   * @returns ids에 따른 모든 semester
   * 만약 모든 id에 대해 조회되지 않는 semester가 있으면 404 에러를 던집니다.
   */
  async fetchSemesterAll(ids: number[]): Promise<MSemester[]> {
    const semester = await this.semesterRepository
      .find({ ids })
      .then(takeAll(ids, "Semester"));
    return semester;
  }

  /**
   * @description Date를 포함하는 ActivityDeadline을 조회합니다.
   * @param date?
   * @returns date 를 포함하는 ActivityDeadline | null
   */

  async getActivityDeadline(date?: Date): Promise<MActivityDeadline | null> {
    const dateParam = date ?? getKSTDate();

    const activityDeadline = await this.activityDeadlineRepository
      .find({ date: dateParam })
      .then(takeOne);

    return activityDeadline;
  }

  /**
   * @description 해당 date(now)가 해당 activityDeadlineEnum 기간인지 확인합니다.
   * @param activityDeadlineEnum
   * @param date?
   * @returns boolean
   */

  async isActivityDeadline(
    activityDeadlineEnums: ActivityDeadlineEnum[],
    date?: Date,
  ): Promise<boolean> {
    const dateParam = date ?? getKSTDate();
    const activityDeadline = await this.getActivityDeadline(dateParam);
    return (
      activityDeadline !== null &&
      activityDeadlineEnums.includes(activityDeadline.deadlineEnum)
    );
  }

  /**
   * @description 해당 date(now)가 해당 activityDeadlineEnum 기간인 경우 그냥 넘어가고, 아니면 기간 bad request 에러를 발생시킵니다.
   * @param activityDeadlineEnum
   * @param date?
   * @returns void
   */

  async validateActivityDeadline(
    activityDeadlineEnums: ActivityDeadlineEnum[],
    date?: Date,
  ): Promise<void> {
    const dateParam = date ?? getKSTDate();
    const isActivityDeadline = await this.isActivityDeadline(
      activityDeadlineEnums,
      dateParam,
    );
    if (!isActivityDeadline) {
      throw new BadRequestException(
        `${date} is not activity deadline ${activityDeadlineEnums} period`,
      );
    }
  }

  /**
   * @description 동아리 등록 기간을 고려하여 semester를 조회합니다.
   * 동아리 등록 기간 중엔 이전 semester를 조회합니다.
   * 동아리 등록 기간에 동아리가 일시적으로 빌 때를 조정할 필요가 있는 경우 사용합니다.
   * @param date?
   * @returns date 를 포함하는 semester or 동아리 등록 기간 중엔 이전 semester
   */
  async findSemesterCheckClubRegistrationDeadline(
    date?: Date,
  ): Promise<MSemester> {
    const dateParam = date ?? getKSTDate();

    const semester = await this.getSemesterByDate(dateParam);

    return semester;
  }
}
