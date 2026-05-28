import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import type {
  ApiSem006RequestBody,
  ApiSem006ResponseCreated,
  ApiSem007RequestQuery,
  ApiSem007ResponseOK,
  ApiSem009RequestBody,
  ApiSem009ResponseOk,
  ApiSem011RequestBody,
  ApiSem011ResponseCreated,
  ApiSem012RequestQuery,
  ApiSem012ResponseOK,
  ApiSem013RequestBody,
  ApiSem013ResponseOk,
  ApiSem014ResponseOk,
} from "@clubs/interface/api/semester/index";

import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import { MActivityDeadline } from "../model/activity.deadline.model";
import { MActivityDuration } from "../model/activity.duration.model";
import { ActivityDeadlineRepository } from "../repository/activity.deadline.repository";
import { ActivityDurationRepository } from "../repository/activity.duration.repository";
import { SemesterRepository } from "../repository/semester.repository";
import { hasOverlappingActivityDeadline } from "./activity-deadline-validator/activity-deadline.validator";
import { hasActivityTermOutOfRange } from "./activity-duration-validator/activity-duration.validator";

@Injectable()
export class ActivityDurationService {
  constructor(
    private readonly activityDurationRepository: ActivityDurationRepository,
    private readonly activityDeadlineRepository: ActivityDeadlineRepository,
    private readonly semesterRepository: SemesterRepository,
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

    const hasOverlap = hasOverlappingActivityDeadline(existingDeadlines, {
      startTerm,
      endTerm,
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
            activityDurationName: duration.name,
            deadlineEnum: deadline.deadlineEnum,
            startTerm: deadline.startTerm,
            endTerm: deadline.endTerm,
          }));
        }),
      )
    ).flat();

    return { deadlines };
  }

  async updateActivityDeadline(param: {
    deadlineId: number;
    body: ApiSem009RequestBody;
  }): Promise<ApiSem009ResponseOk> {
    const { deadlineId, body } = param;
    const { startTerm, endTerm } = body;

    const activityDeadlines =
      (await this.activityDeadlineRepository.find({
        id: deadlineId,
      })) ?? [];
    const [activityDeadline] = activityDeadlines;

    if (!activityDeadline) {
      throw new HttpException(
        `ActivityDeadline with id ${deadlineId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (new Date(startTerm) > new Date(endTerm)) {
      throw new HttpException(
        "startTerm must be before or equal to endTerm.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.activityDeadlineRepository.put(
      new MActivityDeadline({
        ...activityDeadline,
        startTerm,
        endTerm,
      }),
    );

    return { id: deadlineId };
  }

  async deleteActivityDeadline(param: {
    param: import("@clubs/interface/api/semester/index").ApiSem010RequestParam;
  }): Promise<
    import("@clubs/interface/api/semester/index").ApiSem010ResponseOK
  > {
    const { deadlineId } = param.param;

    const deadline = await this.activityDeadlineRepository.find({
      id: deadlineId,
    });
    if (!deadline || (Array.isArray(deadline) && deadline.length === 0)) {
      throw new HttpException(
        `ActivityDeadline with id ${deadlineId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 실제로는 soft delete가 필요하다면 update로 deletedAt을 설정해야 함
    await this.activityDeadlineRepository.delete({ id: deadlineId });

    return { id: deadlineId };
  }

  async createActivityDuration(
    body: ApiSem011RequestBody,
  ): Promise<ApiSem011ResponseCreated> {
    const {
      semesterId,
      activityDurationTypeEnum,
      year,
      name,
      startTerm,
      endTerm,
    } = body;

    // Validate semester exists
    const semesters = await this.semesterRepository.find({ id: semesterId });
    if (!semesters || semesters.length === 0) {
      throw new HttpException(
        "해당 학기를 찾을 수 없습니다.",
        HttpStatus.NOT_FOUND,
      );
    }

    if (new Date(startTerm) >= new Date(endTerm)) {
      throw new HttpException(
        "시작날짜는 종료날짜보다 이전이어야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check for duplicate (name, year) pair
    const existing = await this.activityDurationRepository.find({});
    const hasDuplicate = existing.some(d => d.name === name && d.year === year);
    if (hasDuplicate) {
      throw new HttpException(
        "동일한 (활동반기명, 년도) 쌍이 이미 존재합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.activityDurationRepository.create({
      semester: { id: semesterId },
      activityDurationTypeEnum,
      year,
      name,
      startTerm,
      endTerm,
    });

    return {};
  }

  async deleteActivityDuration(
    activityDurationId: number,
  ): Promise<ApiSem014ResponseOk> {
    const existing = await this.activityDurationRepository.find({
      id: activityDurationId,
    } as Parameters<typeof this.activityDurationRepository.find>[0]);

    if (!existing || existing.length === 0) {
      throw new HttpException(
        "해당 활동반기를 찾을 수 없습니다.",
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if there are connected activity deadlines
    const deadlines = await this.activityDeadlineRepository.find({
      semesterId: existing[0].semester.id,
    });
    if (deadlines.length > 0) {
      throw new HttpException(
        "활동반기에 연결된 활동보고서 기한이 있어 삭제할 수 없습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.activityDurationRepository.delete({
      id: activityDurationId,
    } as Parameters<typeof this.activityDurationRepository.delete>[0]);

    return {};
  }

  async updateActivityDuration(
    activityDurationId: number,
    body: ApiSem013RequestBody,
  ): Promise<ApiSem013ResponseOk> {
    const activityDuration = await this.activityDurationRepository
      .find({
        id: activityDurationId,
      } as Parameters<typeof this.activityDurationRepository.find>[0])
      .then(takeOnlyOne(MActivityDuration));

    if (!activityDuration) {
      throw new HttpException(
        "해당 활동반기를 찾을 수 없습니다.",
        HttpStatus.NOT_FOUND,
      );
    }

    const { startTerm, endTerm } = body;
    if (new Date(startTerm) >= new Date(endTerm)) {
      throw new HttpException(
        "시작날짜는 종료날짜보다 이전이어야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const activities =
      await this.activityDurationRepository.findActivitiesByDurationId(
        activityDurationId,
      );

    const hasOutOfRangeActivityTerm = hasActivityTermOutOfRange(activities, {
      startTerm,
      endTerm,
    });

    if (hasOutOfRangeActivityTerm) {
      throw new HttpException(
        "수정하려는 활동반기 밖에 위치한 활동보고서 기간이 있어 수정할 수 없습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.activityDurationRepository.put(
      new MActivityDuration({
        ...activityDuration,
        startTerm,
        endTerm,
      }),
    );

    return { id: activityDurationId };
  }

  async getActivityDurations(param: {
    query: ApiSem012RequestQuery;
  }): Promise<ApiSem012ResponseOK> {
    const { semesterId } = param.query;

    // Build filter conditions
    const filter: { semesterId?: number } = {};
    if (semesterId) {
      filter.semesterId = semesterId;
    }

    // Get activity durations
    const activityDurations =
      await this.activityDurationRepository.find(filter);

    // Fetch semester details for each activity duration
    const result = await Promise.all(
      activityDurations.map(async duration => {
        const semester = await this.semesterRepository.find({
          id: duration.semester.id,
        });
        const semesterData = Array.isArray(semester) ? semester[0] : semester;

        return {
          id: duration.id,
          semester: {
            id: duration.semester.id,
            name: semesterData?.name || "",
            year: semesterData?.year || duration.year,
          },
          activityDurationTypeEnum: duration.activityDurationTypeEnum,
          year: duration.year,
          name: duration.name,
          startTerm: duration.startTerm,
          endTerm: duration.endTerm,
        };
      }),
    );

    return {
      activityDurations: result,
    };
  }
}
