import { Injectable } from "@nestjs/common";

import type {
  ApiSem001RequestQuery,
  ApiSem001ResponseOK,
} from "@sparcs-clubs/interface/api/semester/apiSem001";

import SemesterRepository from "../repository/semester.repository";

@Injectable()
export default class SemesterService {
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

    const { semesters, total } =
      await this.semesterRepository.selectSemesterByOffsetAndItemCount({
        offset: pageOffset,
        itemCount,
      });

    return {
      semesters: semesters.map(semester => ({
        id: semester.id,
        year: semester.year,
        name: semester.name,
        startTerm: semester.startTerm,
        endTerm: semester.endTerm,
      })),
      total,
      offset: param.query.pageOffset,
    };
  }
}
