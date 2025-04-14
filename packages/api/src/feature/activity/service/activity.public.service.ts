import { Injectable } from "@nestjs/common";

import { IActivityResponseSummary } from "@sparcs-clubs/interface/api/activity/type/activity.type";

import ActivityRepository from "@sparcs-clubs/api/feature/activity/repository/activity.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";

@Injectable()
export default class ActivityPublicService {
  constructor(
    private activityRepository: ActivityRepository,
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
}
