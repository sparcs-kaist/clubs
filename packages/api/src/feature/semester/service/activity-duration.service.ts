import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import type {
  ApiSem006RequestBody,
  ApiSem006ResponseCreated,
  ApiSem007RequestQuery,
  ApiSem007ResponseOK,
} from "@clubs/interface/api/semester/index";

import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import { MActivityDuration } from "../model/activity.duration.model";
import { ActivityDeadlineRepository } from "../repository/activity.deadline.repository";
import { ActivityDurationRepository } from "../repository/activity.duration.repository";

@Injectable()
export class ActivityDurationService {
  constructor(
    private readonly activityDurationRepository: ActivityDurationRepository,
    private readonly activityDeadlineRepository: ActivityDeadlineRepository,
  ) {}

  async createActivityDeadline(param: {
    body: ApiSem006RequestBody;
  }): Promise<ApiSem006ResponseCreated> {
    const { activityDId, deadlineEnum, startTerm, endTerm } = param.body;

    const activityDuration = await this.activityDurationRepository
      .find({ id: activityDId })
      .then(takeOnlyOne(MActivityDuration));

    if (!activityDuration) {
      throw new HttpException(
        `ActivityDuration with id ${activityDId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (new Date(startTerm) >= new Date(endTerm)) {
      throw new HttpException(
        "startTerm must be before endTerm.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingDeadlines = await this.activityDeadlineRepository.find({
      semesterId: activityDuration.semester.id,
    });

    const hasOverlap = existingDeadlines.some(deadline => {
      const existingStart = new Date(deadline.startTerm);
      const existingEnd = new Date(deadline.endTerm);
      const newStart = new Date(startTerm);
      const newEnd = new Date(endTerm);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasOverlap) {
      throw new HttpException(
        "The given deadline period overlaps with an existing one for this semester.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const _ = await this.activityDeadlineRepository.create({
      semester: { id: activityDuration.semester.id },
      deadlineEnum,
      startTerm,
      endTerm,
    });

    return {};
  }

  async getActivityDeadlines(param: {
    query: ApiSem007RequestQuery;
  }): Promise<ApiSem007ResponseOK> {
    const { activityDId } = param.query;

    let activityDurations: MActivityDuration[];
    if (activityDId) {
      const found = await this.activityDurationRepository.find({
        id: activityDId,
      });
      activityDurations = found ?? [];
    } else {
      activityDurations = await this.activityDurationRepository.find({});
    }

    // 병렬 + flatMap 스타일로 deadlines 생성
    const deadlines = (
      await Promise.all(
        activityDurations.map(async duration => {
          const activityDeadlines = await this.activityDeadlineRepository.find({
            semesterId: duration.semester.id,
          });
          return activityDeadlines.map(deadline => ({
            id: deadline.id,
            semesterId: duration.semester.id,
            activityDId: duration.id,
            deadlineEnum: deadline.deadlineEnum,
            startTerm: deadline.startTerm,
            endTerm: deadline.endTerm,
          }));
        }),
      )
    ).flat();

    return { deadlines };
  }
}
