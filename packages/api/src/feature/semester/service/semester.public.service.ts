import { BadRequestException, Injectable } from "@nestjs/common";

import {
  ActivityDeadlineEnum,
  ActivityDurationTypeEnum,
} from "@sparcs-clubs/interface/common/enum/activity.enum";
import { FundingDeadlineEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";
import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

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
   * @overload loadSemester(): 현재 시간이 속한 semester 기준으로 조회합니다.
   * @overload loadSemester(id: number): date(or now)를 포함하는 semester
   * @overload loadSemester(date: Date): id에 따른 semester
   * @param id
   * @returns
   * @throws 만약 id에 따른 semester가 없으면 404 에러를 던집니다.
   */
  async loadSemester(): Promise<MSemester>;
  async loadSemester(id?: number): Promise<MSemester>;
  async loadSemester(date?: Date): Promise<MSemester>;
  async loadSemester(arg1?: Date | number): Promise<MSemester> {
    let semester: MSemester;

    if (typeof arg1 === "number") {
      semester = await this.semesterRepository.fetch(arg1);
    } else {
      const dateParam = arg1 ?? new Date();
      semester = await this.semesterRepository
        .find({ date: dateParam })
        .then(takeOnlyOne());
    }
    return semester;
  }

  /**
   * @description ids를 통해 semester를 조회합니다.
   * @param ids
   * @returns ids에 따른 모든 semester
   * 만약 모든 id에 대해 조회되지 않는 semester가 있으면 404 에러를 던집니다.
   */
  async loadSemesterAll(ids: number[]): Promise<MSemester[]> {
    const semester = await this.semesterRepository.fetchAll(ids);
    return semester;
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
    const dateParam = date ?? new Date();

    const semester = await this.loadSemester(dateParam);

    return semester;
  }

  ///////////////////////////////////////////////////
  // ActivityDuration

  /**
   * @description 해당 기간(or semester)에 속한 MActivityDuration을 조회합니다.
   * @overload loadActivityDuration(): 현재 시간이 속한 semester 기준으로 조회합니다.
   * @overload loadActivityDuration(date: Date): 주어진 날짜가 포함된 활동 기간을 조회합니다.
   * @overload loadActivityDuration(semesterId: number): 주어진 semesterId의 활동 기간을 조회합니다.
   * @param {Date | number} [arg1] - 날짜 또는 semesterId (선택사항)
   * @returns {MActivityDuration} 해당 날짜를 포함하는 활동 기간 정보를 리턴합니다.
   */

  async loadActivityDuration(): Promise<MActivityDuration>;
  async loadActivityDuration(date?: Date): Promise<MActivityDuration>;
  async loadActivityDuration(semesterId?: number): Promise<MActivityDuration>;
  async loadActivityDuration(arg1?: Date | number): Promise<MActivityDuration> {
    const semesterId =
      typeof arg1 === "number"
        ? arg1
        : await this.loadSemester(arg1).then(e => e.id);
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

  async loadActivityDeadline(
    deadlineEnum: ActivityDeadlineEnum,
    date?: Date,
  ): Promise<MActivityDeadline> {
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

  async loadFundingDeadline(date?: Date): Promise<MFundingDeadline> {
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
    deadlineEnum: FundingDeadlineEnum,
    date?: Date,
  ): Promise<boolean> {
    const dateParam = date ?? new Date();
    const fundingDeadlineCount = await this.fundingDeadlineRepository.count({
      deadlineEnums: [deadlineEnum],
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

  async validateFundingDeadline(
    deadlineEnum: FundingDeadlineEnum,
    date?: Date,
  ): Promise<void> {
    const isDeadline = await this.isFundingDeadline(deadlineEnum, date);
    if (!isDeadline) {
      throw new BadRequestException(
        `${date} is not funding deadline ${deadlineEnum} period`,
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

  async loadRegistrationDeadline(
    registrationDeadlineEnum: RegistrationDeadlineEnum, // TODO: 나중에 여러개 추가할 수 있도록 배열로 받도록 수정
    date?: Date,
  ): Promise<MRegistrationDeadline> {
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
   * @param registrationDeadlineEnum
   * @param date?
   * @returns boolean
   */

  async isRegistrationDeadline(
    deadlineEnums: RegistrationDeadlineEnum[],
    date?: Date,
  ): Promise<boolean> {
    const dateParam = date ?? new Date();
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
    registrationDeadlineEnums: RegistrationDeadlineEnum[],
    date?: Date,
  ): Promise<void> {
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
