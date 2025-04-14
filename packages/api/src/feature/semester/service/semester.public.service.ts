import { BadRequestException, Injectable } from "@nestjs/common";

import {
  ActivityDeadlineEnum,
  ActivityDurationTypeEnum,
} from "@sparcs-clubs/interface/common/enum/activity.enum";
import { FundingDeadlineEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";
import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { takeOnlyOne, takeToArray } from "@sparcs-clubs/api/common/util/util";

import { MActivityDeadline } from "../model/activity.deadline.model";
import { MActivityDuration } from "../model/activity.duration.model";
import { MFundingDeadline } from "../model/funding.deadline.model";
import { MRegistrationDeadline } from "../model/registration.deadline.model";
import { MSemester } from "../model/semester.model";
import { ActivityDeadlineRepository } from "../repository/activity.deadline.repository";
import { ActivityDurationRepository } from "../repository/activity.duration.repository";
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

  ///////////////////////////////////////////////////
  // Semester

  /**
   * @description id를 통해 semester를 조회합니다.
   * @param id
   * @returns
   * @throws 만약 id에 따른 semester가 없으면 404 에러를 던집니다.
   */

  async getSemesterById(id: number): Promise<MSemester> {
    const semester = await this.semesterRepository.fetch(id);
    return semester;
  }

  /**
   * @description ids를 통해 semester를 조회합니다.
   * @param ids
   * @returns ids에 따른 모든 semester
   * 만약 모든 id에 대해 조회되지 않는 semester가 있으면 404 에러를 던집니다.
   */
  async getSemestersByIds(ids: number[]): Promise<MSemester[]> {
    const semesters = await this.semesterRepository.fetchAll(ids);
    return semesters;
  }

  /**
   * @description id를 통해 semester를 조회합니다.
   * @overload loadSemester(): 현재 시간이 속한 semester 기준으로 조회합니다.
   * @overload loadSemester(date: Date): id에 따른 semester
   * @returns
   * @throws 만약 id에 따른 semester가 없으면 404 에러를 던집니다.
   */

  async loadSemester(date?: Date): Promise<MSemester> {
    const dateParam = date ?? new Date();
    const semester = await this.semesterRepository
      .find({ date: dateParam })
      .then(takeOnlyOne());

    return semester;
  }

  /**
   * @description 동아리 등록 기간을 고려하여 semester를 조회합니다.
   * 동아리 등록 기간 중엔 이전 semester를 조회합니다.
   * 동아리 등록 기간에 동아리가 일시적으로 빌 때를 조정할 필요가 있는 경우 사용합니다.
   * @param date?
   * @returns date 를 포함하는 semester or 동아리 등록 기간 중엔 이전 semester
   */
  async loadSemesterCheckClubRegistrationDeadline(
    date?: Date,
  ): Promise<MSemester> {
    const dateParam = date ?? new Date();

    const isClubRegistration = await this.isRegistrationDeadline(
      RegistrationDeadlineEnum.ClubRegistrationApplication,
      dateParam,
    );

    const semester = await this.semesterRepository
      .find({
        date: dateParam,
      })
      .then(takeOnlyOne());

    if (isClubRegistration) {
      const previousSemester = await this.semesterRepository.fetch(
        semester.id - 1,
      );
      return previousSemester;
    }

    return semester;
  }

  ///////////////////////////////////////////////////
  // ActivityDuration

  async getActivityDurationById(id: number): Promise<MActivityDuration> {
    const activityDuration = await this.activityDurationRepository.fetch(id);
    return activityDuration;
  }

  /**
   * @description ids를 통해 activityDuration를 조회합니다.
   * @param ids
   * @returns ids에 따른 모든 activityDuration
   * 만약 모든 id에 대해 조회되지 않는 semester가 있으면 404 에러를 던집니다.
   */
  async getActivityDurationsByIds(ids: number[]): Promise<MActivityDuration[]> {
    const activityDurations =
      await this.activityDurationRepository.fetchAll(ids);
    return activityDurations;
  }

  /**
   * @description 해당 기간(or semester)에 속한 MActivityDuration을 조회합니다.
   * @overload loadActivityDuration(): 현재 시간이 속한 semester 기준으로 조회합니다.
   * @overload loadActivityDuration(date: Date): 주어진 날짜가 포함된 활동 기간을 조회합니다.
   * @overload loadActivityDuration(semesterId: number): 주어진 semesterId의 활동 기간을 조회합니다.
   * @param {Date | number} [arg1] - 날짜 또는 semesterId (선택사항)
   * @returns {MActivityDuration} 해당 날짜를 포함하는 활동 기간 정보를 리턴합니다.
   */

  async loadActivityDuration(query: {
    date?: Date;
    semesterId?: number;
  }): Promise<MActivityDuration> {
    const semesterId =
      query.semesterId ??
      (await this.loadSemester(query.date ?? new Date()).then(e => e.id));
    const res = await this.activityDurationRepository
      .find({
        semesterId,
        activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
      })
      .then(takeOnlyOne("ActivityDuration"));

    return res;
  }

  /**
   * @description 해당 기간(or semester)에 속한 MActivityDuration을 조회합니다.
   * @param undefined: 현재 시간이 속해 있는 semester 기준으로 조회
   * @param {Date} date 조회하고 싶은 활동기간 내부의 임의 날짜
   * @param {number} semesterId 해당 활동기간이 속한 semester의 id
   * @returns {MActivityDuration} 해당 날짜를 포함하는 활동 기간 정보를 리턴합니다.
   * @warning date가 속한 semester의 기준으로 반환합니다. (activityD의 startTerm endTerm 기준이 아님)
   */

  async loadActivityDurationForRegistration(
    date?: Date,
  ): Promise<MActivityDuration>;
  async loadActivityDurationForRegistration(
    semesterId?: number,
  ): Promise<MActivityDuration>;
  async loadActivityDurationForRegistration(
    arg1?: Date | number,
  ): Promise<MActivityDuration> {
    const semesterId =
      typeof arg1 === "number"
        ? arg1
        : await this.loadSemester(arg1).then(e => e.id);
    const res = await this.activityDurationRepository
      .find({
        semesterId,
        activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
      })
      .then(takeOnlyOne());

    return res;
  }

  ///////////////////////////////////////////////////
  // ActivityDeadline
  /**
   * @description Date를 포함하는 ActivityDeadline을 조회합니다.
   * @param date? 비울 경우 현재 시간을 기준으로 조회
   * @returns date 를 포함하는 ActivityDeadline
   */

  async searchActivityDeadline(
    deadlineEnum: ActivityDeadlineEnum,
    date?: Date,
  ): Promise<MActivityDeadline | null> {
    const dateParam = date ?? new Date();

    const activityDeadline = await this.activityDeadlineRepository
      .find({
        deadlineEnums: [deadlineEnum],
        date: dateParam,
      })
      .then(takeOnlyOne());

    return activityDeadline;
  }

  /**
   * @description 해당 date(now)가 해당 ActivityDeadlineEnum 기간인지 확인합니다.
   * @param activityDeadlineEnum
   * @param date?
   * @returns boolean
   */

  async isActivityDeadline(
    deadlineEnum: ActivityDeadlineEnum,
    date?: Date,
  ): Promise<boolean> {
    const dateParam = date ?? new Date();
    const count = await this.activityDeadlineRepository.count({
      deadlineEnums: [deadlineEnum],
      date: dateParam,
    });
    return count > 0;
  }

  /**
   * @description 해당 date(now)가 해당 activityDeadlineEnum 기간인 경우 그냥 넘어가고, 아니면 기간 bad request 에러를 발생시킵니다.
   * @param activityDeadlineEnum
   * @param date?
   * @returns void
   */

  async validateActivityDeadline(
    deadlineEnum: ActivityDeadlineEnum,
    date?: Date,
  ): Promise<void> {
    const isDeadline = await this.isActivityDeadline(deadlineEnum, date);
    if (!isDeadline) {
      throw new BadRequestException(
        `${date} is not activity deadline ${deadlineEnum} period`,
      );
    }
  }

  ///////////////////////////////////////////////////
  // FundingDeadline

  /**
   * @description Date를 포함하는 FundingDeadline을 조회합니다.
   * @param date? 비울 경우 현재 시간을 기준으로 조회
   * @returns date 를 포함하는 FundingDeadline
   */

  async searchFundingDeadline(date?: Date): Promise<MFundingDeadline | null> {
    const dateParam = date ?? new Date();

    const fundingDeadline = await this.fundingDeadlineRepository
      .find({ date: dateParam })
      .then(takeOnlyOne());

    return fundingDeadline;
  }

  /**
   * @description 해당 date(now)가 해당 activityDeadlineEnum 기간인지 확인합니다.
   * @param activityDeadlineEnum
   * @param date?
   * @returns boolean
   */

  async isFundingDeadline(
    deadlineEnums: FundingDeadlineEnum | FundingDeadlineEnum[],
    date?: Date,
  ): Promise<boolean> {
    const dateParam = date ?? new Date();
    const fundingDeadlineCount = await this.fundingDeadlineRepository.count({
      deadlineEnums: takeToArray(deadlineEnums),
      date: dateParam,
    });
    return fundingDeadlineCount > 0;
  }

  /**
   * @description 해당 date(now)가 해당 activityDeadlineEnum 기간인 경우 그냥 넘어가고, 아니면 기간 bad request 에러를 발생시킵니다.
   * @param fundingDeadlineEnum
   * @param date?
   * @returns void
   */

  async validateFundingDeadline(query: {
    deadlineEnums: FundingDeadlineEnum | FundingDeadlineEnum[];
    date?: Date;
  }): Promise<void> {
    const { deadlineEnums, date } = query;
    const isDeadline = await this.isFundingDeadline(deadlineEnums, date);
    if (!isDeadline) {
      throw new BadRequestException(
        `${date} is not funding deadline ${deadlineEnums} period`,
      );
    }
  }

  ///////////////////////////////////////////////////
  // RegistrationDeadline

  /**
   * @description 해당 RegistrationDeadlineEnum 기간인 Date를 포함하는 ClubRegistrationDeadline을 조회합니다.
   * @param registrationDeadlineEnum
   * @param date? 비울 경우 현재 시간을 기준으로 조회
   * @returns date 를 포함하는 RegistrationDeadline
   */

  async searchRegistrationDeadline(
    registrationDeadlineEnum: RegistrationDeadlineEnum, // TODO: 나중에 여러개 추가할 수 있도록 배열로 받도록 수정
    date?: Date,
  ): Promise<MRegistrationDeadline | null> {
    const dateParam = date ?? new Date();

    const registrationDeadline = await this.registrationDeadlineRepository
      .find({
        date: dateParam,
        deadlineEnum: registrationDeadlineEnum,
      })
      .then(takeOnlyOne());

    return registrationDeadline;
  }

  /**
   * @description 해당 date(now)가 해당 RegistrationDeadlineEnum 기간인지 확인합니다.
   * @overload isRegistrationDeadline(registrationDeadlineEnum: RegistrationDeadlineEnum, date?: Date): Promise<boolean>
   * @overload isRegistrationDeadline(registrationDeadlineEnums: RegistrationDeadlineEnum[], date?: Date): Promise<boolean>
   * @param registrationDeadlineEnumOrEnums
   * @param date?
   * @returns boolean
   */

  async isRegistrationDeadline(
    deadlineEnums: RegistrationDeadlineEnum[],
    date?: Date,
  ): Promise<boolean>;
  async isRegistrationDeadline(
    deadlineEnum: RegistrationDeadlineEnum,
    date?: Date,
  ): Promise<boolean>;
  async isRegistrationDeadline(
    registrationDeadlineEnumOrEnums:
      | RegistrationDeadlineEnum
      | RegistrationDeadlineEnum[],
    date?: Date,
  ): Promise<boolean> {
    const dateParam = date ?? new Date();
    const deadlineEnums = takeToArray(registrationDeadlineEnumOrEnums);
    const count = await this.registrationDeadlineRepository.count({
      deadlineEnums,
      date: dateParam,
    });
    return count > 0;
  }

  /**
   * @description 해당 date(now)가 해당 activityDeadlineEnum 기간인 경우 그냥 넘어가고, 아니면 기간 bad request 에러를 발생시킵니다.
   * @overload validateRegistrationDeadline(registrationDeadlineEnums: RegistrationDeadlineEnum[], date?: Date): Promise<void>
   * @overload validateRegistrationDeadline(registrationDeadlineEnums: RegistrationDeadlineEnum[], date?: Date): Promise<void>
   * @param registrationDeadlineEnums
   * @param date?
   * @returns void
   */

  async validateRegistrationDeadline(
    registrationDeadlineEnum: RegistrationDeadlineEnum,
    date?: Date,
  ): Promise<void>;
  async validateRegistrationDeadline(
    registrationDeadlineEnums: RegistrationDeadlineEnum[],
    date?: Date,
  ): Promise<void>;
  async validateRegistrationDeadline(
    registrationDeadlineEnumOrEnums:
      | RegistrationDeadlineEnum
      | RegistrationDeadlineEnum[],
    date?: Date,
  ): Promise<void> {
    const registrationDeadlineEnums = takeToArray(
      registrationDeadlineEnumOrEnums,
    );
    const isDeadline = await this.isRegistrationDeadline(
      registrationDeadlineEnums,
      date,
    );
    if (!isDeadline) {
      throw new BadRequestException(
        `${date} is not registration deadline ${registrationDeadlineEnums} period`,
      );
    }
  }
}

// backlogs
// updated: 25.04.13
// 1. DeadlineEnum / EnumsArray 오버로딩 (with util takeToArray)
// 2. deadline exception 모듈화하기
