import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";
import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";
import {
  ActivityDeadlineEnum,
  RegistrationDeadlineEnum,
} from "@clubs/domain/semester/deadline";

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
} from "@clubs/interface/api/activity/index";

import { takeExist } from "@sparcs-clubs/api/common/util/util";
import { MActivity } from "@sparcs-clubs/api/feature/activity/model/activity.model.new";
import ActivityClubChargedExecutiveRepository from "@sparcs-clubs/api/feature/activity/repository/activity.activity-club-charged-executive.repository";
import { ActivityNewRepository } from "@sparcs-clubs/api/feature/activity/repository/activity.new.repository";
import ActivityRepository from "@sparcs-clubs/api/feature/activity/repository/activity.repository";
import ClubTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-t.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import FilePublicService from "@sparcs-clubs/api/feature/file/service/file.public.service";
import { RegistrationPublicService } from "@sparcs-clubs/api/feature/registration/service/registration.public.service";
import { ActivityDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.deadline.public.service";
import { ActivityDurationPublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.duration.public.service";
import { RegistrationDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/registration.deadline.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

@Injectable()
export default class ActivityService {
  constructor(
    private readonly activityOldRepository: ActivityRepository,
    private readonly activityRepository: ActivityNewRepository,
    private readonly activityDurationPublicService: ActivityDurationPublicService,
    private readonly activityDeadlinePublicService: ActivityDeadlinePublicService,
    private readonly semesterPublicService: SemesterPublicService,
    private readonly clubPublicService: ClubPublicService,
    private readonly clubTRepository: ClubTRepository,
    private readonly filePublicService: FilePublicService,
    private readonly registrationPublicService: RegistrationPublicService,
    private readonly registrationDeadlinePublicService: RegistrationDeadlinePublicService,
    private readonly userPublicService: UserPublicService,
    private readonly activityClubChargedExecutiveRepository: ActivityClubChargedExecutiveRepository,
  ) {}

  /**
   * @param activityId 활동 id
   * @returns 해당id의 활동이 존재할 경우 그 정보를 리턴합니다.
   * 존재하지 않을 경우 not found exception을 throw합니다.`
   */
  private async getActivity(param: { activityId: number }) {
    // const activities = await this.activityRepository.selectActivityByActivityId(
    //   param.activityId,
    // );
    const activities = await this.activityRepository.find({
      id: param.activityId,
    });
    if (activities.length > 1)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
    if (activities.length === 0)
      throw new HttpException("No such activity", HttpStatus.NOT_FOUND);

    return activities[0];
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
    await this.checkIsStudentDelegate({ studentId, clubId });

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
  async deleteStudentActivity(activityId: number, studentId: number) {
    const activity = await this.getActivity({ activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: activity.club.id });
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
    const activity = await this.getActivity({ activityId });

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

    const comments =
      await this.activityOldRepository.selectActivityFeedbackByActivityId({
        activityId: activity.id,
      });

    return {
      clubId: activity.club.id,
      name: activity.name,
      originalName: activity.name,
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
        content: e.comment,
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
    await this.checkIsStudentDelegate({ studentId, clubId: body.clubId });

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

    const activities = await this.getActivities({ clubId: body.clubId });
    if (activities.length >= 20) {
      throw new HttpException(
        "The number of activities is over the limit",
        HttpStatus.BAD_REQUEST,
      );
    }
    // QUESTION: 신청내용중 startTerm과 endTerm이 이번 학기의 활동기간에 맞는지 검사해야 할까요?.
    // Answer: 네!!!
    const activityDId = await this.activityDurationPublicService.loadId();
    // 현재학기에 동아리원이 아니였던 참가자가 있는지 검사합니다.
    // TODO: 현재학기 뿐만 아니라 직전학기 동아리원도 활동 참가자로 포함될 수 있어야 합니다.
    const participants = await Promise.all(
      body.participants.map(async e => e.studentId),
    );
    // TOD
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
    const activity = await this.getActivity({ activityId: param.activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: activity.club.id });
    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인합니다.
    await this.activityDeadlinePublicService.search({
      date: new Date(),
      deadlineEnum: [
        ActivityDeadlineEnum.Writing,
        ActivityDeadlineEnum.Modification,
        ActivityDeadlineEnum.Exception,
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
        commentedAt: new Date(),
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
    const activity = await this.getActivity({ activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    // 이거 맞나? 등록 기간용 따로 파야 할 수도
    await this.checkIsStudentDelegate({ studentId, clubId: activity.club.id });

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
    await this.checkIsStudentDelegate({ studentId, clubId: query.clubId });
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

  async postStudentActivityProvisional(
    body: ApiAct007RequestBody,
    studentId: number,
  ): Promise<void> {
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: body.clubId });

    // 오늘이 활동보고서 작성기간이거나, 예외적 작성기간인지 확인하지 않습니다.

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
    const activity = await this.getActivity({ activityId: param.activityId });
    // 학생이 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    await this.checkIsStudentDelegate({ studentId, clubId: activity.club.id });
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
}
