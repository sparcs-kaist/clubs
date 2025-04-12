import { Injectable } from "@nestjs/common";

import type {
  ApiSem001RequestQuery,
  ApiSem001ResponseOK,
} from "@sparcs-clubs/interface/api/semester/apiSem001";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";
import { ActivityDurationRepository } from "@sparcs-clubs/api/feature/semester/repository/activity.duration.repository";

import { MSemester } from "../model/semester.model";
import { SemesterRepository } from "../repository/semester.repository";

@Injectable()
export class SemesterService {
  constructor(
    private readonly semesterRepository: SemesterRepository,
    private readonly activityDurationRepository: ActivityDurationRepository,
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
    const today = new Date("2028-02-20");
    const semesters = await this.semesterRepository
      .find({
        date: today,
        pagination: {
          offset: pageOffset,
          itemCount,
        },
        orderBy: {
          endTerm: OrderByTypeEnum.DESC,
        },
      })
      .then(takeOnlyOne(MSemester));

    const total = await this.semesterRepository.find({});
    const totalCount = total.length;

    return {
      semesters: [semesters],
      total: totalCount,
      offset: param.query.pageOffset,
    };
  }
}
