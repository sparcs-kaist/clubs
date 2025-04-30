import { Injectable } from "@nestjs/common";

import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

import { ApiAct018ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct018";
import type {
  ApiSem001RequestQuery,
  ApiSem001ResponseOK,
} from "@clubs/interface/api/semester/apiSem001";
import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import { MActivityDuration } from "../model/activity.duration.model";
import { MSemester } from "../model/semester.model";
import { ActivityDeadlineRepository } from "../repository/activity.deadline.repository";
import { ActivityDurationRepository } from "../repository/activity.duration.repository";
import { SemesterRepository } from "../repository/semester.repository";

@Injectable()
export class SemesterService {
  constructor(
    private readonly semesterRepository: SemesterRepository,
    private readonly activityDurationRepository: ActivityDurationRepository,
    private readonly activityDeadlineRepository: ActivityDeadlineRepository,
  ) {}

  /**
   * @description getPublicSemesters의 서비스 진입점입니다.
   * @param query
   * @returns
   */
  async getPublicSemesters(param: {
    query: ApiSem001RequestQuery;
  }): Promise<ApiSem001ResponseOK> {
    const { pageOffset, itemCount } = param.query;
    const semesters = await this.semesterRepository
      .find({
        date: new Date(),
        pagination: {
          offset: pageOffset,
          itemCount,
        },
        orderBy: {
          endTerm: OrderByTypeEnum.DESC,
        },
      })
      .then(takeOnlyOne());

    const total = await this.semesterRepository.count({});

    return {
      semesters: [semesters],
      total,
      offset: param.query.pageOffset,
    };
  }

  /**
   * @description getActivitiesDeadline의 서비스 진입점입니다.
   * @returns 오늘의 활동보고서 작성기간을 리턴합니다.
   */
  async getPublicActivitiesDeadline(): Promise<ApiAct018ResponseOk> {
    const now = new Date();
    const semester = await this.semesterRepository
      .find({
        date: now,
      })
      .then(takeOnlyOne(MSemester));
    const term = await this.activityDurationRepository
      .find({
        semesterId: semester.id,
        activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
      })
      .then(takeOnlyOne(MActivityDuration));
    const thisSemesterDeadlines = await this.activityDeadlineRepository.find({
      semesterId: semester.id,
    });
    const todayDeadline = thisSemesterDeadlines.find(
      e => e.startTerm <= now && now < e.endTerm,
    );

    return {
      isWritable: todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Writing,
      isEditable:
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Writing ||
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Modification,
      canApprove:
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Writing ||
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Modification ||
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Late,
      targetTerm: {
        id: term.id,
        name: term.name,
        startTerm: term.startTerm,
        endTerm: term.endTerm,
        year: term.year,
      },
      deadline: {
        activityDeadlineEnum:
          todayDeadline?.deadlineEnum ?? thisSemesterDeadlines[0].deadlineEnum, // TODO: 오늘 날짜가 기한 내에 있지 않을 경우에 대한 행동 정의 완료 시 수정
        duration: {
          startTerm:
            todayDeadline?.startTerm ?? thisSemesterDeadlines[0].startTerm,
          endTerm: todayDeadline?.endTerm ?? thisSemesterDeadlines[0].endTerm,
        },
      },
    };
  }
}
