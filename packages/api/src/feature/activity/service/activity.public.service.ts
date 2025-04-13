import { Injectable, NotFoundException } from "@nestjs/common";

import { IActivityResponseSummary } from "@clubs/interface/api/activity/type/activity.type";
import { IActivityDuration } from "@clubs/interface/api/semester/type/activity.duration.type";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import ActivityRepository from "@sparcs-clubs/api/feature/activity/repository/activity.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import { ActivityDurationRepository } from "@sparcs-clubs/api/feature/semester/repository/activity.duration.repository";

@Injectable()
export default class ActivityPublicService {
  constructor(
    private activityRepository: ActivityRepository,
    private activityActivityTermRepository: ActivityDurationRepository,
    private clubPublicService: ClubPublicService,
  ) {}

  /**
   * @param id activity id
   * @returns activity id에 해당하는 활동 이름을 리턴합니다.
   */
  async getActivityNameById(id: number) {
    return this.activityRepository.selectActivityNameById(id);
  }

  async fetchSummary(id: number): Promise<IActivityResponseSummary> {
    const summary = await this.activityRepository.fetchSummary(id);
    const club = await this.clubPublicService.fetchSummary(summary.club.id);

    return {
      ...summary,
      club,
    };
  }

  async fetchSummaries(
    activityIds: number[],
  ): Promise<IActivityResponseSummary[]> {
    const summaries = await this.activityRepository.fetchSummaries(activityIds);
    const clubs = await this.clubPublicService.fetchSummaries(
      summaries.map(summary => summary.club.id),
    );
    return summaries.map((summary, index) => ({
      ...summary,
      club: clubs[index],
    }));
  }

  // TODO IN 113: Semester Module 로 이동
  async fetchLastActivityD(): Promise<IActivityDuration>;
  async fetchLastActivityD(date: Date): Promise<IActivityDuration>;
  async fetchLastActivityD(arg1?: Date): Promise<IActivityDuration> {
    if (arg1 === undefined) {
      const date = getKSTDate();
      const result = await this.activityActivityTermRepository.find({ date });
      if (result.length === 0) {
        throw new NotFoundException("No such activityD");
      }
      return result[0];
    }

    const result = await this.activityActivityTermRepository.find({
      date: arg1,
    });
    if (result.length === 0) {
      throw new NotFoundException("No such activityD");
    }
    return result[0];
  }
}
