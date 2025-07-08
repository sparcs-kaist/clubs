import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { IActivityDuration } from "@clubs/domain/semester/activity-duration";

import { IFileSummary } from "@clubs/interface/api/file/type/file.type";
import {
  ApiFnd001RequestBody,
  ApiFnd001ResponseCreated,
} from "@clubs/interface/api/funding/endpoint/apiFnd001";
import {
  ApiFnd002RequestParam,
  ApiFnd002ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd002";
import {
  ApiFnd003RequestBody,
  ApiFnd003RequestParam,
  ApiFnd003ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd003";
import {
  ApiFnd004RequestParam,
  ApiFnd004ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd004";
import {
  ApiFnd005RequestQuery,
  ApiFnd005ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd005";
import {
  ApiFnd006RequestParam,
  ApiFnd006RequestQuery,
  ApiFnd006ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd006";
import { ApiFnd007ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd007";
import { ApiFnd008ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd008";
import {
  ApiFnd009RequestParam,
  ApiFnd009ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd009";
import {
  ApiFnd010RequestParam,
  ApiFnd010ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd010";
import { ApiFnd012ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd012";
import { ApiFnd013ResponseCreated } from "@clubs/interface/api/funding/endpoint/apiFnd013";
import {
  ApiFnd014RequestBody,
  ApiFnd014ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd014";
import {
  ApiFnd015RequestBody,
  ApiFnd015ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd015";
import {
  ApiFnd016RequestQuery,
  ApiFnd016ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd016";
import { IFundingComment } from "@clubs/interface/api/funding/type/funding.comment.type";
import {
  IFunding,
  IFundingResponse,
} from "@clubs/interface/api/funding/type/funding.type";
import { IExecutive, IStudent } from "@clubs/interface/api/user/type/user.type";
import {
  FundingDeadlineEnum,
  FundingStatusEnum,
} from "@clubs/interface/common/enum/funding.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import {
  takeExist,
  takeOne,
  takeOnlyOne,
} from "@sparcs-clubs/api/common/util/util";
import { TransactionManagerService } from "@sparcs-clubs/api/drizzle/drizzle.transaction-manager";
import ActivityPublicService from "@sparcs-clubs/api/feature/activity/service/activity.public.service";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import FilePublicService from "@sparcs-clubs/api/feature/file/service/file.public.service";
import { ActivityDurationPublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.duration.public.service";
import { FundingDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/funding.deadline.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { MFunding } from "../model/funding.model";
import { FundingCommentRepository } from "../repository/funding.comment.repository";
import FundingRepository from "../repository/funding.repository";

@Injectable()
export default class FundingService {
  constructor(
    private readonly fundingRepository: FundingRepository,
    private readonly fundingCommentRepository: FundingCommentRepository,
    private readonly filePublicService: FilePublicService,
    private readonly userPublicService: UserPublicService,
    private readonly clubPublicService: ClubPublicService,
    private readonly activityPublicService: ActivityPublicService,
    private readonly semesterPublicService: SemesterPublicService,
    private readonly activityDurationPublicService: ActivityDurationPublicService,
    private readonly fundingDeadlinePublicService: FundingDeadlinePublicService,
    private readonly txManager: TransactionManagerService,
  ) {}

  async postStudentFunding(
    body: ApiFnd001RequestBody,
    studentId: number,
  ): Promise<ApiFnd001ResponseCreated> {
    await this.clubPublicService.checkStudentDelegate(studentId, body.club.id);
    await this.checkDeadline([
      FundingDeadlineEnum.Writing,
      FundingDeadlineEnum.Exception,
    ]);

    const activityD = await this.validateExpenditureDate(body.expenditureDate);

    const fundingStatusEnum = 1;
    const approvedAmount = 0;

    return this.fundingRepository.insert(body, {
      activityD,
      fundingStatusEnum,
      approvedAmount,
    });
  }

  async getStudentFunding(
    param: ApiFnd002RequestParam,
    studentId: number,
  ): Promise<ApiFnd002ResponseOk> {
    const user = await this.userPublicService.getStudentById({ id: studentId });
    if (!user) {
      throw new HttpException("Student not found", HttpStatus.NOT_FOUND);
    }

    const funding = (await this.fundingRepository.fetch(
      param.id,
    )) as IFundingResponse;

    funding.tradeEvidenceFiles = await this.filePublicService.getFilesByIds(
      funding.tradeEvidenceFiles.flatMap(file => file.id),
    );
    funding.tradeDetailFiles = await this.filePublicService.getFilesByIds(
      funding.tradeDetailFiles.flatMap(file => file.id),
    );

    if (funding.purposeActivity) {
      funding.purposeActivity = await this.activityPublicService.fetchSummary(
        funding.purposeActivity.id,
      );
    }

    if (funding.clubSupplies?.imageFiles) {
      funding.clubSupplies.imageFiles =
        await this.filePublicService.getFilesByIds(
          funding.clubSupplies.imageFiles.flatMap(file => file.id),
        );
    }

    if (funding.clubSupplies?.softwareEvidenceFiles) {
      funding.clubSupplies.softwareEvidenceFiles =
        await this.filePublicService.getFilesByIds(
          funding.clubSupplies.softwareEvidenceFiles.flatMap(file => file.id),
        );
    }

    if (funding.fixture?.imageFiles) {
      funding.fixture.imageFiles = await this.filePublicService.getFilesByIds(
        funding.fixture.imageFiles.flatMap(file => file.id),
      );
    }

    if (funding.fixture?.softwareEvidenceFiles) {
      funding.fixture.softwareEvidenceFiles =
        await this.filePublicService.getFilesByIds(
          funding.fixture.softwareEvidenceFiles.flatMap(file => file.id),
        );
    }

    if (funding.foodExpense) {
      funding.foodExpense.files = await this.filePublicService.getFilesByIds(
        funding.foodExpense.files.flatMap(file => file.id),
      );
    }

    if (funding.laborContract) {
      funding.laborContract.files = await this.filePublicService.getFilesByIds(
        funding.laborContract.files.flatMap(file => file.id),
      );
    }

    if (funding.externalEventParticipationFee) {
      funding.externalEventParticipationFee.files =
        await this.filePublicService.getFilesByIds(
          funding.externalEventParticipationFee.files.flatMap(file => file.id),
        );
    }

    if (funding.publication) {
      funding.publication.files = await this.filePublicService.getFilesByIds(
        funding.publication.files.flatMap(file => file.id),
      );
    }

    if (funding.profitMakingActivity) {
      funding.profitMakingActivity.files =
        await this.filePublicService.getFilesByIds(
          funding.profitMakingActivity.files.flatMap(file => file.id),
        );
    }

    if (funding.jointExpense) {
      funding.jointExpense.files = await this.filePublicService.getFilesByIds(
        funding.jointExpense.files.flatMap(file => file.id),
      );
    }

    if (funding.etcExpense) {
      funding.etcExpense.files = await this.filePublicService.getFilesByIds(
        funding.etcExpense.files.flatMap(file => file.id),
      );
    }

    if (funding.transportation?.passengers) {
      funding.transportation.passengers =
        await this.userPublicService.fetchStudentSummaries(
          funding.transportation.passengers.flatMap(passenger => passenger.id),
        );

      funding.transportation.passengers = funding.transportation.passengers.map(
        passenger => ({
          id: passenger.id,
          name: passenger.name,
          studentNumber: passenger.studentNumber,
        }),
      );
    }

    const comments = await this.fundingCommentRepository.find({
      fundingId: funding.id,
    });

    const commentedExecutive =
      await this.userPublicService.fetchExecutiveSummaries(
        comments.map(comment => comment.executive.id),
      );

    const updatedComments = comments.map(comment => ({
      ...comment,
      executive: commentedExecutive.find(
        executive => executive.id === comment.executive.id,
      ) || {
        id: 0,
        name: "알 수 없는 집행부원",
        studentNumber: "0000000",
      },
    }));

    return { funding, comments: updatedComments };
  }

  // gb: 위의 getStudentFunding이 옛날에 짠거, 함수화를 시켜서 아래 getExecutiveFunding에서 쓰는 것으로 변경한 버전
  // 만약 문제 생기면 원래꺼 보려고 원래 코드 남기고 아래에 추가
  // TODO: 지원금 기간을 잘 넘기면 위 코드 삭제하고 이름 그냥 getStudentFunding으로 바꾸기
  async getStudentFunding2(
    studentId: IStudent["id"],
    id: IFunding["id"],
  ): Promise<ApiFnd002ResponseOk> {
    const user = await this.userPublicService.getStudentById({ id: studentId });
    if (!user) {
      throw new HttpException("Student not found", HttpStatus.NOT_FOUND);
    }
    const funding = await this.fundingRepository.fetch(id);

    const fundingResponse = await this.buildFundingResponse(funding);
    const comments = await this.fundingCommentRepository.find({
      fundingId: funding.id,
    });
    const executives = await this.userPublicService.fetchExecutiveSummaries(
      comments.map(comment => comment.executive.id),
    );
    const commentsWithExecutives = comments.map(comment => ({
      ...comment,
      executive: executives.find(
        executive => executive.id === comment.executive.id,
      ) || {
        id: 0,
        name: "알 수 없는 집행부원",
        studentNumber: "0000000",
      },
    }));
    return { funding: fundingResponse, comments: commentsWithExecutives };
  }

  private async buildFundingResponse(
    funding: MFunding,
  ): Promise<IFundingResponse> {
    const purposeActivity = funding.purposeActivity
      ? await this.activityPublicService.fetchSummary(
          funding.purposeActivity.id,
        )
      : undefined;

    // 채울 곳
    const resolvedFiles = {
      tradeEvidenceFiles: await this.fetchFiles(funding.tradeEvidenceFiles),
      tradeDetailFiles: await this.fetchFiles(funding.tradeDetailFiles),

      foodExpense: await this.fetchFiles(funding.foodExpense),
      laborContract: await this.fetchFiles(funding.laborContract),
      externalEventParticipationFee: await this.fetchFiles(
        funding.externalEventParticipationFee,
      ),
      publication: await this.fetchFiles(funding.publication),
      profitMakingActivity: await this.fetchFiles(funding.profitMakingActivity),
      jointExpense: await this.fetchFiles(funding.jointExpense),
      etcExpense: await this.fetchFiles(funding.etcExpense),
      nonCorporateTransaction: await this.fetchFiles(
        funding.nonCorporateTransaction,
      ),
      // 구분선

      clubSupplies: funding.clubSupplies
        ? {
            ...funding.clubSupplies,
            imageFiles: await this.fetchFiles(funding.clubSupplies.imageFiles),
            softwareEvidenceFiles: await this.fetchFiles(
              funding.clubSupplies.softwareEvidenceFiles,
            ),
          }
        : undefined,
      fixture: funding.fixture
        ? {
            ...funding.fixture,
            imageFiles: await this.fetchFiles(funding.fixture.imageFiles),
            softwareEvidenceFiles: await this.fetchFiles(
              funding.fixture.softwareEvidenceFiles,
            ),
          }
        : undefined,
    };

    let transportation;
    if (funding.transportation && funding.transportation.passengers) {
      transportation = {
        ...funding.transportation,
        passengers: await this.userPublicService.fetchStudentSummaries(
          funding.transportation.passengers.map(passenger => passenger.id),
        ),
      };
    }

    return {
      ...funding,
      purposeActivity,
      ...resolvedFiles,
      transportation,
    };
  }

  // 메서드 오버로딩 선언부
  private async fetchFiles(items: undefined): Promise<undefined>;
  private async fetchFiles(items: { id: string }[]): Promise<IFileSummary[]>;
  private async fetchFiles<T extends { files: { id: string }[] }>(
    items: T | undefined,
  ): Promise<(Omit<T, "files"> & { files: IFileSummary[] }) | undefined>;

  // 구현부
  private async fetchFiles<T extends { files: { id: string }[] }>(
    items: T | undefined | { id: string }[],
  ): Promise<
    undefined | IFileSummary[] | (Omit<T, "files"> & { files: IFileSummary[] })
  > {
    if (!items) {
      return undefined; // items가 undefined이면 undefined 반환
    }

    if (Array.isArray(items)) {
      // items가 배열인 경우 처리
      const files = await this.filePublicService.getFilesByIds(
        items.map(file => file.id),
      );
      return files; // FileSummary[] 반환
    }

    if ("files" in items) {
      // items에 files 속성이 있는 경우 처리
      const files = await this.filePublicService.getFilesByIds(
        items.files.map(file => file.id),
      );
      return { ...items, files }; // files가 IFileSummary[]로 변환된 객체 반환
    }
    return undefined;
  }

  async putStudentFunding(
    body: ApiFnd003RequestBody,
    param: ApiFnd003RequestParam,
    studentId: number,
  ): Promise<ApiFnd003ResponseOk> {
    await this.clubPublicService.checkStudentDelegate(studentId, body.club.id);
    await this.checkDeadline([
      FundingDeadlineEnum.Writing,
      FundingDeadlineEnum.Modification,
      FundingDeadlineEnum.Exception,
    ]);

    const activityD = await this.validateExpenditureDate(body.expenditureDate);

    const fundingStatusEnum = 1;
    const approvedAmount = 0;

    return this.fundingRepository.put(param.id, body, {
      activityD,
      fundingStatusEnum,
      approvedAmount,
    });
  }

  async deleteStudentFunding(
    studentId: number,
    param: ApiFnd004RequestParam,
  ): Promise<ApiFnd004ResponseOk> {
    const funding = await this.fundingRepository.fetch(param.id);
    await this.clubPublicService.checkStudentDelegate(
      studentId,
      funding.club.id,
    );
    await this.checkDeadline([
      FundingDeadlineEnum.Writing,
      FundingDeadlineEnum.Modification,
      FundingDeadlineEnum.Exception,
    ]);
    await this.fundingRepository.delete(param.id);
    return {};
  }

  async getStudentFundings(
    studentId: number,
    query: ApiFnd005RequestQuery,
  ): Promise<ApiFnd005ResponseOk> {
    const user = await this.userPublicService.getStudentById({ id: studentId });
    if (!user) {
      throw new HttpException("Student not found", HttpStatus.NOT_FOUND);
    }

    const activityD = await this.activityDurationPublicService.load();

    const fundings = await this.fundingRepository.fetchSummaries(
      query.clubId,
      activityD.id,
    );

    const activities = await this.activityPublicService.fetchSummaries(
      fundings.map(funding => funding.purposeActivity.id),
    );

    const clubs = await this.clubPublicService.fetchSummaries(
      fundings.map(funding => funding.club.id),
    );

    return {
      fundings: fundings.map(funding => ({
        id: funding.id,
        fundingStatusEnum: funding.fundingStatusEnum,
        purposeActivity: activities.find(
          activity => activity.id === funding.purposeActivity.id,
        ),
        name: funding.name,
        expenditureAmount: funding.expenditureAmount,
        approvedAmount: funding.approvedAmount,
        club: clubs.find(club => club.id === funding.club.id),
        chargedExecutive: funding.chargedExecutive,
      })),
    };
  }

  async getStudentFundingActivityDuration(
    studentId: number,
    param: ApiFnd006RequestParam,
    query: ApiFnd006RequestQuery,
  ): Promise<ApiFnd006ResponseOk> {
    const user = await this.userPublicService.getStudentById({ id: studentId });
    if (!user) {
      throw new HttpException("Student not found", HttpStatus.NOT_FOUND);
    }

    const fundings = await this.fundingRepository.fetchSummaries(
      query.clubId,
      param.activityDId,
    );

    const activities = await this.activityPublicService.fetchSummaries(
      fundings.map(funding => funding.purposeActivity.id),
    );

    const clubs = await this.clubPublicService.fetchSummaries(
      fundings.map(funding => funding.club.id),
    );

    return {
      fundings: fundings.map(funding => ({
        id: funding.id,
        fundingStatusEnum: funding.fundingStatusEnum,
        purposeActivity: activities.find(
          activity => activity.id === funding.purposeActivity.id,
        ),
        name: funding.name,
        expenditureAmount: funding.expenditureAmount,
        approvedAmount: funding.approvedAmount,
        club: clubs.find(club => club.id === funding.club.id),
        chargedExecutive: funding.chargedExecutive,
      })),
    };
  }

  /**
   * @description 지원금 신청의 작성 기한을 확인합니다.
   * @returns 현재 시점의 지원금 신청 마감 기한과 대상 활동 기간을 리턴합니다.
   */
  async getPublicFundingsDeadline(): Promise<ApiFnd007ResponseOk> {
    const [targetDuration, deadline] = await Promise.all([
      this.activityDurationPublicService.load(),
      this.fundingDeadlinePublicService
        .search({
          date: new Date(),
        })
        .then(takeExist())
        .then(takeOne),
    ]);

    return {
      targetDuration,
      deadline,
    };
  }

  async getExecutiveFundings(
    executiveId: IExecutive["id"],
  ): Promise<ApiFnd008ResponseOk> {
    await this.userPublicService.checkCurrentExecutive(executiveId);

    const semesterId = await this.semesterPublicService.loadId();
    const [activityDId1, activityDId2] = await Promise.all([
      this.activityDurationPublicService.loadId({ semesterId: semesterId - 1 }),
      this.activityDurationPublicService.loadId({ semesterId: semesterId - 2 }),
    ]);

    // TODO: 지난 지원금 신청 기간을 조회하도록 임시 ㅅ수정해 두었으니 복구할 것
    const [fundings1, fundings2] = await Promise.all([
      this.fundingRepository.fetchSummaries(activityDId1),
      this.fundingRepository.fetchSummaries(activityDId2),
    ]);
    const fundings = [...fundings1, ...fundings2];
    // const activityD = await this.activityDurationPublicService.load();
    // const fundings = await this.fundingRepository.fetchSummaries(
    //   activityD.id - 1, // TODO: 지난 지원금 신청 기간을 조회하도록 임시 ㅅ수정해 두었으니 복구할 것
    // );

    const clubs = await this.clubPublicService.fetchSummaries(
      fundings.map(funding => funding.club.id),
    );
    const devisions = await this.clubPublicService.fetchDivisionSummaries(
      clubs.map(club => club.division.id),
    );
    const executives =
      await this.userPublicService.fetchCurrentExecutiveSummaries();

    const clubsWithCounts = clubs.map(club => ({
      ...club,
      division: devisions.find(division => division.id === club.division.id),
      totalCount: fundings.filter(funding => funding.club.id === club.id)
        .length,
      appliedCount: fundings.filter(
        funding =>
          funding.club.id === club.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Applied,
      ).length,
      approvedCount: fundings.filter(
        funding =>
          funding.club.id === club.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Approved,
      ).length,
      partialCount: fundings.filter(
        funding =>
          funding.club.id === club.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Partial,
      ).length,
      rejectedCount: fundings.filter(
        funding =>
          funding.club.id === club.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Rejected,
      ).length,
      committeeCount: fundings.filter(
        funding =>
          funding.club.id === club.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Committee,
      ).length,
      chargedExecutive:
        executives.find(
          executive =>
            executive.id ===
            fundings
              .filter(funding => funding.club.id === club.id)
              .filter(funding => funding.chargedExecutive)
              .reduce(
                (acc, curr) => {
                  const count = fundings.filter(
                    f =>
                      f.club.id === club.id &&
                      f.chargedExecutive?.id === curr.chargedExecutive?.id,
                  ).length;
                  return count > acc.count
                    ? { id: curr.chargedExecutive.id, count }
                    : acc;
                },
                { id: 0, count: 0 },
              ).id,
        ) ?? null,
    }));

    const executivesWithCounts = executives.map(executive => ({
      ...executive,
      totalCount: fundings.filter(
        funding => funding.chargedExecutive.id === executive.id,
      ).length,
      appliedCount: fundings.filter(
        funding =>
          funding.chargedExecutive.id === executive.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Applied,
      ).length,
      approvedCount: fundings.filter(
        funding =>
          funding.chargedExecutive.id === executive.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Approved,
      ).length,
      partialCount: fundings.filter(
        funding =>
          funding.chargedExecutive.id === executive.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Partial,
      ).length,
      rejectedCount: fundings.filter(
        funding =>
          funding.chargedExecutive.id === executive.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Rejected,
      ).length,
      committeeCount: fundings.filter(
        funding =>
          funding.chargedExecutive.id === executive.id &&
          funding.fundingStatusEnum === FundingStatusEnum.Committee,
      ).length,
      chargedClubs: clubs
        .filter(club =>
          fundings.some(
            funding =>
              funding.chargedExecutive?.id === executive.id &&
              funding.club.id === club.id,
          ),
        )
        .map(club => ({
          ...club,
          division: devisions.find(
            division => division.id === club.division.id,
          ),

          totalCount: fundings.filter(
            funding =>
              funding.club.id === club.id &&
              funding.chargedExecutive?.id === executive.id,
          ).length,
          appliedCount: fundings.filter(
            funding =>
              funding.club.id === club.id &&
              funding.chargedExecutive?.id === executive.id &&
              funding.fundingStatusEnum === FundingStatusEnum.Applied,
          ).length,
          approvedCount: fundings.filter(
            funding =>
              funding.club.id === club.id &&
              funding.chargedExecutive?.id === executive.id &&
              funding.fundingStatusEnum === FundingStatusEnum.Approved,
          ).length,
          partialCount: fundings.filter(
            funding =>
              funding.club.id === club.id &&
              funding.chargedExecutive?.id === executive.id &&
              funding.fundingStatusEnum === FundingStatusEnum.Partial,
          ).length,
          rejectedCount: fundings.filter(
            funding =>
              funding.club.id === club.id &&
              funding.chargedExecutive?.id === executive.id &&
              funding.fundingStatusEnum === FundingStatusEnum.Rejected,
          ).length,
          committeeCount: fundings.filter(
            funding =>
              funding.club.id === club.id &&
              funding.chargedExecutive?.id === executive.id &&
              funding.fundingStatusEnum === FundingStatusEnum.Committee,
          ).length,
        })),
    }));

    return {
      totalCount: fundings.length,
      appliedCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Applied,
      ).length,
      approvedCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Approved,
      ).length,
      partialCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Partial,
      ).length,
      rejectedCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Rejected,
      ).length,
      committeeCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Committee,
      ).length,
      clubs: clubsWithCounts,
      executives: executivesWithCounts,
    };
  }

  async getExecutiveFundingsClubBrief(
    executiveId: IExecutive["id"],
    param: ApiFnd009RequestParam,
  ): Promise<ApiFnd009ResponseOk> {
    await this.userPublicService.checkCurrentExecutive(executiveId);
    const semesterId = await this.semesterPublicService.loadId();
    const [activityDId1, activityDId2] = await Promise.all([
      this.activityDurationPublicService.loadId({ semesterId: semesterId - 1 }),
      this.activityDurationPublicService.loadId({ semesterId: semesterId - 2 }),
    ]);

    // TODO: 지난 지원금 신청 기간을 조회하도록 임시 ㅅ수정해 두었으니 복구할 것
    const [fundings1, fundings2] = await Promise.all([
      this.fundingRepository.fetchSummaries(param.clubId, activityDId1),
      this.fundingRepository.fetchSummaries(param.clubId, activityDId2),
    ]);
    const fundings = [...fundings1, ...fundings2];

    const club = await this.clubPublicService.fetchSummary(param.clubId);

    const chargedExecutiveId = fundings
      .filter(funding => funding.club.id === param.clubId)
      .filter(funding => funding.chargedExecutive)
      .reduce(
        (acc, curr) => {
          const count = fundings.filter(
            f =>
              f.club.id === param.clubId &&
              f.chargedExecutive?.id === curr.chargedExecutive?.id,
          ).length;
          return count > acc.count
            ? { id: curr.chargedExecutive.id, count }
            : acc;
        },
        { id: 0, count: 0 },
      ).id;

    const chargedExecutive =
      await this.userPublicService.findExecutiveSummary(chargedExecutiveId);

    const fundingsWithCommentedExecutive = await Promise.all(
      fundings.map(async funding => {
        const comments = await this.fundingCommentRepository.find({
          fundingId: funding.id,
        });
        return {
          ...funding,
          commentedExecutive: comments[0]?.executive,
        };
      }),
    );

    const activities = await this.activityPublicService.fetchSummaries(
      fundingsWithCommentedExecutive.map(
        funding => funding.purposeActivity?.id,
      ),
    );

    const executiveIds = new Set([
      ...fundingsWithCommentedExecutive.map(
        funding => funding.chargedExecutive?.id,
      ),
      ...fundingsWithCommentedExecutive.map(
        funding => funding.commentedExecutive?.id,
      ),
    ]);

    const executives = await this.userPublicService.fetchExecutiveSummaries(
      Array.from(executiveIds),
    );

    const clubs = await this.clubPublicService.fetchSummaries(
      fundings.map(funding => funding.club.id),
    );

    return {
      club,
      totalCount: fundings.filter(funding => funding.club.id === param.clubId)
        .length,
      appliedCount: fundings.filter(
        funding =>
          funding.club.id === param.clubId &&
          funding.fundingStatusEnum === FundingStatusEnum.Applied,
      ).length,
      approvedCount: fundings.filter(
        funding =>
          funding.club.id === param.clubId &&
          funding.fundingStatusEnum === FundingStatusEnum.Approved,
      ).length,
      partialCount: fundings.filter(
        funding =>
          funding.club.id === param.clubId &&
          funding.fundingStatusEnum === FundingStatusEnum.Partial,
      ).length,
      rejectedCount: fundings.filter(
        funding =>
          funding.club.id === param.clubId &&
          funding.fundingStatusEnum === FundingStatusEnum.Rejected,
      ).length,
      committeeCount: fundings.filter(
        funding =>
          funding.club.id === param.clubId &&
          funding.fundingStatusEnum === FundingStatusEnum.Committee,
      ).length,
      chargedExecutive,
      fundings: fundingsWithCommentedExecutive.map(funding => ({
        ...funding,
        club: clubs.find(c => c.id === funding.club.id),
        purposeActivity: activities.find(
          activity => activity.id === funding.purposeActivity?.id,
        ),
        chargedExecutive:
          executives.find(
            executive => executive.id === funding.chargedExecutive?.id,
          ) ?? null,
        commentedExecutive:
          executives.find(
            executive => executive.id === funding.commentedExecutive?.id,
          ) ?? null,
      })),
    };
  }

  async getExecutiveFundingsExecutiveBrief(
    executiveId: IExecutive["id"],
    param: ApiFnd010RequestParam,
  ): Promise<ApiFnd010ResponseOk> {
    await this.userPublicService.checkCurrentExecutive(executiveId);

    const fundings = await this.fundingRepository.fetchCommentedSummaries(
      param.executiveId,
    );

    const fundingsWithCommentedExecutive = await Promise.all(
      fundings.map(async funding => {
        const comments = await this.fundingCommentRepository.find({
          fundingId: funding.id,
        });
        return {
          ...funding,
          commentedExecutive: comments[0]?.executive,
        };
      }),
    );

    const activities = await this.activityPublicService.fetchSummaries(
      fundingsWithCommentedExecutive.map(
        funding => funding.purposeActivity?.id,
      ),
    );

    const executiveIds = new Set([
      ...fundingsWithCommentedExecutive.map(
        funding => funding.chargedExecutive?.id,
      ),
      ...fundingsWithCommentedExecutive.map(
        funding => funding.commentedExecutive?.id,
      ),
    ]);
    const executives = await this.userPublicService.fetchExecutiveSummaries(
      Array.from(executiveIds),
    );

    const clubs = await this.clubPublicService.fetchSummaries(
      fundings.map(funding => funding.club.id),
    );

    const chargedExecutive = await this.userPublicService.findExecutiveSummary(
      param.executiveId,
    );

    return {
      chargedExecutive,
      totalCount: fundings.length,
      appliedCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Applied,
      ).length,
      approvedCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Approved,
      ).length,
      partialCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Partial,
      ).length,
      rejectedCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Rejected,
      ).length,
      committeeCount: fundings.filter(
        funding => funding.fundingStatusEnum === FundingStatusEnum.Committee,
      ).length,
      fundings: fundingsWithCommentedExecutive.map(funding => ({
        ...funding,
        club: clubs.find(club => club.id === funding.club.id),
        purposeActivity: activities.find(
          activity => activity.id === funding.purposeActivity?.id,
        ),
        chargedExecutive:
          executives.find(
            executive => executive.id === funding.chargedExecutive?.id,
          ) ?? null,
        commentedExecutive:
          executives.find(
            executive => executive.id === funding.commentedExecutive?.id,
          ) ?? null,
      })),
    };
  }

  /**
   * @description 집행부원이 검토를 위해 지원금 신청을 조회합니다.
   * @returns 집행부원 검토를 위한 지원금 신청 정보를 리턴합니다.
   * 들어온 executive Id가 현재 집행부원인지 확인합니다.
   */
  async getExecutiveFunding(
    executiveId: IExecutive["id"],
    id: IFunding["id"],
  ): Promise<ApiFnd012ResponseOk> {
    await this.userPublicService.checkCurrentExecutive(executiveId);

    const funding = await this.fundingRepository.fetch(id);

    const fundingResponse = await this.buildFundingResponse(funding);
    const comments = await this.fundingCommentRepository.find({
      fundingId: funding.id,
    });
    const executives = await this.userPublicService.fetchExecutiveSummaries(
      comments.map(comment => comment.executive.id),
    );
    const commentsWithExecutives = comments.map(comment => ({
      ...comment,
      executive: executives.find(
        executive => executive.id === comment.executive.id,
      ) || {
        id: 0,
        name: "알 수 없는 집행부원",
        studentNumber: "알 수 없는 학번",
      },
    }));
    return { funding: fundingResponse, comments: commentsWithExecutives };
  }

  /**
   * @description 집행부원으로서 지원금 신청에 comment를 남깁니다.
   * @returns
   */
  async postExecutiveFundingComment(
    executiveId: IExecutive["id"],
    id: IFunding["id"],
    fundingStatusEnum: IFundingComment["fundingStatusEnum"],
    approvedAmount: IFundingComment["approvedAmount"],
    content: IFundingComment["content"],
  ): Promise<ApiFnd013ResponseCreated> {
    if (approvedAmount < 0) {
      throw new HttpException(
        "승인 금액은 0 이상이어야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (fundingStatusEnum === FundingStatusEnum.Applied) {
      throw new HttpException(
        "대기 상태로는 바꿀 수 없습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      fundingStatusEnum === FundingStatusEnum.Rejected &&
      approvedAmount !== 0
    ) {
      throw new HttpException(
        "반려 상태에서는 승인 금액을 0으로 설정해야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }
    const { expenditureAmount } = await this.fundingRepository.fetch(id);
    if (approvedAmount > expenditureAmount) {
      throw new HttpException(
        "승인 금액이 지출 금액보다 많을 수 없습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      fundingStatusEnum === FundingStatusEnum.Approved &&
      expenditureAmount !== approvedAmount
    ) {
      throw new HttpException(
        "승인을 위해선 전체 금액의 전부가 승인되어야 합니다. 부분 승인을 이용해 주세요.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      fundingStatusEnum === FundingStatusEnum.Partial &&
      (approvedAmount === 0 || approvedAmount === expenditureAmount)
    ) {
      throw new HttpException(
        "승인 상태에서는 승인 금액이 0이 될 수 없습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const fundingComment = await this.txManager.runInTransaction(async tx => {
      const comment = await this.fundingCommentRepository
        .create(
          {
            fundingStatusEnum,
            approvedAmount,
            funding: { id },
            executive: { id: executiveId },
            content,
          },
          tx,
        )
        .then(takeOnlyOne());
      const funding = await this.fundingRepository.patchStatusTx(tx, {
        id,
        fundingStatusEnum,
        approvedAmount,
        commentedAt: new Date(),
      });

      // funding 이랑 comment 의 값들이 다르면 에러
      if (!comment.isFinalComment(funding)) {
        throw new HttpException(
          "Funding and Comment Has Different Value",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return comment;
    });

    return fundingComment;
  }

  async patchExecutiveFundingsChargedExecutive(
    executiveId: IExecutive["id"],
    body: ApiFnd014RequestBody,
  ): Promise<ApiFnd014ResponseOk> {
    await this.userPublicService.checkCurrentExecutive(executiveId);
    await this.userPublicService.checkCurrentExecutive(body.executiveId);

    const fundings = await this.fundingRepository.fetchSummaries(
      body.fundingIds,
    );
    this.fundingRepository.withTransaction(async tx => {
      // eslint-disable-next-line no-restricted-syntax
      for (const funding of fundings) {
        this.fundingRepository.patchSummaryTx(tx, funding, f => ({
          id: f.id,
          chargedExecutiveId: body.executiveId,
        }));
      }
    });

    return {};
  }

  async patchExecutiveFundingsClubsChargedExecutive(
    executiveId: IExecutive["id"],
    body: ApiFnd015RequestBody,
  ): Promise<ApiFnd015ResponseOk> {
    await this.userPublicService.checkCurrentExecutive(executiveId);
    await this.userPublicService.checkCurrentExecutive(body.executiveId);

    const activityDId = await this.activityDurationPublicService.loadId();

    const fundings = await this.fundingRepository.fetchSummaries(
      body.clubIds,
      activityDId,
    );
    logger.info(fundings);
    this.fundingRepository.withTransaction(async tx => {
      // eslint-disable-next-line no-restricted-syntax
      for (const funding of fundings) {
        this.fundingRepository.patchSummaryTx(tx, funding, f => ({
          id: f.id,
          chargedExecutiveId: body.executiveId,
        }));
      }
    });

    return {};
  }

  async getExecutiveFundingsClubExecutives(
    executiveId: IExecutive["id"],
    query: ApiFnd016RequestQuery,
  ): Promise<ApiFnd016ResponseOk> {
    await this.userPublicService.checkCurrentExecutive(executiveId);

    const semester = await this.semesterPublicService.load();
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

  private async checkDeadline(enums: Array<FundingDeadlineEnum>) {
    await this.fundingDeadlinePublicService
      .search({
        date: new Date(),
        deadlineEnum: enums,
      })
      .then(takeExist());
  }

  /**
   * @description 지출 날짜가 현재 activityD 의 기간 내에 있는지 확인합니다.
   * @returns 현재 activityD 의 id를 리턴합니다.
   */
  private async validateExpenditureDate(
    expenditureDate: Date,
  ): Promise<IActivityDuration> {
    const activityD = await this.activityDurationPublicService.load();
    if (
      expenditureDate < activityD.startTerm ||
      expenditureDate > activityD.endTerm
    ) {
      throw new HttpException(
        "Expenditure date is not in the range of activity deadline",
        HttpStatus.BAD_REQUEST,
      );
    }
    return activityD;
  }
}
