import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import type { ApiAct001RequestBody } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct001";
import type { ApiAct002ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct002";
import type {
  ApiAct003RequestBody,
  ApiAct003RequestParam,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct003";
import type { ApiAct005ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct005";
import type { ApiAct007RequestBody } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct007";
import type {
  ApiAct008RequestBody,
  ApiAct008RequestParam,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct008";
import type {
  ApiAct010RequestQuery,
  ApiAct010ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct010";
import type {
  ApiAct011RequestQuery,
  ApiAct011ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct011";
import type {
  ApiAct012RequestQuery,
  ApiAct012ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct012";
import type {
  ApiAct013RequestQuery,
  ApiAct013ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct013";
import type {
  ApiAct016RequestParam,
  ApiAct016ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct016";
import type {
  ApiAct017RequestBody,
  ApiAct017RequestParam,
  ApiAct017ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct017";
import type { ApiAct018ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct018";
import type { ApiAct019ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct019";
import { ApiAct021ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct021";
import { ApiAct022ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct022";
import type { ApiAct023ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct023";
import type {
  ApiAct024RequestQuery,
  ApiAct024ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct024";
import type {
  ApiAct025RequestBody,
  ApiAct025ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct025";
import type {
  ApiAct026RequestBody,
  ApiAct026ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct026";
import type {
  ApiAct027RequestQuery,
  ApiAct027ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct027";
import { ApiAct028ResponseOk } from "@sparcs-clubs/interface/api/activity/endpoint/apiAct028";
import {
  ApiAct029RequestParam,
  ApiAct029ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct029";
import {
  ActivityDeadlineEnum,
  ActivityStatusEnum,
} from "@sparcs-clubs/interface/common/enum/activity.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import ClubTRepository from "@sparcs-clubs/api/feature/club/repository/club.club-t.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import FilePublicService from "@sparcs-clubs/api/feature/file/service/file.public.service";
import { ClubRegistrationPublicService } from "@sparcs-clubs/api/feature/registration/club-registration/service/club-registration.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import ActivityClubChargedExecutiveRepository from "../repository/activity.activity-club-charged-executive.repository";
import ActivityRepository from "../repository/activity.repository";

@Injectable()
export default class ActivityService {
  constructor(
    private activityRepository: ActivityRepository,
    private activityClubChargedExecutiveRepository: ActivityClubChargedExecutiveRepository,

    private clubPublicService: ClubPublicService,
    private filePublicService: FilePublicService,
    private clubRegistrationPublicService: ClubRegistrationPublicService,
    private clubTRepository: ClubTRepository,
    private userPublicService: UserPublicService,
  ) {}

  /**
   * @param activityId 활동 id
   * @returns 해당id의 활동이 존재할 경우 그 정보를 리턴합니다.
   * 존재하지 않을 경우 not found exception을 throw합니다.`
   */
  private async getActivity(param: { activityId: number }) {
    const activities = await this.activityRepository.selectActivityByActivityId(
      param.activityId,
    );
    if (activities.length > 1)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
    if (activities.length === 0)
      throw new HttpException("No such activity", HttpStatus.NOT_FOUND);

    return activities[0];
  }

  /**
   * @param date 조회하고 싶은 활동기간 내부의 임의 날짜
   * @returns 해당 날짜를 포함하는 활동 기간 정보를 리턴합니다.
   */
  private async getActivityD(param: { date: Date }) {
    const activityDs =
      await this.activityActivityTermRepository.selectActivityDByDate(
        param.date,
      );
    if (activityDs.length > 1)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
    if (activityDs.length === 0)
      throw new HttpException(
        "ActivityD is not set for today",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return activityDs[0];
  }

  /**
   * @returns 현재 활동보고서를 작성해야 하는 직전학기 정보를 리턴합니다.
   * ex. 현재 겨울학기일 경우, 여름-가을학기 활동기간을 리턴해야 합니다.
   */
  async getLastActivityD() {
    const today = getKSTDate();
    const [activityD] =
      await this.activityActivityTermRepository.selectLastActivityDByDate(
        today,
      );
    return activityD;
  }

  /**
   * @param studentId 학생 id
   * @param clubId 동아리 id
   * @description 학생이 해당 동아리의 대표자 또는 대의원이 아닌 경우 403 exception을 throw 합니다.
   */
  private async checkIsStudentDelegate(param: {
    studentId: number;
    clubId: number;
  }) {
    if (
      !(await this.clubPublicService.isStudentDelegate(
        param.studentId,
        param.clubId,
      ))
    )
      throw new HttpException(
        "It seems that you are not the delegate of the club.",
        HttpStatus.FORBIDDEN,
      );
  }

  private async checkIsProfessor(param: {
    professorId: number;
    clubId: number;
  }) {
    const clubT = await this.clubTRepository.findClubTById(param.clubId);
    if (clubT.professorId !== param.professorId)
      throw new HttpException(
        "You are not a professor of the club",
        HttpStatus.FORBIDDEN,
      );
  }

  /**
   *
   * @param enums: ActivityDeadlineEnum의 배열을 받습니다.
   * @description 오늘이 해당하는 deadlineEnum이 enums에 포함되어있지 않으면 400 exception을 throw
   * @returns void
   */
  private async checkDeadline(param: { enums: Array<ActivityDeadlineEnum> }) {
    const today = getKSTDate();
    const todayDeadline = await this.activityRepository
      .selectDeadlineByDate(today)
      .then(arr => {
        if (arr.length === 0)
          throw new HttpException(
            "Today is not in the range of deadline",
            HttpStatus.BAD_REQUEST,
          );
        return arr[0];
      });
    if (
      param.enums.find(e => Number(e) === todayDeadline.deadlineEnumId) ===
      undefined
    )
      throw new HttpException(
        "Today is not a day for activity deletion",
        HttpStatus.BAD_REQUEST,
      );
  }

  /**
   *
   * @param clubId
   * @param executiveId
   * @description 동아리의 담당 집행부원을 변경합니다.
   * 해당 동아리의 활동에 대한 개별 담당 집행부원도 전부 덮어씌웁니다.
   */
  private async changeClubChargedExecutive(param: {
    clubId: number;
    executiveId: number;
  }) {
    const activityDId = await this.getLastActivityD().then(e => e.id);
    const prevChargedExecutiveId =
      await this.activityClubChargedExecutiveRepository.selectActivityClubChargedExecutiveByClubId(
        { activityDId, clubId: param.clubId },
      );
    let upsertResult = false;
    if (prevChargedExecutiveId.length === 0) {
      upsertResult =
        await this.activityClubChargedExecutiveRepository.insertActivityClubChargedExecutive(
          {
            activityDId,
            clubId: param.clubId,
            executiveId: param.executiveId,
          },
        );
    } else {
      upsertResult =
        await this.activityClubChargedExecutiveRepository.updateActivityClubChargedExecutive(
          {
            activityDId,
            clubId: param.clubId,
            executiveId: param.executiveId,
          },
        );
    }
    if (upsertResult === false) {
      throw new HttpException(
        "failed to change charged-executive",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const activities =
      await this.activityRepository.selectActivityByClubIdAndActivityDId(
        param.clubId,
        activityDId,
      );

    await Promise.all(
      activities.map(async e => {
        const isUpdateSuceed =
          await this.activityRepository.updateActivityChargedExecutive({
            activityId: e.id,
            executiveId: param.executiveId,
          });
        return isUpdateSuceed;
      }),
    );
  }

  /**
   * @param activityDId 조회하고 싶은 활동기간 id, 없을 경우 직전 활동기간의 id를 사용합니다.
   * @param clubId 동아리 id
   * @returns 해당 동아리의 활동기간에 대한 활동 목록을 가져옵니다.
   */
  async getActivities(param: {
    activityDId?: number | undefined;
    clubId: number;
  }) {
    const activityDId =
      param.activityDId !== undefined
        ? param.activityDId
        : await this.getLastActivityD().then(e => e.id);

    const activities =
      await this.activityRepository.selectActivityByClubIdAndActivityDId(
        param.clubId,
        activityDId,
      );
    return activities;
  }

  async deleteStudentActivity(activityId: number, studentId: number) {
    const activity = await this.getActivity({ activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: activity.clubId });
    // 오늘이 활동보고서 작성기간 | 수정기간 | 예외적 작성기간인지 확인합니다.
    await this.checkDeadline({
      enums: [
        ActivityDeadlineEnum.Upload,
        ActivityDeadlineEnum.Modification,
        ActivityDeadlineEnum.Exceptional,
      ],
    });

    if (!(await this.activityRepository.deleteActivity({ activityId }))) {
      throw new HttpException(
        "Something got wrong...",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStudentActivities(
    clubId: number,
    studentId: number,
  ): Promise<ApiAct005ResponseOk> {
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId });

    // const today = getKSTDate();
    // const activityD = await this.getActivityD({ date: today });
    const activityD = await this.getLastActivityD();

    const activities =
      await this.activityRepository.selectActivityByClubIdAndActivityDId(
        clubId,
        activityD.id,
      );

    const result = await Promise.all(
      activities.map(async row => {
        const duration =
          await this.activityRepository.selectDurationByActivityId(row.id);
        return {
          ...row,
          durations: duration,
        };
      }),
    );

    return result
      .map(row => ({
        id: row.id,
        activityStatusEnumId: row.activityStatusEnumId,
        name: row.name,
        activityTypeEnumId: row.activityTypeEnumId,
        durations: row.durations,
        professorApprovedAt: row.professorApprovedAt,
        editedAt: row.editedAt,
        commentedAt: row.commentedAt,
      }))
      .sort((a, b) =>
        a.durations[0].startTerm.getTime() ===
        b.durations[0].startTerm.getTime()
          ? a.durations[0].endTerm.getTime() - b.durations[0].endTerm.getTime()
          : a.durations[0].startTerm.getTime() -
            b.durations[0].startTerm.getTime(),
      );
  }

  /**
   * @description getStudentActivitiesAvailableMembers의 서비스 진입점입니다.
   */
  async getStudentActivitiesAvailableMembers(param: {
    studentId: number;
    query: ApiAct010RequestQuery;
  }): Promise<ApiAct010ResponseOk> {
    if (
      !(await this.clubPublicService.isStudentDelegate(
        param.studentId,
        param.query.clubId,
      ))
    )
      throw new HttpException(
        "It seems that you are not a delegate of the club",
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.clubPublicService.getMemberFromDuration({
      clubId: param.query.clubId,
      duration: {
        startTerm: param.query.startTerm,
        endTerm: param.query.endTerm,
      },
    });

    return {
      students: result.map(e => ({
        id: e.studentId,
        name: e.name,
        studentNumber: e.studentNumber,
      })),
    };
  }

  async getStudentActivity(
    activityId: number,
    // studentId: number,
  ): Promise<ApiAct002ResponseOk> {
    const activity = await this.getActivity({ activityId });

    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    // await this.checkIsStudentDelegate({ studentId, clubId: activity.clubId });

    const evidence = await this.activityRepository.selectFileByActivityId(
      activity.id,
    );
    const participants =
      await this.activityRepository.selectParticipantByActivityId(activity.id);
    const duration = await this.activityRepository.selectDurationByActivityId(
      activity.id,
    );

    const evidenceFiles = await Promise.all(
      evidence.map(async e => ({
        fileId: e.fileId,
        name: await this.filePublicService
          .getFileInfoById(e.fileId)
          .then(f => f.name),
        url: await this.filePublicService.getFileUrl(e.fileId),
      })),
    );

    const comments =
      await this.activityRepository.selectActivityFeedbackByActivityId({
        activityId: activity.id,
      });

    return {
      clubId: activity.clubId,
      name: activity.name,
      originalName: activity.originalName,
      activityTypeEnumId: activity.activityTypeEnumId,
      location: activity.location,
      purpose: activity.purpose,
      detail: activity.detail,
      evidence: activity.evidence,
      evidenceFiles,
      participants: participants.map(e => ({
        studentId: e.studentId,
        studentNumber: e.studentNumber,
        name: e.name,
      })),
      durations: duration.map(e => ({
        startTerm: e.startTerm,
        endTerm: e.endTerm,
      })),
      activityStatusEnumId: activity.activityStatusEnumId,
      comments: comments.map(e => ({
        content: e.comment,
        createdAt: e.createdAt,
      })),
      updatedAt: activity.updatedAt,
      professorApprovedAt: activity.professorApprovedAt,
      editedAt: activity.editedAt,
      commentedAt: activity.commentedAt,
    };
  }

  async postStudentActivity(
    body: ApiAct001RequestBody,
    studentId: number,
  ): Promise<void> {
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: body.clubId });

    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인합니다.
    await this.checkDeadline({
      enums: [ActivityDeadlineEnum.Upload, ActivityDeadlineEnum.Exceptional],
    });

    const activities = await this.getActivities({ clubId: body.clubId });
    if (activities.length >= 20) {
      throw new HttpException(
        "The number of activities is over the limit",
        HttpStatus.BAD_REQUEST,
      );
    }
    // QUESTION: 신청내용중 startTerm과 endTerm이 이번 학기의 활동기간에 맞는지 검사해야 할까요?.
    const activityD = await this.getLastActivityD();
    // 현재학기에 동아리원이 아니였던 참가자가 있는지 검사합니다.
    // TODO: 현재학기 뿐만 아니라 직전학기 동아리원도 활동 참가자로 포함될 수 있어야 합니다.
    // const participantIds = await Promise.all(
    //   body.participants.map(async e => {
    //     if (
    //       !(await this.clubPublicService.isStudentBelongsTo(
    //         e.studentId,
    //         body.clubId,
    //       ))
    //     )
    //       throw new HttpException(
    //         "Some student is not belonged to the club",
    //         HttpStatus.BAD_REQUEST,
    //       );
    //     return e.studentId;
    //   }),
    // );
    const participantIds = await Promise.all(
      body.participants.map(async e => e.studentId),
    );
    // TOD
    // TODO: 파일 유효한지 검사하는 로직도 필요해요! 이건 파일 모듈 구성되면 public할듯

    const isInsertionSucceed = await this.activityRepository.insertActivity({
      ...body,
      evidenceFileIds: body.evidenceFiles.map(row => row.uid),
      participantIds,
      activityDId: activityD.id,
    });

    if (!isInsertionSucceed)
      throw new HttpException(
        "Failed to insert",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  async putStudentActivity(
    param: ApiAct003RequestParam,
    body: ApiAct003RequestBody,
    studentId: number,
  ): Promise<void> {
    const activity = await this.getActivity({ activityId: param.activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: activity.clubId });
    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인합니다.
    await this.checkDeadline({
      enums: [
        ActivityDeadlineEnum.Upload,
        ActivityDeadlineEnum.Modification,
        ActivityDeadlineEnum.Exceptional,
      ],
    });
    // 해당 활동이 지난 활동기간에 대한 활동인지 확인합니다.
    const lastActivityD = await this.getLastActivityD();
    if (activity.activityDId !== lastActivityD.id)
      throw new HttpException(
        "The activity is not the activity of the last activity duration ",
        HttpStatus.BAD_REQUEST,
      );
    // 제출한 활동 기간들이 지난 활동기간 이내인지 확인합니다.
    body.durations.forEach(duration => {
      if (
        lastActivityD.startTerm <= duration.startTerm &&
        duration.endTerm <= lastActivityD.endTerm
      ) {
        return duration;
      }
      throw new HttpException(
        "Some duration is not in the last activity duration",
        HttpStatus.BAD_REQUEST,
      );
    });
    // 파일 uuid의 유효성을 검사하지 않습니다.
    // 참여 학생이 지난 활동기간 동아리의 소속원이였는지 확인합니다.
    const activityDStartSemester =
      await this.clubPublicService.dateToSemesterId(lastActivityD.startTerm);
    const activityDEndSemester = await this.clubPublicService.dateToSemesterId(
      lastActivityD.endTerm,
    );
    const members = (
      await this.clubPublicService.getMemberFromSemester({
        semesterId: activityDStartSemester,
        clubId: activity.clubId,
      })
    ).concat(
      await this.clubPublicService.getMemberFromSemester({
        semesterId: activityDEndSemester,
        clubId: activity.clubId,
      }),
    );
    body.participants.forEach(participant => {
      if (
        members.find(e => e.studentId === participant.studentId) === undefined
      )
        throw new HttpException(
          "Some participant is not belonged to the club in the activity duration",
          HttpStatus.BAD_REQUEST,
        );
    });

    // PUT 처리를 시작합니다.
    const isUpdateSucceed = this.activityRepository.updateActivity({
      activityId: param.activityId,
      name: body.name,
      activityTypeEnumId: body.activityTypeEnumId,
      duration: body.durations,
      location: body.location,
      purpose: body.purpose,
      detail: body.detail,
      evidence: body.evidence,
      evidenceFileIds: body.evidenceFiles.map(e => e.fileId),
      participantIds: body.participants.map(e => e.studentId),
      activityDId: activity.activityDId,
      activityStatusEnumId: ActivityStatusEnum.Applied,
    });
    if (!isUpdateSucceed)
      throw new HttpException(
        "Failed to update",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  async postStudentActivityProvisional(
    body: ApiAct007RequestBody,
    studentId: number,
  ): Promise<void> {
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: body.clubId });

    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인하지 않습니다.

    const activityD = await this.getLastActivityD();
    // 현재학기에 동아리원이 아니였던 참가자가 있는지 검사합니다.
    const participantIds = await Promise.all(
      body.participants.map(
        async e =>
          // if (
          //   !(await this.clubPublicService.isStudentBelongsTo(
          //     e.studentId,
          //     body.clubId,
          //   ))
          // )
          //   throw new HttpException(
          //     "Some student is not belonged to the club",
          //     HttpStatus.BAD_REQUEST,
          //   );
          e.studentId,
      ),
    );

    if (participantIds.length === 0)
      throw new HttpException(
        "There is no participant in the activity",
        HttpStatus.BAD_REQUEST,
      );

    // 파일 유효한지 검사합니다.
    const evidenceFiles = await Promise.all(
      body.evidenceFiles.map(key =>
        this.filePublicService.getFileInfoById(key.fileId),
      ),
    );

    const isInsertionSucceed = await this.activityRepository.insertActivity({
      ...body,
      evidenceFileIds: evidenceFiles.map(row => row.id),
      participantIds,
      activityDId: activityD.id,
      duration: body.durations,
    });

    if (!isInsertionSucceed)
      throw new HttpException(
        "Failed to insert",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    this.clubRegistrationPublicService.resetClubRegistrationStatusEnum(
      body.clubId,
    );
  }

  async putStudentActivityProvisional(
    param: ApiAct008RequestParam,
    body: ApiAct008RequestBody,
    studentId: number,
  ): Promise<void> {
    const activity = await this.getActivity({ activityId: param.activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: activity.clubId });
    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인하지 않습니다.
    // 해당 활동이 지난 활동기간에 대한 활동인지 확인하지 않습니다.

    // 제출한 활동 기간들이 지난 활동기간 이내인지 확인하지 않습니다.

    // 파일 uuid의 유효성을 검사합니다.
    const evidenceFiles = await Promise.all(
      body.evidenceFiles.map(key =>
        this.filePublicService.getFileInfoById(key.fileId),
      ),
    );
    // 참여 학생이 지난 활동기간 동아리의 소속원이였는지 확인하지 않습니다.
    const participantIds = await Promise.all(
      body.participants.map(
        async e =>
          // if (
          //   !(await this.clubPublicService.isStudentBelongsTo(
          //     e.studentId,
          //     body.clubId,
          //   ))
          // )
          //   throw new HttpException(
          //     "Some student is not belonged to the club",
          //     HttpStatus.BAD_REQUEST,
          // );
          e.studentId,
      ),
    );

    if (participantIds.length === 0)
      throw new HttpException(
        "There is no participant in the activity",
        HttpStatus.BAD_REQUEST,
      );

    // PUT 처리를 시작합니다.
    const isUpdateSucceed = this.activityRepository.updateActivity({
      activityId: param.activityId,
      name: body.name,
      activityTypeEnumId: body.activityTypeEnumId,
      duration: body.durations,
      location: body.location,
      purpose: body.purpose,
      detail: body.detail,
      evidence: body.evidence,
      evidenceFileIds: evidenceFiles.map(e => e.id),
      participantIds: body.participants.map(e => e.studentId),
      activityDId: activity.activityDId,
      activityStatusEnumId: ActivityStatusEnum.Applied,
    });
    if (!isUpdateSucceed)
      throw new HttpException(
        "Failed to update",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    this.clubRegistrationPublicService.resetClubRegistrationStatusEnum(
      activity.clubId,
    );
  }

  /**
   * @param clubId 동아리 ID
   * @description REG-011, 012, 013에서 공통적으로 이용하는 동아리 활동 전체조회 입니다.
   * @returns 해당 동아리가 작성한 모든 활동을 REG-011의 리턴 타입에 맞추어 가져옵니다.
   */
  private async getProvisionalActivities(param: { clubId: number }) {
    const activityDId = await this.getLastActivityD();
    const result =
      await this.activityRepository.selectActivityByClubIdAndActivityDId(
        param.clubId,
        activityDId.id,
      );
    const activities = await Promise.all(
      result.map(async activity => {
        const durations = (
          await this.activityRepository.selectDurationByActivityId(activity.id)
        ).map(e => ({
          startTerm: e.startTerm,
          endTerm: e.endTerm,
        }));

        // 가장 빠른 startTerm을 추출
        const earliestStartTerm = durations[0]?.startTerm;

        // 가장 늦은 endTerm을 추출 (startTerm이 같을 경우 대비)
        const latestEndTerm = durations[0]?.endTerm;

        return {
          id: activity.id,
          name: activity.name,
          activityTypeEnumId: activity.activityTypeEnumId,
          activityStatusEnumId: activity.activityStatusEnumId,
          durations,
          earliestStartTerm, // 추후 정렬을 위해 추가
          latestEndTerm, // 추후 정렬을 위해 추가
        };
      }),
    );

    // activities를 duration의 가장 빠른 startTerm 기준으로 오름차순 정렬
    // startTerm이 같으면 가장 늦은 endTerm 기준으로 내림차순 정렬
    activities.sort((a, b) => {
      if (a.earliestStartTerm === b.earliestStartTerm) {
        return a.latestEndTerm > b.latestEndTerm ? -1 : 1; // endTerm 내림차순
      }
      return a.earliestStartTerm < b.earliestStartTerm ? -1 : 1; // startTerm 오름차순
    });

    return activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      activityTypeEnumId: activity.activityTypeEnumId,
      activityStatusEnumId: activity.activityStatusEnumId,
      durations: activity.durations,
    }));
  }

  async deleteStudentActivityProvisional(
    activityId: number,
    studentId: number,
  ) {
    const activity = await this.getActivity({ activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: activity.clubId });

    if (!(await this.activityRepository.deleteActivity({ activityId }))) {
      throw new HttpException(
        "Something got wrong...",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @param param
   * @description getStudentProvisionalActivities와 대응되는 서비스 진입점 입니다.
   */
  async getStudentProvisionalActivities(param: {
    studentId: number;
    query: ApiAct011RequestQuery;
  }): Promise<ApiAct011ResponseOk> {
    // 해당 학생이 동아리 대표자가 맞는지 검사합니다.
    // await this.checkIsStudentDelegate({
    //   studentId: param.studentId,
    //   clubId: param.query.clubId,
    // });
    const activities = await this.getProvisionalActivities({
      clubId: param.query.clubId,
    });
    return { activities };
  }

  /**
   * @param param
   * @description getStudentProvisionalActivities와 대응되는 서비스 진입점 입니다.
   */
  async getExecutiveProvisionalActivities(param: {
    query: ApiAct012RequestQuery;
  }): Promise<ApiAct012ResponseOk> {
    // 집행부원은 아직 검사하는 권한이 없습니다.
    const activities = await this.getProvisionalActivities({
      clubId: param.query.clubId,
    });
    return { activities };
  }

  async getProfessorProvisionalActivities(param: {
    query: ApiAct013RequestQuery;
  }): Promise<ApiAct013ResponseOk> {
    // 교수님은 아직 검사하는 권한이 없습니다.
    const activities = await this.getProvisionalActivities({
      clubId: param.query.clubId,
    });
    return { activities };
  }

  async getExecutiveActivity(activityId: number): Promise<ApiAct002ResponseOk> {
    const activity = await this.getActivity({ activityId });

    const evidence = await this.activityRepository.selectFileByActivityId(
      activity.id,
    );
    const participants =
      await this.activityRepository.selectParticipantByActivityId(activity.id);
    const duration = await this.activityRepository.selectDurationByActivityId(
      activity.id,
    );

    const evidenceFiles = await Promise.all(
      evidence.map(async e => ({
        fileId: e.fileId,
        name: await this.filePublicService
          .getFileInfoById(e.fileId)
          .then(f => f.name),
        url: await this.filePublicService.getFileUrl(e.fileId),
      })),
    );

    const comments =
      await this.activityRepository.selectActivityFeedbackByActivityId({
        activityId: activity.id,
      });

    return {
      clubId: activity.clubId,
      name: activity.name,
      originalName: activity.originalName,
      activityTypeEnumId: activity.activityTypeEnumId,
      location: activity.location,
      purpose: activity.purpose,
      detail: activity.detail,
      evidence: activity.evidence,
      evidenceFiles,
      participants: participants.map(e => ({
        studentId: e.studentId,
        studentNumber: e.studentNumber,
        name: e.name,
      })),
      durations: duration.map(e => ({
        startTerm: e.startTerm,
        endTerm: e.endTerm,
      })),
      activityStatusEnumId: activity.activityStatusEnumId,
      comments: comments.map(e => ({
        content: e.comment,
        createdAt: e.createdAt,
      })),
      updatedAt: activity.updatedAt,
      professorApprovedAt: activity.professorApprovedAt,
      editedAt: activity.editedAt,
      commentedAt: activity.commentedAt,
    };
  }

  async getProfessorActivity(
    activityId: number,
    professorId: number,
  ): Promise<ApiAct002ResponseOk> {
    const activity = await this.getActivity({ activityId });

    await this.checkIsProfessor({ professorId, clubId: activity.clubId });

    const evidence = await this.activityRepository.selectFileByActivityId(
      activity.id,
    );
    const participants =
      await this.activityRepository.selectParticipantByActivityId(activity.id);
    const duration = await this.activityRepository.selectDurationByActivityId(
      activity.id,
    );

    const evidenceFiles = await Promise.all(
      evidence.map(async e => ({
        fileId: e.fileId,
        name: await this.filePublicService
          .getFileInfoById(e.fileId)
          .then(f => f.name),
        url: await this.filePublicService.getFileUrl(e.fileId),
      })),
    );

    const comments =
      await this.activityRepository.selectActivityFeedbackByActivityId({
        activityId: activity.id,
      });

    return {
      clubId: activity.clubId,
      name: activity.name,
      originalName: activity.originalName,
      activityTypeEnumId: activity.activityTypeEnumId,
      location: activity.location,
      purpose: activity.purpose,
      detail: activity.detail,
      evidence: activity.evidence,
      evidenceFiles,
      participants: participants.map(e => ({
        studentId: e.studentId,
        studentNumber: e.studentNumber,
        name: e.name,
      })),
      durations: duration.map(e => ({
        startTerm: e.startTerm,
        endTerm: e.endTerm,
      })),
      activityStatusEnumId: activity.activityStatusEnumId,
      comments: comments.map(e => ({
        content: e.comment,
        createdAt: e.createdAt,
      })),
      updatedAt: activity.updatedAt,
      professorApprovedAt: activity.professorApprovedAt,
      editedAt: activity.editedAt,
      commentedAt: activity.commentedAt,
    };
  }

  /**
   * @description patchExecutiveActivityApproval의 서비스 진입점입니다.
   */
  async patchExecutiveActivityApproval(param: {
    executiveId: number;
    param: ApiAct016RequestParam;
  }): Promise<ApiAct016ResponseOk> {
    const isApprovalSucceed =
      await this.activityRepository.updateActivityStatusEnumId({
        activityId: param.param.activityId,
        activityStatusEnumId: ActivityStatusEnum.Approved,
      });
    if (!isApprovalSucceed)
      throw new HttpException(
        "the activity is already approved",
        HttpStatus.BAD_REQUEST,
      );

    const isInsertionSucceed =
      await this.activityRepository.insertActivityFeedback({
        activityId: param.param.activityId,
        comment: "활동이 승인되었습니다", // feedback에 승인을 기록하기 위한 임의의 문자열ㄴ
        executiveId: param.executiveId,
      });
    if (!isInsertionSucceed)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);

    return {};
  }

  /**
   * @param param
   * @description patchExecutiveActivitySendBack의 서비스 진입점입니다.
   * 동시성을 고려하지 않고 구현했습니다.
   */
  async patchExecutiveActivitySendBack(param: {
    executiveId: number;
    param: ApiAct017RequestParam;
    body: ApiAct017RequestBody;
  }): Promise<ApiAct017ResponseOk> {
    await this.activityRepository.updateActivityStatusEnumId({
      activityId: param.param.activityId,
      activityStatusEnumId: ActivityStatusEnum.Rejected,
    });

    const isInsertionSucceed =
      await this.activityRepository.insertActivityFeedback({
        activityId: param.param.activityId,
        comment: param.body.comment,
        executiveId: param.executiveId,
      });
    if (!isInsertionSucceed)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);

    return {};
  }

  /**
   * @description getActivitiesDeadline의 서비스 진입점입니다.
   * @returns 오늘의 활동보고서 작성기간을 리턴합니다.
   */
  async getPublicActivitiesDeadline(): Promise<ApiAct018ResponseOk> {
    const today = getKSTDate();

    const term = await this.getLastActivityD();
    const todayDeadline = await this.activityRepository
      .selectDeadlineByDate(today)
      .then(arr => {
        if (arr.length === 0)
          throw new HttpException(
            "Today is not in the range of deadline",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        return arr[0];
      });
    return {
      targetTerm: {
        id: term.id,
        name: term.name,
        startTerm: term.startTerm,
        endTerm: term.endTerm,
        year: term.year,
      },
      deadline: {
        activityDeadlineEnum: todayDeadline.deadlineEnumId,
        duration: {
          startTerm: todayDeadline.startDate,
          endTerm: todayDeadline.endDate,
        },
      },
    };
  }

  async getProfessorActivities(
    clubId: number,
    professorId: number,
  ): Promise<ApiAct019ResponseOk> {
    await this.checkIsProfessor({ professorId, clubId });

    const activityD = await this.getLastActivityD();
    const activities =
      await this.activityRepository.selectActivityByClubIdAndActivityDId(
        clubId,
        activityD.id,
      );

    const result = await Promise.all(
      activities.map(async row => {
        const duration =
          await this.activityRepository.selectDurationByActivityId(row.id);
        return {
          ...row,
          durations: duration.map(e => ({
            startTerm: e.startTerm,
            endTerm: e.endTerm,
          })),
        };
      }),
    );

    return result.map(row => ({
      id: row.id,
      activityStatusEnumId: row.activityStatusEnumId,
      name: row.name,
      activityTypeEnumId: row.activityTypeEnumId,
      durations: row.durations,
      professorApprovedAt: row.professorApprovedAt,
      editedAt: row.editedAt,
      commentedAt: row.commentedAt,
    }));
  }

  async postProfessorActivityApprove(
    activityIds: number[],
    professorId: number,
  ) {
    const activities =
      await this.activityRepository.selectActivityByIds(activityIds);
    await this.checkIsProfessor({ professorId, clubId: activities[0].clubId });

    if (activities.some(activity => activity.clubId !== activities[0].clubId))
      throw new HttpException("Invalid club id", HttpStatus.BAD_REQUEST);

    await this.activityRepository.updateActivityProfessorApprovedAt({
      activityIds,
      professorId,
    });
  }

  async getExecutiveActivitiesClubs(): Promise<ApiAct023ResponseOk> {
    const activityDId = await this.getLastActivityD().then(e => e.id);
    const clubs = await this.clubPublicService.getAtivatedClubs();

    const clubinfos = await this.activityRepository.getExecutiveActivitiesClubs(
      {
        semesterId: await this.clubPublicService.dateToSemesterId(getKSTDate()),
        activityDId,
        clubsList: clubs.map(e => e.club.id),
      },
    );
    const activitiesOnActivityD =
      await this.activityRepository.selectActivityByActivityDId(activityDId);
    const executives = await this.userPublicService.getCurrentExecutives();
    const executiveMap = new Map<number, { id: number; name: string }>();
    executives.forEach(e => {
      executiveMap.set(e.executive.id, {
        id: e.executive.id,
        name: e.executive.name,
      });
    });

    logger.debug(`current activities count: ${activitiesOnActivityD.length}`);
    logger.debug(`current activated executives: ${executives.length}`);

    const items: ApiAct023ResponseOk["items"] = clubinfos.map(clubinfo => {
      const pendingActivitiesCount = activitiesOnActivityD.filter(
        e =>
          e.clubId === clubinfo.clubId &&
          e.activityStatusEnumId === ActivityStatusEnum.Applied,
      ).length;
      const approvedActivitiesCount = activitiesOnActivityD.filter(
        e =>
          e.clubId === clubinfo.clubId &&
          e.activityStatusEnumId === ActivityStatusEnum.Approved,
      ).length;
      const rejectedActivitiesCount = activitiesOnActivityD.filter(
        e =>
          e.clubId === clubinfo.clubId &&
          e.activityStatusEnumId === ActivityStatusEnum.Rejected,
      ).length;
      const chargedExecutive =
        clubinfo.chargedExecutiveId !== undefined &&
        clubinfo.chargedExecutiveId !== null
          ? executiveMap.get(clubinfo.chargedExecutiveId)
          : undefined;

      return {
        ...clubinfo,
        pendingActivitiesCount,
        approvedActivitiesCount,
        rejectedActivitiesCount,
        chargedExecutive,
      };
    });

    const executiveProgresses: ApiAct023ResponseOk["executiveProgresses"] =
      executives.map(executive => {
        const chargedActivities = activitiesOnActivityD.filter(
          e => e.chargedExecutiveId === executive.executive.id,
        );
        const chargedClubIds = chargedActivities.reduce(
          (acc: Array<number>, val) => {
            if (!acc.includes(val.clubId)) {
              acc.push(val.clubId);
            }
            return acc;
          },
          [],
        );
        const chargedClubsAndProgresses: ApiAct023ResponseOk["executiveProgresses"][number]["chargedClubsAndProgresses"] =
          chargedClubIds.map(clubId => {
            const pendingActivitiesCount = chargedActivities.filter(
              e =>
                e.clubId === clubId &&
                e.activityStatusEnumId === ActivityStatusEnum.Applied,
            ).length;
            const approvedActivitiesCount = chargedActivities.filter(
              e =>
                e.clubId === clubId &&
                e.activityStatusEnumId === ActivityStatusEnum.Approved,
            ).length;
            const rejectedActivitiesCount = chargedActivities.filter(
              e =>
                e.clubId === clubId &&
                e.activityStatusEnumId === ActivityStatusEnum.Rejected,
            ).length;

            const clubInfo = clubinfos.find(e => e.clubId === clubId);

            return {
              clubId,
              clubTypeEnum: clubInfo.clubTypeEnum,
              divisionName: clubInfo.divisionName,
              clubNameKr: clubInfo.clubNameKr,
              clubNameEn: clubInfo.clubNameEn,
              pendingActivitiesCount,
              approvedActivitiesCount,
              rejectedActivitiesCount,
            };
          });

        return {
          executiveId: executive.executive.id,
          executiveName: executive.executive.name,
          chargedClubsAndProgresses,
        };
      });

    return {
      items,
      executiveProgresses,
    };
  }

  async getExecutiveActivitiesClubBrief(param: {
    query: ApiAct024RequestQuery;
  }): Promise<ApiAct024ResponseOk> {
    // check the clubs is activated
    const clubs = await this.clubPublicService.getAtivatedClubs();
    if (!clubs.some(e => e.club.id === param.query.clubId)) {
      throw new HttpException("No such club", HttpStatus.NOT_FOUND);
    }

    const activities = await this.getActivities({ clubId: param.query.clubId });
    const chargedExecutiveId = await this.activityClubChargedExecutiveRepository
      .selectActivityClubChargedExecutiveByClubId({
        activityDId: await this.getLastActivityD().then(e => e.id),
        clubId: param.query.clubId,
      })
      .then(arr => {
        if (arr.length === 0) {
          return undefined;
        }
        if (arr.length > 1) {
          throw new HttpException(
            "unreachable",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        return arr[0].executiveId;
      });
    const clubChargedExecutive =
      chargedExecutiveId === undefined
        ? undefined
        : await this.userPublicService
            .getExecutiveAndExecutiveTByExecutiveId({
              executiveId: chargedExecutiveId,
            })
            .then(e => ({
              id: e.executive.id,
              name: e.executive.name,
            }));

    const items: ApiAct024ResponseOk["items"] = await Promise.all(
      activities.map(async activity => {
        const lastFeedback = await this.activityRepository
          .selectActivityFeedbackByActivityId({
            activityId: activity.id,
          })
          .then(arr =>
            arr.reduce((acc, cur) => {
              if (acc === undefined || acc.createdAt < cur.createdAt) {
                return cur;
              }
              return acc;
            }, undefined),
          );

        const commentedExecutive =
          lastFeedback === undefined
            ? undefined
            : await this.userPublicService
                .getExecutiveAndExecutiveTByExecutiveId({
                  executiveId: lastFeedback.executiveId,
                })
                .then(e => ({
                  id: e.executive.id,
                  name: e.executive.name,
                }));

        const chargedExecutive =
          activity.chargedExecutiveId === undefined ||
          activity.chargedExecutiveId === null
            ? undefined
            : await this.userPublicService
                .getExecutiveAndExecutiveTByExecutiveId({
                  executiveId: activity.chargedExecutiveId,
                })
                .then(e => ({
                  id: e.executive.id,
                  name: e.executive.name,
                }));

        return {
          activityId: activity.id,
          activityStatusEnum: activity.activityStatusEnumId,
          activityName: activity.name,
          commentedExecutive,
          chargedExecutive,
          updatedAt: activity.updatedAt,
          commentedAt: activity.commentedAt,
          editedAt: activity.editedAt,
        };
      }),
    );

    return {
      chargedExecutive: clubChargedExecutive,
      items,
    };
  }

  /**
   * @description patchExecutiveActivities의 서비스 진입점입니다.
   */
  async patchExecutiveActivities(param: {
    body: ApiAct025RequestBody;
  }): Promise<ApiAct025ResponseOk> {
    await Promise.all(
      param.body.activityIds.map(async activityId => {
        const isUpdateSuceed =
          await this.activityRepository.updateActivityChargedExecutive({
            activityId,
            executiveId: param.body.executiveId,
          });
        return isUpdateSuceed;
      }),
    );
    return {};
  }

  /**
   * @description putExecutiveActivitiesClubChargedExecutive의 서비스 진입점입니다.
   * @param body
   */
  async putExecutiveActivitiesClubChargedExecutive(param: {
    body: ApiAct026RequestBody;
  }): Promise<ApiAct026ResponseOk> {
    Promise.all(
      param.body.clubIds.map(async clubId => {
        this.changeClubChargedExecutive({
          clubId,
          executiveId: param.body.executiveId,
        });
      }),
    );
    return {};
  }

  async getExecutiveActivitiesClubChargeAvailableExecutives(
    query: ApiAct027RequestQuery,
  ): Promise<ApiAct027ResponseOk> {
    const nowKST = getKSTDate();
    const semester = await this.clubPublicService.fetchSemester(nowKST);
    const { clubIds } = query;

    // TODO: 지금은 entity로 불러오는데, id만 들고 오는 public service 및 repository 를 만들어서 한다면 좀더 효율이 높아질 수 있음
    const [clubMembers, executives] = await Promise.all([
      this.clubPublicService.getUnionMemberSummaries(semester.id, clubIds),
      this.userPublicService.getCurrentExecutiveSummaries(),
    ]);

    const clubMemberUserIds = clubMembers.map(e => e.userId);
    // clubMemberUserIds에 없는 executive만 필터링
    return {
      executives: executives.filter(e => !clubMemberUserIds.includes(e.userId)),
    };
  }

  async getStudentActivitiesAvailable(
    studentId: number,
    clubId: number,
  ): Promise<ApiAct021ResponseOk> {
    const [isStudentDelegate] = await Promise.all([
      this.clubPublicService.isStudentDelegate(studentId, clubId),
    ]);
    if (!isStudentDelegate) {
      throw new HttpException(
        `Student ${studentId} is not the delegate of Club ${clubId}`,
        HttpStatus.FORBIDDEN,
      );
    }

    const activityD = await this.getLastActivityD();
    const activities = await this.activityRepository.fetchAvailableSummaries(
      clubId,
      activityD.id,
    );

    return {
      activities,
    };
  }

  async getStudentActivityParticipants(
    activityId: number,
  ): Promise<ApiAct022ResponseOk> {
    const participantIds =
      await this.activityRepository.fetchParticipantIds(activityId);
    return {
      participants:
        await this.userPublicService.fetchStudentSummaries(participantIds),
    };
  }

  async getExecutiveActivitiesExecutiveBrief(
    executiveId: number,
  ): Promise<ApiAct028ResponseOk> {
    const [executive, activities] = await Promise.all([
      this.userPublicService.fetchExecutiveSummary(executiveId),
      this.activityRepository.fetchCommentedSummaries(executiveId),
    ]);

    // 필요한 모든 ID들을 수집
    const clubIds = new Set(activities.map(activity => activity.club.id));
    const executiveIds = new Set(
      activities.flatMap(activity =>
        [activity.chargedExecutive?.id, activity.commentedExecutive?.id].filter(
          Boolean,
        ),
      ),
    );

    // 한 번에 모든 데이터 가져오기
    const [clubs, executives] = await Promise.all([
      this.clubPublicService.fetchSummaries(Array.from(clubIds)),
      this.userPublicService.fetchExecutiveSummaries(Array.from(executiveIds)),
    ]);

    // 조회를 위한 Map 생성
    const clubMap = new Map(clubs.map(club => [club.id, club]));
    const executiveMap = new Map(executives.map(exec => [exec.id, exec]));

    // 데이터 매핑
    const activitiesWithDetails = activities.map(activity => ({
      ...activity,
      club: clubMap.get(activity.club.id),
      chargedExecutive: activity.chargedExecutive?.id
        ? executiveMap.get(activity.chargedExecutive.id)
        : null,
      commentedExecutive: activity.commentedExecutive?.id
        ? executiveMap.get(activity.commentedExecutive.id)
        : null,
    }));

    return {
      chargedExecutive: executive,
      activities: activitiesWithDetails,
    };
  }

  async getStudentActivityProvisional(
    activityId: ApiAct029RequestParam["activityId"],
  ): Promise<ApiAct029ResponseOk> {
    const activity = await this.activityRepository.fetch(activityId);
    const comments =
      await this.activityRepository.selectActivityFeedbackByActivityId({
        activityId: activity.id,
      });
    const evidenceFiles = await this.filePublicService.getFilesByIds(
      activity.evidenceFiles.map(e => e.id),
    );
    const participants = await this.userPublicService.fetchStudentSummaries(
      activity.participants.map(e => e.id),
    );
    const club = await this.clubPublicService.fetchSummary(activity.club.id);
    return {
      ...activity,
      club,
      comments: comments.map(e => ({
        id: e.id,
        createdAt: e.createdAt,
        content: e.comment,
      })),
      evidenceFiles,
      participants,
    };
  }
}
