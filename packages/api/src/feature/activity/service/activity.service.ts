import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import {
  ApiAct009RequestQuery,
  ApiAct009ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct009";
import type { ApiAct019ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct019";
import { ApiAct021ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct021";
import { ApiAct022ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct022";
import type {
  ApiAct023RequestQuery,
  ApiAct023ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct023";
import type {
  ApiAct027RequestQuery,
  ApiAct027ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct027";
import { ApiAct028ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct028";
import {
  ApiAct029RequestParam,
  ApiAct029ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct029";
import {
  ActivityDeadlineEnum,
  ActivityStatusEnum,
} from "@clubs/interface/common/enum/activity.enum";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import FilePublicService from "@sparcs-clubs/api/feature/file/service/file.public.service";
import { ActivityDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.deadline.public.service";
import { ActivityDurationPublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.duration.public.service";
import { RegistrationDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/registration.deadline.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { ActivityNewRepository } from "../repository/activity.new.repository";
import ActivityRepository from "../repository/activity.repository";
import { ActivityClubChargedExecutiveRepository } from "../repository/activity-club-charge-executive.repository";

@Injectable()
export default class ActivityOldService {
  constructor(
    private activityRepository: ActivityRepository,
    private clubPublicService: ClubPublicService,
    private filePublicService: FilePublicService,
    private userPublicService: UserPublicService,
    private semesterPublicService: SemesterPublicService,
    private activityDeadlinePublicService: ActivityDeadlinePublicService,
    private activityDurationPublicService: ActivityDurationPublicService,
    private activityNewRepository: ActivityNewRepository,
    private registrationDeadlinePublicService: RegistrationDeadlinePublicService,
    private activityClubChargedExecutiveRepository: ActivityClubChargedExecutiveRepository,
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
    const activities = await this.activityNewRepository.find({
      id: param.activityId,
    });
    if (activities.length > 1)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
    if (activities.length === 0)
      throw new HttpException("No such activity", HttpStatus.NOT_FOUND);

    return activities[0];
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
    if (!(await this.activityNewRepository.delete({ id: activityId }))) {
      throw new HttpException(
        "Something got wrong...",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

    if (!(await this.activityRepository.deleteActivity({ activityId }))) {
      throw new HttpException(
        "Something got wrong...",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProfessorActivities(
    clubId: number,
    professorId: number,
  ): Promise<ApiAct019ResponseOk> {
    await this.clubPublicService.checkIsProfessor({
      professorId,
      clubId,
    });

    const activityDId = await this.activityDurationPublicService.loadId();
    const activities =
      await this.activityRepository.selectActivityByClubIdAndActivityDId(
        clubId,
        activityDId,
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
    await this.clubPublicService.checkIsProfessor({
      professorId,
      clubId: activities[0].clubId,
    });

    if (activities.some(activity => activity.clubId !== activities[0].clubId))
      throw new HttpException("Invalid club id", HttpStatus.BAD_REQUEST);

    await this.activityRepository.updateActivityProfessorApprovedAt({
      activityIds,
      professorId,
    });
  }

  async getExecutiveActivitiesClubs(
    query: ApiAct023RequestQuery,
  ): Promise<ApiAct023ResponseOk> {
    const date = new Date(); //new Date("2025-01-05");
    const semesterId = await this.semesterPublicService.loadId({
      date,
    });
    const activityDId = await this.activityDurationPublicService.loadId({
      semesterId,
    });
    // console.log(`QUERY: ${JSON.stringify(query)}`);
    // console.log(`${Boolean(query.clubName)}`);
    const [
      clubs,
      activityClubChargedExecutiveList,
      activitiesOnActivityD,
      executives,
    ] = await Promise.all([
      this.clubPublicService.searchClubDetailByDate({
        date,
        clubTypeEnum: ClubTypeEnum.Regular,
        // name: query.clubName,
      }),
      this.activityClubChargedExecutiveRepository.find({
        activityDId,
      }),
      this.activityRepository.selectActivityByActivityDId(activityDId),
      this.userPublicService.getCurrentExecutives(),
    ]);

    // console.log(
    //   `RESULT1: ${JSON.stringify([
    //     clubs,
    //     activityClubChargedExecutiveList,
    //     activitiesOnActivityD,
    //     executives,
    //   ])}`,
    // );
    const clubChargedExecutiveMap = new Map(
      activityClubChargedExecutiveList.map(e => [e.club.id, e.executive.id]),
    );

    const clubList = clubs.map(club => ({
      ...club,
      chargedExecutiveId: activityClubChargedExecutiveList.find(
        e => e.club.id === club.id,
      )?.executive.id,
    }));

    const executiveMap = new Map<number, { id: number; name: string }>();
    executives.forEach(e => {
      executiveMap.set(e.executive.id, {
        id: e.executive.id,
        name: e.executive.name,
      });
    });

    logger.debug(`current activities count: ${activitiesOnActivityD.length}`);
    logger.debug(`current activated executives: ${executives.length}`);

    const items: ApiAct023ResponseOk["items"] = clubList.map(club => {
      const pendingActivitiesCount = activitiesOnActivityD.filter(
        e =>
          e.clubId === club.id &&
          e.activityStatusEnumId === ActivityStatusEnum.Applied,
      ).length;
      const approvedActivitiesCount = activitiesOnActivityD.filter(
        e =>
          e.clubId === club.id &&
          e.activityStatusEnumId === ActivityStatusEnum.Approved,
      ).length;
      const rejectedActivitiesCount = activitiesOnActivityD.filter(
        e =>
          e.clubId === club.id &&
          e.activityStatusEnumId === ActivityStatusEnum.Rejected,
      ).length;
      const chargedExecutive = clubChargedExecutiveMap.has(club.id)
        ? executiveMap.get(clubChargedExecutiveMap.get(club.id))
        : undefined;
      return {
        clubId: club.id,
        clubTypeEnum: club.clubTypeEnum,
        divisionName: club.division.name,
        clubNameKr: club.nameKr,
        clubNameEn: club.nameEn,
        pendingActivitiesCount,
        approvedActivitiesCount,
        rejectedActivitiesCount,
        advisor: club.professor?.name,
        chargedExecutive,
      };
    });
    // console.log(items);
    const clubMap = new Map(clubs.map(club => [club.id, club]));
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

            const clubInfo = clubMap.get(clubId);

            return {
              clubId,
              clubTypeEnum: clubInfo.clubTypeEnum,
              divisionName: clubInfo.division.name,
              clubNameKr: clubInfo.nameKr,
              clubNameEn: clubInfo.nameEn,
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

    // 쿼리와 페이지네이션 적용

    const clubNameFilteredItems = !query.clubName
      ? items
      : items.filter(
          item =>
            item.clubNameKr
              .normalize("NFC")
              .includes(query.clubName.normalize("NFC")) ||
            item.clubNameEn
              .normalize("NFC")
              .includes(query.clubName.normalize("NFC")),
        );

    const executiveNameFilteredItems = !query.executiveName
      ? clubNameFilteredItems
      : clubNameFilteredItems.filter(item =>
          item.chargedExecutive?.name
            .normalize("NFC")
            .includes(query.executiveName.normalize("NFC")),
        );
    const total = executiveNameFilteredItems.length;
    const executiveNameFilteredExecutiveProgresses = !query.executiveName
      ? executiveProgresses
      : executiveProgresses.filter(e =>
          e.executiveName
            .normalize("NFC")
            .includes(query.executiveName.normalize("NFC")),
        );

    const pageStart = (query.pageOffset - 1) * query.itemCount;
    const pageEnd = pageStart + query.itemCount;
    const paginatedItems = executiveNameFilteredItems.slice(pageStart, pageEnd);

    // console.log(`Activities: ${JSON.stringify(activitiesOnActivityD)}`);
    // console.log(`ActivityDId: ${activityDId}`);
    // const semester = await this.semesterPublicService.load({
    //   date,
    // });
    // console.log(`SemesterId: ${semester.id}`);
    // console.log(`Date: ${date}`);
    return {
      items: paginatedItems,
      executiveProgresses: executiveNameFilteredExecutiveProgresses,
      total,
      offset: query.pageOffset,
    };
  }

  async getExecutiveActivitiesClubChargeAvailableExecutives(
    query: ApiAct027RequestQuery,
  ): Promise<ApiAct027ResponseOk> {
    const semesterId = await this.semesterPublicService.loadId();
    const { clubIds } = query;

    // TODO: 지금은 entity로 불러오는데, id만 들고 오는 public service 및 repository 를 만들어서 한다면 좀더 효율이 높아질 수 있음
    const [clubMembers, executives] = await Promise.all([
      this.clubPublicService.getUnionMemberSummaries(semesterId, clubIds),
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
        `Student ${studentId} is not the delegate of ClubOld ${clubId}`,
        HttpStatus.FORBIDDEN,
      );
    }

    const activityDId = await this.activityDurationPublicService.loadId();
    const activities = await this.activityRepository.fetchAvailableSummaries(
      clubId,
      activityDId,
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

  async getStudentActivitiesActivityTerms(
    query: ApiAct009RequestQuery,
    //studentId: number,
  ): Promise<ApiAct009ResponseOk> {
    // 요청한 학생이 동아리의 대표자인지 확인합니다.
    //await this.clubPublicService.checkStudentDelegate(studentId, query.clubId);
    // 해당 동아리가 등록되었던 학기 정보를 가져오고, startTerm과 endTerm에 대응되는 활동기간을 조회합니다.
    const semesterIds = await this.clubPublicService.searchSemesterIdsByClubId(
      query.clubId,
    );
    const activityDurations = await this.activityDurationPublicService.search({
      semesterId: semesterIds,
    });

    const terms = await Promise.all(
      activityDurations.map(async e => ({
        term: e,
        numActivity: await this.activityNewRepository.count({
          activityDId: e.id,
          clubId: query.clubId,
        }),
      })),
    );

    return {
      terms: terms
        .filter(e => e.numActivity > 0)
        .map(e => ({
          name: e.term.name,
          id: e.term.id,
          startTerm: e.term.startTerm,
          endTerm: e.term.endTerm,
          year: e.term.year,
        })),
    };
  }
}
