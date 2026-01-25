import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import {
  ApiSem015RequestBody,
  ApiSem015ResponseCreated,
  ApiSem016ResponseOk,
  ApiSem017ResponseOk,
} from "@clubs/interface/api/semester/index";

import {
  convertDateFieldsToISO,
  takeOnlyOne,
} from "@sparcs-clubs/api/common/util/util";

import UserPublicService from "../../user/service/user.public.service";
import { MActivityDuration } from "../model/activity.duration.model";
import { ActivityDurationRepository } from "../repository/activity.duration.repository";
import { FundingDeadlineSqlRepository } from "../repository/funding.sql.repository";
import { SemesterRepository } from "../repository/semester.repository";

@Injectable()
export class FundingDeadlineService {
  constructor(
    private readonly activityDurationRepository: ActivityDurationRepository,
    private readonly fundingDeadlineSqlRepository: FundingDeadlineSqlRepository,
    private readonly semesterRepository: SemesterRepository,
    private readonly userpulicservice: UserPublicService,
  ) {}

  async createFundingDeadline(
    executiveId: number,
    body: ApiSem015RequestBody,
  ): Promise<ApiSem015ResponseCreated> {
    const { activityDId, deadlineEnum, startTerm, endTerm } = body;

    await this.userpulicservice.checkCurrentExecutiveById(executiveId);

    const activityDuration = await this.activityDurationRepository
      .find({ id: activityDId })
      .then(takeOnlyOne(MActivityDuration));

    if (!activityDuration) {
      throw new HttpException(
        `해당 활동 기간을 찾을 수 없습니다.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (startTerm >= endTerm) {
      throw new HttpException(
        "시작날짜는 종료날짜보다 이전이어야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      await this.fundingDeadlineSqlRepository.checkExistingFundingDeadline(
        activityDuration.semester.id,
        startTerm,
        endTerm,
      )
    ) {
      throw new HttpException(
        "중복되는 기한이 존재합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !(await this.fundingDeadlineSqlRepository.createFundingDeadline(
        startTerm,
        endTerm,
        deadlineEnum,
        activityDuration.semester.id,
      ))
    ) {
      throw new HttpException(
        "Failed to create funding deadline",
        HttpStatus.BAD_REQUEST,
      );
    }

    return {};
  }

  async getFundingDeadlines(
    executiveId: number,
    activityDId?: number,
  ): Promise<ApiSem016ResponseOk> {
    await this.userpulicservice.checkCurrentExecutiveById(executiveId);

    let activityDurations: MActivityDuration[];
    if (activityDId) {
      const found = await this.activityDurationRepository.find({
        id: activityDId,
      });
      if (found.length === 0) {
        throw new HttpException(
          `해당 활동 기간을 찾을 수 없습니다.`,
          HttpStatus.NOT_FOUND,
        );
      }
      activityDurations = found;
    } else {
      activityDurations = await this.activityDurationRepository.find({});
    }
    const deadlines = (
      await Promise.all(
        activityDurations.map(async duration => {
          const fundingDeadlines =
            await this.fundingDeadlineSqlRepository.getFundingDeadlines(
              duration.semester.id,
            );
          // API 응답용: Date 객체를 ISO KST 문자열로 변환
          return convertDateFieldsToISO(
            fundingDeadlines.map(deadline => ({
              id: deadline.id,
              startTerm: deadline.startTerm,
              endTerm: deadline.endTerm,
              deadlineEnum: deadline.deadlineEnum,
              semesterId: duration.semester.id,
              activityDId: duration.id,
            })),
          );
        }),
      )
    ).flat();

    return { deadlines };
  }

  async deleteFundingDeadline(
    executiveId: number,
    deadlineId: number,
  ): Promise<ApiSem017ResponseOk> {
    await this.userpulicservice.checkCurrentExecutiveById(executiveId);
    if (
      !(await this.fundingDeadlineSqlRepository.deleteFundingDeadline(
        deadlineId,
      ))
    ) {
      throw new HttpException(
        "Failed to delete funding deadline",
        HttpStatus.BAD_REQUEST,
      );
    }
    return {};
  }
}
