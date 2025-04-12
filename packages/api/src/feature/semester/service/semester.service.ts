import { Injectable } from "@nestjs/common";

import type {
  ApiSem001RequestQuery,
  ApiSem001ResponseOK,
} from "@sparcs-clubs/interface/api/semester/apiSem001";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";

import { SemesterRepository } from "../repository/semester.repository";

@Injectable()
export class SemesterService {
  constructor(private readonly semesterRepository: SemesterRepository) {}

  /**
   * @description getPublicSemesters의 서비스 진입점입니다.
   * @param query
   * @returns
   */
  async getPublicSemesters(param: {
    query: ApiSem001RequestQuery;
  }): Promise<ApiSem001ResponseOK> {
    const { pageOffset, itemCount } = param.query;
    const today = new Date();
    const semesters = await this.semesterRepository.find({
      date: today,
      pagination: {
        offset: pageOffset,
        itemCount,
      },
      orderBy: {
        endTerm: OrderByTypeEnum.DESC,
      },
    });

    const total = await this.semesterRepository.find({});
    const totalCount = total.length;

    return {
      semesters,
      total: totalCount,
      offset: param.query.pageOffset,
    };
  }
}
