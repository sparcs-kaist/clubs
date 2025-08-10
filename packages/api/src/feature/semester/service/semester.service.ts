import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

import type { ApiAct018ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct018";
import type {
  ApiSem001RequestQuery,
  ApiSem001ResponseOK,
  ApiSem002RequestBody,
  ApiSem002ResponseCreated,
  ApiSem003RequestBody,
  ApiSem003RequestQuery,
  ApiSem003ResponseOk,
  ApiSem004RequestQuery,
  ApiSem004ResponseOk,
  ApiSem005ResponseOK,
} from "@clubs/interface/api/semester/index";
import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import { MActivityDuration } from "../model/activity.duration.model";
import { MSemester } from "../model/semester.model";
import { ActivityDeadlineRepository } from "../repository/activity.deadline.repository";
import { ActivityDurationRepository } from "../repository/activity.duration.repository";
import { SemesterRepository } from "../repository/semester.repository";
import { SemesterSQLRepository } from "../repository/semester.sql.repository";

@Injectable()
export class SemesterService {
  constructor(
    private readonly semesterRepository: SemesterRepository,
    private readonly semesterSQLRepository: SemesterSQLRepository,
    private readonly activityDurationRepository: ActivityDurationRepository,
    private readonly activityDeadlineRepository: ActivityDeadlineRepository,
  ) {}

  /**
   * @description getPublicSemesters의 서비스 진입점입니다.
   * @param query
   * @returns
   */
  async getPublicSemesters(param: {
    query: ApiSem001RequestQuery;
  }): Promise<ApiSem001ResponseOK> {
    const { pageOffset, itemCount } = param.query;
    const semesters = await this.semesterRepository.find({
      pagination: {
        offset: pageOffset,
        itemCount,
      },
      orderBy: {
        endTerm: OrderByTypeEnum.DESC,
      },
    });

    const total = await this.semesterRepository.count({});

    return {
      semesters,
      total,
      offset: param.query.pageOffset,
    };
  }

  /**
   * @description getPublicSemestersNow의 서비스 진입점입니다.
   * @param query
   * @returns
   */
  async getPublicSemesterNow(): Promise<ApiSem005ResponseOK> {
    const semester = await this.semesterRepository
      .find({
        date: new Date(),
        pagination: {
          offset: 1,
          itemCount: 1,
        },
        orderBy: {
          endTerm: OrderByTypeEnum.DESC,
        },
      })
      .then(takeOnlyOne());

    return {
      semester,
    };
  }

  /**
   * @description getActivitiesDeadline의 서비스 진입점입니다.
   * @returns 오늘의 활동보고서 작성기간을 리턴합니다.
   */
  async getPublicActivitiesDeadline(): Promise<ApiAct018ResponseOk> {
    const now = new Date();
    const semester = await this.semesterRepository
      .find({
        date: now,
      })
      .then(takeOnlyOne(MSemester));
    const term = await this.activityDurationRepository
      .find({
        semesterId: semester.id,
        activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
      })
      .then(takeOnlyOne(MActivityDuration));
    const thisSemesterDeadlines = await this.activityDeadlineRepository.find({
      semesterId: semester.id,
    });
    const todayDeadline = thisSemesterDeadlines.find(
      e => e.startTerm <= now && now < e.endTerm,
    );

    return {
      isWritable: todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Writing,
      isEditable:
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Writing ||
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Modification,
      canApprove:
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Writing ||
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Modification ||
        todayDeadline?.deadlineEnum === ActivityDeadlineEnum.Late,
      targetTerm: {
        id: term.id,
        name: term.name,
        startTerm: term.startTerm,
        endTerm: term.endTerm,
        year: term.year,
      },
      deadline: todayDeadline
        ? {
            activityDeadlineEnum: todayDeadline.deadlineEnum,
            duration: {
              startTerm: todayDeadline.startTerm,
              endTerm: todayDeadline.endTerm,
            },
          }
        : undefined,
    };
  }

  /**
   * @description createSemester의 서비스 진입점입니다.
   * @returns 생성한 학기의 id를 리턴합니다. 만약 잘못된 요청이라면 400 예외를 발생시킵니다.
   */
  async createSemester(param: {
    body: ApiSem002RequestBody;
  }): Promise<ApiSem002ResponseCreated> {
    // 1. 겹치는 (년도, 이름) 쌍이 있는지 확인합니다.
    const existingSemester =
      await this.semesterSQLRepository.findSemesterByNameAndYear({
        name: param.body.name,
        year: param.body.year,
      });

    if (existingSemester.id !== undefined) {
      throw new HttpException(
        `A semester with the name "${param.body.name}" and year "${param.body.year}" already exists.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. 시작일이 종료일보다 이전인지 확인합니다.
    if (param.body.startTerm >= param.body.endTerm) {
      throw new HttpException(
        `The start term "${param.body.startTerm}" must be before the end term "${param.body.endTerm}".`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. 해당 기간과 겹치는 학기가 있는지 확인합니다.
    const overlappingSemestersStart = await this.semesterRepository.find({
      date: param.body.startTerm,
    });
    const overlappingSemestersEnd = await this.semesterRepository.find({
      date: param.body.endTerm,
    });
    if (
      overlappingSemestersStart.length > 0 ||
      overlappingSemestersEnd.length > 0
    ) {
      throw new HttpException(
        `There are overlapping semesters for the period ${param.body.startTerm} to ${param.body.endTerm}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. 학기를 생성합니다.
    const semester = await this.semesterSQLRepository.insertSemester({
      year: param.body.year,
      name: param.body.name,
      startTerm: param.body.startTerm,
      endTerm: param.body.endTerm,
    });

    return {
      id: semester.id,
    };
  }

  /**
   * @description updateSemester의 서비스 진입점입니다.
   * @returns 수정한 학기의 id를 리턴합니다. 만약 잘못된 요청이라면 400 예외를 발생시킵니다.
   */
  async updateSemester(param: {
    query: ApiSem003RequestQuery;
    body: ApiSem003RequestBody;
  }): Promise<ApiSem003ResponseOk> {
    // 1. 수정하려는 학기가 존재하는지 확인합니다.
    const existingSemester =
      await this.semesterSQLRepository.findSemesterByNameAndYear({
        name: param.query.name,
        year: param.query.year,
      });

    if (existingSemester.id === undefined) {
      throw new HttpException(
        `A semester with the name "${param.query.name}" and year "${param.query.year}" does not exist.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. 시작일이 종료일보다 이전인지 확인합니다.
    if (param.body.startTerm >= param.body.endTerm) {
      throw new HttpException(
        `The start term "${param.body.startTerm}" must be before the end term "${param.body.endTerm}".`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. 해당 기간과 겹치는 다른 학기가 있는지 확인합니다. (현재 수정하는 학기는 제외)
    const overlappingSemestersStart = await this.semesterRepository.find({
      date: param.body.startTerm,
    });
    const overlappingSemestersEnd = await this.semesterRepository.find({
      date: param.body.endTerm,
    });

    const hasOverlap =
      overlappingSemestersStart.some(s => s.id !== existingSemester.id) ||
      overlappingSemestersEnd.some(s => s.id !== existingSemester.id);

    if (hasOverlap) {
      throw new HttpException(
        `There are overlapping semesters for the period ${param.body.startTerm} to ${param.body.endTerm}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. 학기를 수정합니다.
    const semester = await this.semesterSQLRepository.updateSemester(
      {
        name: param.query.name,
        year: param.query.year,
      },
      {
        startTerm: param.body.startTerm,
        endTerm: param.body.endTerm,
      },
    );

    return {
      id: semester.id,
    };
  }

  /**
   * @description deleteSemester의 서비스 진입점입니다.
   * @returns 삭제한 학기의 id를 리턴합니다. 만약 잘못된 요청이라면 400 예외를 발생시킵니다.
   */
  async deleteSemester(param: {
    query: ApiSem004RequestQuery;
  }): Promise<ApiSem004ResponseOk> {
    // 1. 삭제하려는 학기가 존재하는지 확인합니다.
    const existingSemester =
      await this.semesterSQLRepository.findSemesterByNameAndYear({
        name: param.query.name,
        year: param.query.year,
      });

    if (existingSemester.id === undefined) {
      throw new HttpException(
        `A semester with the name "${param.query.name}" and year "${param.query.year}" does not exist.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. 학기를 소프트 삭제합니다.
    const semester = await this.semesterSQLRepository.softDeleteSemester({
      name: param.query.name,
      year: param.query.year,
    });

    return {
      id: semester.id,
    };
  }
}
