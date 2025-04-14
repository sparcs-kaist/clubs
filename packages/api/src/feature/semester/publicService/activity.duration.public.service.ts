import { Injectable } from "@nestjs/common";

import { ActivityDurationTypeEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";

import { BasePublicService } from "@sparcs-clubs/api/common/base/base.public.service";

import {
  ActivityDurationQuery,
  MActivityDuration,
} from "../model/activity.duration.model";
import { ActivityDurationRepository } from "../repository/activity.duration.repository";
import { SemesterPublicService } from "./semester.public.service";

type ActivityDurationSearchQuery = {};

type ActivityDurationLoadQuery = {
  semesterId?: number;
  date?: Date;
  durationEnum?: ActivityDurationTypeEnum;
};

type ActivityDurationIsQuery = {
  id: number;
  durationEnum?: ActivityDurationTypeEnum;
};

@Injectable()
export class ActivityDurationPublicService extends BasePublicService<
  MActivityDuration,
  ActivityDurationQuery,
  ActivityDurationLoadQuery,
  ActivityDurationIsQuery,
  ActivityDurationSearchQuery
> {
  constructor(
    private readonly activityDurationRepository: ActivityDurationRepository,
    private readonly semesterPublicService: SemesterPublicService,
  ) {
    super(activityDurationRepository, MActivityDuration);
  }

  /**
   * @description 해당 ActivityDuration이 해당 ActivityDurationTypeEnum인지 여부를 반환합니다.
   * @param id ActivityDuration ID
   * @param durationEnum? ActivityDurationTypeEnum, 기본값: ActivityDurationTypeEnum.Regular
   * @returns 해당 ActivityDuration이 해당 ActivityDurationTypeEnum인지 여부
   */
  async is(query: ActivityDurationIsQuery): Promise<boolean> {
    const queryParam = {
      ...query,
      durationEnum: query.durationEnum ?? ActivityDurationTypeEnum.Regular,
    };

    const res = await super.is(queryParam);
    return res;
  }

  /**
   * @description 해당 ActivityDuration이 해당 ActivityDurationTypeEnum인지 검증합니다.
   * @param id ActivityDuration ID
   * @param durationEnum? ActivityDurationTypeEnum, 기본값: ActivityDurationTypeEnum.Regular
   * @throws BadRequestException 해당 ActivityDuration이 해당 ActivityDurationTypeEnum이 아닌 경우
   */
  async validate(query: ActivityDurationIsQuery): Promise<void> {
    await super.validate(query);
  }

  /**
   * @description 해당 학기의 활동 마감 기한을 반환합니다.
   * @param semesterId Semester ID
   * @param date? Date, 기본값: 현재 시간
   * @param durationEnum? ActivityDurationTypeEnum, 기본값: ActivityDurationTypeEnum.Regular
   * @returns MActivityDuration of the semester
   * @throws NotFoundException 해당 학기의 해당 enum인 ActivityDuration이 존재하지 않을 경우
   * @warning date를 넘겼더라도 반환된 duration이 해당 기간을 반드시 포함하지 않을 수 있습니다.
   */
  async load(query?: ActivityDurationLoadQuery): Promise<MActivityDuration> {
    const semesterIdParam =
      query?.semesterId ??
      (
        await this.semesterPublicService.load({
          date: query?.date ?? new Date(),
        })
      ).id;

    const res = await super.load({
      ...query,
      semesterId: semesterIdParam,
    });
    return res;
  }

  /**
   * @description 해당 학기의 활동 마감 기한을 반환합니다.
   * @param semesterId Semester ID
   * @param date? Date, 기본값: 현재 시간
   * @param durationEnum? ActivityDurationTypeEnum, 기본값: ActivityDurationTypeEnum.Regular
   * @returns MActivityDuration of the semester
   * @throws NotFoundException 해당 학기의 해당 enum인 ActivityDuration이 존재하지 않을 경우
   * @warning date를 넘겼더라도 반환된 duration이 해당 기간을 반드시 포함하지 않을 수 있습니다.
   */
  async loadId(query?: ActivityDurationLoadQuery): Promise<number> {
    const duration = await this.load(query);
    return duration.id;
  }
}
