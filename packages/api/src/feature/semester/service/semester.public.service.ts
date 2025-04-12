import { BadRequestException, Injectable } from "@nestjs/common";

import {
  ActivityDeadlineEnum,
  ActivityDurationTypeEnum,
} from "@sparcs-clubs/interface/common/enum/activity.enum";
import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { takeOne, takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import { MActivityDeadline } from "../model/activity.deadline.model";
import { MActivityDuration } from "../model/activity.duration.model";
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
   * @description 현재의 semester를 조회합니다.
   * @param date?
   * @returns date(or now)를 포함하는 semester
   */

  async getSemesterByDate(date?: Date): Promise<MSemester> {
    const dateParam = date ?? new Date();
    const semester = await this.semesterRepository
      .find({ date: dateParam })
      .then(takeOnlyOne("Semester"));
    return semester;
  }

  /**
   * @description id를 통해 semester를 조회합니다.
   * @param id
   * @returns id에 따른 semester
   * @throws 만약 id에 따른 semester가 없으면 404 에러를 던집니다.
   */
  async fetchSemester(id: number): Promise<MSemester> {
    const semester = await this.semesterRepository.fetch(id);
    return semester;
  }

  /**
   * @description ids를 통해 semester를 조회합니다.
   * @param ids
   * @returns ids에 따른 모든 semester
   * 만약 모든 id에 대해 조회되지 않는 semester가 있으면 404 에러를 던집니다.
   */
  async fetchSemesterAll(ids: number[]): Promise<MSemester[]> {
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

    const semester = await this.getSemesterByDate(dateParam);

    return semester;
  }

  ///////////////////////////////////////////////////
  // ActivityDuration

  /**
   * @description 해당 기간(or semester)에 속한 MActivityDuration을 조회합니다.
   * @param undefined: 현재 시간이 속해 있는 semester 기준으로 조회
   * @param {Date} date 조회하고 싶은 활동기간 내부의 임의 날짜
   * @param {number} semesterId 해당 활동기간이 속한 semester의 id
   * @returns MActivityDuration: 해당 날짜를 포함하는 활동 기간 정보를 리턴합니다.
   * @warning date가 속한 semester의 기준으로
   */

  async getActivityDuration(date?: Date): Promise<MActivityDuration>;
  async getActivityDuration(semesterId?: number): Promise<MActivityDuration>;
  async getActivityDuration(arg1?: Date | number): Promise<MActivityDuration> {
    const semesterId =
      typeof arg1 === "number"
        ? arg1
        : await this.getSemesterByDate(arg1).then(e => e.id);
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

  async getActivityDurationForRegistration(
    date?: Date,
  ): Promise<MActivityDuration>;
  async getActivityDurationForRegistration(
    semesterId?: number,
  ): Promise<MActivityDuration>;
  async getActivityDurationForRegistration(
    arg1?: Date | number,
  ): Promise<MActivityDuration> {
    const semesterId =
      typeof arg1 === "number"
        ? arg1
        : await this.getSemesterByDate(arg1).then(e => e.id);
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

  async getActivityDeadline(date?: Date): Promise<MActivityDeadline> {
    const dateParam = date ?? new Date();

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
    const dateParam = date ?? new Date();
    const activityDeadline = await this.activityDeadlineRepository.find({
      deadlineEnums: activityDeadlineEnums,
      date: dateParam,
    });
    return activityDeadline.length > 0;
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
    const isDeadline = await this.isActivityDeadline(
      activityDeadlineEnums,
      date,
    );
    if (!isDeadline) {
      throw new BadRequestException(
        `${date} is not activity deadline ${activityDeadlineEnums} period`,
      );
    }
  }

  ///////////////////////////////////////////////////
  // FundingDeadline

  ///////////////////////////////////////////////////
  // RegistrationDeadline

  /**
   * @description 해당 RegistrationDeadlineEnum 기간인 Date를 포함하는 ClubRegistrationDeadline을 조회합니다.
   * @param registrationDeadlineEnum
   * @param date? 비울 경우 현재 시간을 기준으로 조회
   * @returns date 를 포함하는 RegistrationDeadline
   */

  async getRegistrationDeadline(
    registrationDeadlineEnum: RegistrationDeadlineEnum, // TODO: 나중에 여러개 추가할 수 있도록 배열로 받도록 수정
    date?: Date,
  ): Promise<MRegistrationDeadline> {
    const dateParam = date ?? new Date();

    const registrationDeadline = await this.registrationDeadlineRepository
      .find({
        date: dateParam,
        deadlineEnum: registrationDeadlineEnum,
      })
      .then(takeOne);

    return registrationDeadline;
  }

  /**
   * @description 해당 date(now)가 해당 RegistrationDeadlineEnum 기간인지 확인합니다.
   * @param registrationDeadlineEnum
   * @param date?
   * @returns boolean
   */

  async isRegistrationDeadline(
    registrationDeadlineEnums: RegistrationDeadlineEnum[],
    date?: Date,
  ): Promise<boolean> {
    const dateParam = date ?? new Date();
    const registrationDeadline = await this.registrationDeadlineRepository.find(
      {
        deadlineEnums: registrationDeadlineEnums,
        date: dateParam,
      },
    );
    return registrationDeadline.length > 0;
  }

  /**
   * @description 해당 date(now)가 해당 activityDeadlineEnum 기간인 경우 그냥 넘어가고, 아니면 기간 bad request 에러를 발생시킵니다.
   * @param activityDeadlineEnum
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
