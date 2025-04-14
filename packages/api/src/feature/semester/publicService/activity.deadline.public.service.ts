import { Injectable } from "@nestjs/common";

import { ActivityDeadlineEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";

import { BasePublicService } from "@sparcs-clubs/api/common/base/base.public.service";

import {
  ActivityDeadlineQuery,
  MActivityDeadline,
} from "../model/activity.deadline.model";
import { ActivityDeadlineRepository } from "../repository/activity.deadline.repository";
import { SemesterPublicService } from "../service/semester.public.service";

type ActivityDeadlineSearchQuery = {};
type ActivityDeadlineLoadQuery = {
  semesterId?: number;
  date?: Date;
  deadlineEnum?: ActivityDeadlineEnum;
};
type ActivityDeadlineIsQuery = {
  semesterId: number;
  date?: Date;
  deadlineEnum?: ActivityDeadlineEnum;
  deadlineEnums?: ActivityDeadlineEnum[];
};

@Injectable()
export class ActivityDeadlinePublicService extends BasePublicService<
  MActivityDeadline,
  ActivityDeadlineQuery,
  ActivityDeadlineLoadQuery,
  ActivityDeadlineIsQuery,
  ActivityDeadlineSearchQuery
> {
  constructor(
    private readonly activityDeadlineRepository: ActivityDeadlineRepository,
    private readonly semesterPublicService: SemesterPublicService,
  ) {
    super(activityDeadlineRepository, MActivityDeadline);
  }

  /**
   * @description 조회 날짜가 해당 ActivityDeadline 기한인지 여부를 반환합니다.
   * @param date? 조회 날짜 (비울 경우 현재 시간)
   * @param semesterId 학기 ID
   * @param deadlineEnum(s)? ActivityDeadlineEnum
   * @returns 조회 날짜가 활동 마감 기한인지 여부
   */
  async is(query: ActivityDeadlineIsQuery): Promise<boolean> {
    const queryParam = {
      ...query,
      date: query.date ?? new Date(),
    };

    const res = await super.is(queryParam);
    return res;
  }

  /**
   * @description 조회 날짜가 해당 ActivityDeadline 기한인지 확인하여 기한이 아니라면 예외를 발생시킵니다.
   * @param date? 조회 날짜 (비울 경우 현재 시간)
   * @param semesterId 학기 ID
   * @param deadlineEnum(s)? ActivityDeadlineEnum
   * @throws BadRequestException 조회 날짜가 해당 ActivityDeadline 기한이 아님
   */
  async validate(query: ActivityDeadlineIsQuery): Promise<void> {
    await super.validate(query);
  }

  /**
   * @description 해당 학기의 활동 마감 기한을 반환합니다.
   * @param semesterId? 학기 ID
   * @param date? 조회 날짜 (비울 경우 현재 시간)의 Semester ID에서 탐색
   * @param deadlineEnum ActivityDeadlineEnum
   * @returns 해당 학기의 활동 마감 기한
   * @throws NotFoundException 해당 학기의 해당 enum인 ActivityDeadline이 존재하지 않을 경우
   * @warning date를 넘겼더라도 반환된 deadline이 해당 기간을 반드시 포함하지 않을 수 있습니다.
   */
  async load(query: ActivityDeadlineLoadQuery): Promise<MActivityDeadline> {
    const semesterIdParam =
      query.semesterId ??
      (await this.semesterPublicService.loadSemester(query.date ?? new Date()))
        .id;

    const res = await super.load({
      ...query,
      semesterId: semesterIdParam,
    });
    return res;
  }
}
