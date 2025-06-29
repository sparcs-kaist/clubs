import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";
import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";
import {
  ActivityDeadlineEnum,
  RegistrationDeadlineEnum,
} from "@clubs/domain/semester/deadline";

import {
  ApiAct024RequestQuery,
  ApiAct024ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct024";
import {
  ApiAct025RequestBody,
  ApiAct025ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct025";
import {
  ApiAct026RequestBody,
  ApiAct026ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct026";
import {
  ApiAct001RequestBody,
  ApiAct002ResponseOk,
  ApiAct003RequestBody,
  ApiAct003RequestParam,
  ApiAct005ResponseOk,
  ApiAct006RequestParam,
  ApiAct006RequestQuery,
  ApiAct006ResponseOk,
  ApiAct007RequestBody,
  ApiAct008RequestBody,
  ApiAct008RequestParam,
  ApiAct010RequestQuery,
  ApiAct010ResponseOk,
  ApiAct011RequestQuery,
  ApiAct011ResponseOk,
  ApiAct012RequestQuery,
  ApiAct012ResponseOk,
  ApiAct013RequestQuery,
  ApiAct013ResponseOk,
  ApiAct014ResponseOk,
  ApiAct015ResponseOk,
  ApiAct016RequestParam,
  ApiAct016ResponseOk,
  ApiAct017RequestBody,
  ApiAct017RequestParam,
  ApiAct017ResponseOk,
} from "@clubs/interface/api/activity/index";

import { takeExist } from "@sparcs-clubs/api/common/util/util";
import { MActivity } from "@sparcs-clubs/api/feature/activity/model/activity.model.new";
import { ActivityNewRepository } from "@sparcs-clubs/api/feature/activity/repository/activity.new.repository";
import { ActivityClubChargedExecutiveRepository } from "@sparcs-clubs/api/feature/activity/repository/activity-club-charge-executive.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import FilePublicService from "@sparcs-clubs/api/feature/file/service/file.public.service";
import { RegistrationPublicService } from "@sparcs-clubs/api/feature/registration/service/registration.public.service";
import { ActivityDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.deadline.public.service";
import { ActivityDurationPublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.duration.public.service";
import { RegistrationDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/registration.deadline.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { MActivityClubChargedExecutive } from "../model/activity-club-charged-executive.model";
import { ActivityCommentRepository } from "../repository/activity-comment.repository";

@Injectable()
export default class ActivityService {
  constructor(
    private readonly activityRepository: ActivityNewRepository,
    private readonly activityClubChargedExecutiveRepository: ActivityClubChargedExecutiveRepository,
    private readonly activityCommentRepository: ActivityCommentRepository,
    private readonly activityDurationPublicService: ActivityDurationPublicService,
    private readonly activityDeadlinePublicService: ActivityDeadlinePublicService,
    private readonly semesterPublicService: SemesterPublicService,
    private readonly clubPublicService: ClubPublicService,
    private readonly filePublicService: FilePublicService,
    private readonly registrationPublicService: RegistrationPublicService,
    private readonly registrationDeadlinePublicService: RegistrationDeadlinePublicService,
    private readonly userPublicService: UserPublicService,
  ) {}

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
      param.activityDId ?? (await this.activityDurationPublicService.loadId());

    const activities = await this.activityRepository.find({
      activityDId,
      clubId: param.clubId,
    });
    return activities;
  }

  async getStudentActivities(
    clubId: number,
    studentId: number,
  ): Promise<ApiAct005ResponseOk> {
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId,
    });

    const activityDId = await this.activityDurationPublicService.loadId();

    const activities = await this.activityRepository.find({
      clubId,
      activityDId,
    });

    return activities
      .map(row => ({
        id: row.id,
        activityStatusEnumId: row.activityStatusEnum,
        name: row.name,
        activityTypeEnumId: row.activityTypeEnum,
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

  async deleteStudentActivity(activityId: number, studentId: number) {
    const activity = await this.activityRepository.fetch(activityId);
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId: activity.club.id,
    });
    // 오늘이 활동보고서 작성기간 | 수정기간 | 예외적 작성기간인지 확인합니다.
    await this.activityDeadlinePublicService.search({
      date: new Date(),
      deadlineEnum: [
        ActivityDeadlineEnum.Writing,
        ActivityDeadlineEnum.Modification,
        ActivityDeadlineEnum.Exception,
      ],
    });

    //if (!(await this.activityRepository.deleteActivity({ activityId }))) {
    if (!(await this.activityRepository.delete({ id: activityId }))) {
      throw new HttpException(
        "Something got wrong...",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getStudentActivity(
    activityId: number,
    // studentId: number,
  ): Promise<ApiAct002ResponseOk> {
    const activity = await this.activityRepository.fetch(activityId);

    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    // await this.checkIsStudentDelegate({ studentId, clubId: activity.clubId });
    const participants = await Promise.all(
      activity.participants.map(async e => {
        const student = await this.userPublicService.getStudentById({
          id: e.id,
        });
        return {
          studentId: e.id,
          studentNumber: student.number,
          name: student.name,
        };
      }),
    );
    // const duration = await this.activityRepository.selectDurationByActivityId(
    //   activity.id,
    // );

    const evidenceFiles = await Promise.all(
      activity.evidenceFiles.map(async e => ({
        fileId: e.id,
        name: await this.filePublicService
          .getFileInfoById(e.id)
          .then(f => f.name),
        url: await this.filePublicService.getFileUrl(e.id),
      })),
    );

    const comments = await this.activityCommentRepository.find({
      activityId: activity.id,
    });

    return {
      clubId: activity.club.id,
      name: activity.name,
      activityTypeEnumId: activity.activityTypeEnum,
      location: activity.location,
      purpose: activity.purpose,
      detail: activity.detail,
      evidence: activity.evidence,
      evidenceFiles,
      participants,
      durations: activity.durations,
      activityStatusEnumId: activity.activityStatusEnum,
      comments: comments.map(e => ({
        // TODO?: status 추가하기?
        content: e.content,
        createdAt: e.createdAt,
      })),
      updatedAt: activity.editedAt,
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
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId: body.clubId,
    });

    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인합니다.
    await this.activityDeadlinePublicService
      .search({
        date: new Date(),
        deadlineEnum: [
          ActivityDeadlineEnum.Writing,
          ActivityDeadlineEnum.Exception,
        ],
      })
      .then(takeExist());
    const activityDId = await this.activityDurationPublicService.loadId();
    const activities = await this.activityRepository.count({
      clubId: body.clubId,
      activityDId,
    });
    if (activities >= 20) {
      throw new HttpException(
        "The number of activities is over the limit",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 현재학기에 동아리원이 아니였던 참가자가 있는지 검사합니다.
    // TODO: 현재학기 뿐만 아니라 직전학기 동아리원도 활동 참가자로 포함될 수 있어야 합니다.
    const participants = await Promise.all(
      body.participants.map(async e => e.studentId),
    );
    // TODO: ActivityDuration 과 입력된 Duration들이 유효한 지 확인하는 로직
    // TODO: 해당 학기에 활동한 인원인지 검사하는 로직
    // TODO: 파일 유효한지 검사하는 로직도 필요해요! 이건 파일 모듈 구성되면 public할듯

    const isInsertionSucceed = await this.activityRepository.create({
      ...body,
      club: { id: body.clubId },
      activityTypeEnum: body.activityTypeEnumId,
      activityStatusEnum: ActivityStatusEnum.Applied,
      durations: body.duration,
      evidenceFiles: body.evidenceFiles.map(row => ({ id: row.uid })),
      participants: participants.map(e => ({ id: e })),
      activityDuration: { id: activityDId },
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
    const activity = await this.activityRepository.fetch(param.activityId);
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId: activity.club.id,
    });
    // 오늘이 활동보고서 작성기간이거나, 수정 작성기간인지 확인합니다.
    await this.activityDeadlinePublicService.search({
      date: new Date(),
      deadlineEnum: [
        ActivityDeadlineEnum.Writing,
        ActivityDeadlineEnum.Modification,
        // ActivityDeadlineEnum.Exception,
      ],
    });
    // 해당 활동이 지난 활동기간에 대한 활동인지 확인합니다.
    const activityD = await this.activityDurationPublicService.load();
    if (activity.activityDuration.id !== activityD.id)
      throw new HttpException(
        "The activity is not the activity of the last activity duration ",
        HttpStatus.BAD_REQUEST,
      );
    // 제출한 활동 기간들이 지난 활동기간 이내인지 확인합니다.
    body.durations.forEach(duration => {
      if (
        activityD.startTerm <= duration.startTerm &&
        duration.endTerm <= activityD.endTerm
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
    const activityDStartSemesterId = await this.semesterPublicService.loadId({
      date: activityD.startTerm,
    });
    const activityDEndSemesterId = await this.semesterPublicService.loadId({
      date: activityD.endTerm,
    });
    const members = (
      await this.clubPublicService.getMemberFromSemester({
        semesterId: activityDStartSemesterId,
        clubId: activity.club.id,
      })
    ).concat(
      await this.clubPublicService.getMemberFromSemester({
        semesterId: activityDEndSemesterId,
        clubId: activity.club.id,
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

    const isUpdateSucceed = await this.activityRepository.put(
      new MActivity({
        id: param.activityId,
        name: body.name,
        activityTypeEnum: body.activityTypeEnumId,
        durations: body.durations,
        location: body.location,
        purpose: body.purpose,
        detail: body.detail,
        evidence: body.evidence,
        evidenceFiles: body.evidenceFiles.map(e => ({
          id: e.fileId,
        })),
        participants: body.participants.map(e => ({
          id: e.studentId,
        })),
        chargedExecutive: { id: activity.chargedExecutive?.id },
        activityDuration: { id: activity.activityDuration.id },
        activityStatusEnum: ActivityStatusEnum.Applied,
        club: { id: activity.club.id },
        editedAt: new Date(),
        professorApprovedAt: undefined,
        commentedAt: undefined,
        commentedExecutive: undefined,
      }),
    );

    if (!isUpdateSucceed)
      throw new HttpException(
        "Failed to update",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }
  async deleteStudentActivityProvisional(
    activityId: number,
    studentId: number,
  ) {
    const activity = await this.activityRepository.fetch(activityId);
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    // 이거 맞나? 등록 기간용 따로 파야 할 수도
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId: activity.club.id,
    });

    // 현재가 동아리 등록 기간인지 확인합니다
    await this.registrationDeadlinePublicService.validate({
      date: new Date(),
      deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
    });

    if (!(await this.activityRepository.delete({ id: activityId }))) {
      throw new HttpException(
        "Something got wrong...",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStudentActivitiesActivityTerm(
    param: ApiAct006RequestParam,
    query: ApiAct006RequestQuery,
    studentId: number,
  ): Promise<ApiAct006ResponseOk> {
    // 요청한 학생이 동아리의 대표자인지 확인합니다.
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId: query.clubId,
    });
    const activities = await this.activityRepository.find({
      clubId: query.clubId,
      activityDId: param.activityTermId,
    });
    const result = await Promise.all(
      activities.map(async row => ({
        id: row.id,
        name: row.name,
        activityTypeEnumId: row.activityTypeEnum,
        durations: row.durations.sort((a, b) =>
          a.startTerm.getTime() === b.startTerm.getTime()
            ? a.endTerm.getTime() - b.endTerm.getTime()
            : a.startTerm.getTime() - b.startTerm.getTime(),
        ),
      })),
    );
    return {
      activities: result.sort((a, b) =>
        a.durations[0].startTerm.getTime() ===
        b.durations[0].startTerm.getTime()
          ? a.durations[0].endTerm.getTime() - b.durations[0].endTerm.getTime()
          : a.durations[0].startTerm.getTime() -
            b.durations[0].startTerm.getTime(),
      ),
    };
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
    const activityDId = await this.activityDurationPublicService.loadId();
    const prevChargedExecutive =
      await this.activityClubChargedExecutiveRepository.find({
        activityDId,
        clubId: param.clubId,
      });
    let upsertResult = false;
    if (prevChargedExecutive.length === 0) {
      upsertResult =
        (
          await this.activityClubChargedExecutiveRepository.create({
            activityDuration: { id: activityDId },
            club: { id: param.clubId },
            executive: { id: param.executiveId },
          })
        ).length > 0;
    } else {
      upsertResult =
        (
          await this.activityClubChargedExecutiveRepository.patch(
            { id: prevChargedExecutive[0].id },
            MActivityClubChargedExecutive.updateExecutiveId(param.executiveId),
          )
        ).length > 0;
    }
    if (upsertResult === false) {
      throw new HttpException(
        "failed to change charged-executive",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const activities = await this.activityRepository.find({
      clubId: param.clubId,
      activityDId,
    });

    await Promise.all(
      activities.map(async e => {
        const isUpdateSuceed = await this.activityRepository.patch(
          { id: e.id },
          executive =>
            new MActivity({
              ...executive,
              chargedExecutive: { id: param.executiveId },
            }),
        );
        return isUpdateSuceed;
      }),
    );
  }

  /**
   * @description getStudentActivitiesAvailableMembers의 서비스 진입점입니다.
   */
  async getStudentActivitiesAvailableMembers(param: {
    studentId: number;
    query: ApiAct010RequestQuery;
  }): Promise<ApiAct010ResponseOk> {
    await this.clubPublicService.checkIsStudentDelegate({
      studentId: param.studentId,
      clubId: param.query.clubId,
    });

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

  async postStudentActivityProvisional(
    body: ApiAct007RequestBody,
    studentId: number,
  ): Promise<void> {
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId: body.clubId,
    });

    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인하지 않습니다.
    await this.registrationDeadlinePublicService.validate({
      date: new Date(),
      deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
    });

    const activityDId = await this.activityDurationPublicService.loadId({
      date: new Date(),
      activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
    });
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
    const isInsertionSucceed = await this.activityRepository.create({
      ...body,
      club: { id: body.clubId },
      activityTypeEnum: body.activityTypeEnumId,
      activityStatusEnum: ActivityStatusEnum.Applied,
      evidenceFiles: evidenceFiles.map(row => ({
        id: row.id,
      })),
      participants: participantIds.map(row => ({
        id: row,
      })),
      activityDuration: { id: activityDId },
      durations: body.durations,
    });

    if (!isInsertionSucceed)
      throw new HttpException(
        "Failed to insert",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    this.registrationPublicService.resetClubRegistrationStatusEnum(body.clubId);
  }

  async putStudentActivityProvisional(
    param: ApiAct008RequestParam,
    body: ApiAct008RequestBody,
    studentId: number,
  ): Promise<void> {
    const activity = await this.activityRepository.fetch(param.activityId);
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.clubPublicService.checkIsStudentDelegate({
      studentId,
      clubId: activity.club.id,
    });
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
    const isUpdateSucceed = this.activityRepository.put({
      ...activity,
      id: param.activityId,
      name: body.name,
      activityTypeEnum: body.activityTypeEnumId,
      durations: body.durations,
      location: body.location,
      purpose: body.purpose,
      detail: body.detail,
      evidence: body.evidence,
      evidenceFiles: evidenceFiles.map(e => ({
        id: e.id,
      })),
      participants: body.participants.map(e => ({
        id: e.studentId,
      })),
      activityDuration: { id: activity.activityDuration.id },
      activityStatusEnum: ActivityStatusEnum.Applied,
    });
    if (!isUpdateSucceed)
      throw new HttpException(
        "Failed to update",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    this.registrationPublicService.resetClubRegistrationStatusEnum(
      activity.club.id,
    );
  }

  /**
   * @param clubId 동아리 ID
   * @description REG-011, 012, 013에서 공통적으로 이용하는 동아리 활동 전체조회 입니다.
   * @returns 해당 동아리가 작성한 모든 활동을 REG-011의 리턴 타입에 맞추어 가져옵니다.
   */
  private async getProvisionalActivities(param: { clubId: number }) {
    const activityDId = await this.activityDurationPublicService.loadId({
      date: new Date(),
      activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
    });
    const resultNow = await this.activityRepository.find({
      clubId: param.clubId,
      activityDId,
    });
    // 25 봄 한정. TODO: 25봄 등록 이후 삭제 필요
    // Ascend 의 이전 학기 등록 시 활보를 가져오기 위해 이전 학기의 목록을 가져옵니다.
    const prevActivityDId = await this.activityDurationPublicService.loadId({
      semesterId:
        (await this.semesterPublicService.loadId({
          date: new Date(),
        })) - 1,
      activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
    });
    const prevActivities = await this.activityRepository.find({
      clubId: param.clubId,
      activityDId: prevActivityDId,
    });
    const result = [...resultNow, ...prevActivities];
    // Ascend 특별처리 End
    const activities = await Promise.all(
      result.map(async activity => {
        // 가장 빠른 startTerm을 추출
        const earliestStartTerm = activity.durations[0]?.startTerm;

        // 가장 늦은 endTerm을 추출 (startTerm이 같을 경우 대비)
        const latestEndTerm = activity.durations[0]?.endTerm;

        return {
          id: activity.id,
          name: activity.name,
          activityTypeEnumId: activity.activityTypeEnum,
          activityStatusEnumId: activity.activityStatusEnum,
          durations: activity.durations,
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

  /**
   * @description patchExecutiveActivityApproval의 서비스 진입점입니다.
   */
  async patchExecutiveActivityApproval(param: {
    executiveId: number;
    param: ApiAct016RequestParam;
  }): Promise<ApiAct016ResponseOk> {
    // TODO: transaction 추가
    const isApprovalSucceed = await this.activityRepository.patch(
      {
        id: param.param.activityId,
      },
      MActivity.updateStatus(ActivityStatusEnum.Approved),
    );
    if (!isApprovalSucceed)
      throw new HttpException(
        "the activity is already approved",
        HttpStatus.BAD_REQUEST,
      );

    const isInsertionSucceed = await this.activityCommentRepository.create({
      activity: { id: param.param.activityId },
      content: "활동이 승인되었습니다", // feedback에 승인을 기록하기 위한 임의의 문자열
      // TODO?: 활동 승인 시에도 content를 넣을까요?
      executive: { id: param.executiveId },
      activityStatusEnum: ActivityStatusEnum.Approved,
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
    // TODO: transaction 추가
    await this.activityRepository.patch(
      {
        id: param.param.activityId,
      },
      MActivity.updateStatus(ActivityStatusEnum.Rejected),
    );

    const isInsertionSucceed = await this.activityCommentRepository.create({
      activity: { id: param.param.activityId },
      content: param.body.comment,
      executive: { id: param.executiveId },
      activityStatusEnum: ActivityStatusEnum.Rejected,
    });
    if (!isInsertionSucceed)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);

    return {};
  }

  async getExecutiveActivitiesClubBrief(param: {
    query: ApiAct024RequestQuery;
  }): Promise<ApiAct024ResponseOk> {
    // check the clubs is activated
    const clubs = await this.clubPublicService.getAtivatedClubs();
    if (!clubs.some(e => e.club.id === param.query.clubId)) {
      throw new HttpException("No such club", HttpStatus.NOT_FOUND);
    }

    const activityDId =
      param.query.activityDurationId ??
      (await this.activityDurationPublicService.loadId());

    const activities = await this.getActivities({
      clubId: param.query.clubId,
      activityDId,
    });
    const chargedExecutiveId = await this.activityClubChargedExecutiveRepository
      .find({
        activityDId,
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
        return arr[0].executive.id;
      });
    const clubChargedExecutive =
      chargedExecutiveId === undefined
        ? undefined
        : await this.userPublicService
            .getExecutiveAndExecutiveTByExecutiveId({
              executiveId: chargedExecutiveId,
            })
            .then(e =>
              e === undefined
                ? undefined
                : {
                    id: e.executive.id,
                    name: e.executive.name,
                  },
            );

    const items: ApiAct024ResponseOk["items"] = await Promise.all(
      activities.map(async activity => {
        const lastFeedback = await this.activityCommentRepository
          .find({
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
          lastFeedback === undefined ||
          lastFeedback.executive === undefined ||
          lastFeedback.executive.id === null
            ? undefined
            : await this.userPublicService
                .getExecutiveAndExecutiveTByExecutiveId({
                  executiveId: lastFeedback.executive.id,
                })
                .then(e =>
                  e === undefined
                    ? undefined
                    : {
                        id: e.executive.id,
                        name: e.executive.name,
                      },
                );

        const chargedExecutive =
          activity.chargedExecutive === undefined ||
          activity.chargedExecutive === null ||
          activity.chargedExecutive.id === null ||
          activity.chargedExecutive.id === undefined
            ? undefined
            : await this.userPublicService
                .getExecutiveAndExecutiveTByExecutiveId({
                  executiveId: activity.chargedExecutive.id,
                })
                .then(e =>
                  e === undefined
                    ? undefined
                    : {
                        id: e.executive.id,
                        name: e.executive.name,
                      },
                );

        return {
          activityId: activity.id,
          activityStatusEnum: activity.activityStatusEnum,
          activityName: activity.name,
          commentedExecutive,
          chargedExecutive,
          updatedAt: activity.editedAt,
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
        const isUpdateSuceed = await this.activityRepository.patch(
          { id: activityId },
          MActivity.updateChargedExecutive(param.body.executiveId),
        );
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

  async getExecutiveActivity(activityId: number): Promise<ApiAct014ResponseOk> {
    const activity = await this.activityRepository.fetch(activityId);

    const studentMap = await this.userPublicService.getStudentMapByIds(
      activity.participants.map(e => e.id),
    );
    const participants = activity.participants.map(e => ({
      studentId: e.id,
      studentNumber: Number(studentMap.get(e.id)?.studentNumber),
      name: studentMap.get(e.id)?.name,
    }));

    const evidenceFiles = await Promise.all(
      activity.evidenceFiles.map(async e => ({
        fileId: e.id,
        name: await this.filePublicService
          .getFileInfoById(e.id)
          .then(f => f.name),
        url: await this.filePublicService.getFileUrl(e.id),
      })),
    );

    const comments = await this.activityCommentRepository.find({
      activityId: activity.id,
    });

    return {
      clubId: activity.club.id,
      name: activity.name,
      activityTypeEnumId: activity.activityTypeEnum,
      location: activity.location,
      purpose: activity.purpose,
      detail: activity.detail,
      evidence: activity.evidence,
      evidenceFiles,
      participants,
      durations: activity.durations.map(e => ({
        startTerm: e.startTerm,
        endTerm: e.endTerm,
      })),
      activityStatusEnumId: activity.activityStatusEnum,
      comments: comments.map(e => ({
        content: e.content,
        createdAt: e.createdAt,
      })),
      updatedAt: activity.editedAt,
      professorApprovedAt: activity.professorApprovedAt,
      editedAt: activity.editedAt,
      commentedAt: activity.commentedAt,
    };
  }

  async getProfessorActivity(
    activityId: number,
    professorId: number,
  ): Promise<ApiAct015ResponseOk> {
    const activity = await this.activityRepository.fetch(activityId);
    await this.clubPublicService.checkIsProfessor({
      professorId,
      clubId: activity.club.id,
      date: new Date(),
    });

    const studentMap = await this.userPublicService.getStudentMapByIds(
      activity.participants.map(e => e.id),
    );
    const participants = activity.participants.map(e => ({
      studentId: e.id,
      studentNumber: Number(studentMap.get(e.id)?.studentNumber),
      name: studentMap.get(e.id)?.name,
    }));

    const evidenceFiles = await Promise.all(
      activity.evidenceFiles.map(async e => ({
        fileId: e.id,
        name: await this.filePublicService
          .getFileInfoById(e.id)
          .then(f => f.name),
        url: await this.filePublicService.getFileUrl(e.id),
      })),
    );

    const comments = await this.activityCommentRepository.find({
      activityId: activity.id,
    });

    return {
      clubId: activity.club.id,
      name: activity.name,
      activityTypeEnumId: activity.activityTypeEnum,
      location: activity.location,
      purpose: activity.purpose,
      detail: activity.detail,
      evidence: activity.evidence,
      evidenceFiles,
      participants,
      durations: activity.durations.map(e => ({
        startTerm: e.startTerm,
        endTerm: e.endTerm,
      })),
      activityStatusEnumId: activity.activityStatusEnum,
      comments: comments.map(e => ({
        content: e.content,
        createdAt: e.createdAt,
      })),
      updatedAt: activity.editedAt,
      professorApprovedAt: activity.professorApprovedAt,
      editedAt: activity.editedAt,
      commentedAt: activity.commentedAt,
    };
  }
}
