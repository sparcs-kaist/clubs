import { Injectable } from "@nestjs/common";

import { BasePublicService } from "@sparcs-clubs/api/common/base/base.public.service";

import { MSemester, SemesterQuery } from "../model/semester.model";
import { SemesterRepository } from "../repository/semester.repository";

type SemesterSearchQuery = {};

type SemesterLoadQuery = {
  date?: Date;
};

type SemesterIsQuery = {
  id: number;
  date?: Date;
};

@Injectable()
export class SemesterPublicService extends BasePublicService<
  MSemester,
  SemesterQuery,
  SemesterLoadQuery,
  SemesterIsQuery,
  SemesterSearchQuery
> {
  constructor(private readonly semesterRepository: SemesterRepository) {
    super(semesterRepository, MSemester);
  }

  /**
   * @description 해당 Semester이 해당 date를 포함하는 지 여부를 반환합니다.
   * @param id Semester ID
   * @param date? Date, 기본값: 현재 시간
   * @returns 해당 Semester이 해당 date를 포함하는 지 여부
   */
  async is(query: SemesterIsQuery): Promise<boolean> {
    const queryParam = {
      ...query,
      date: query.date ?? new Date(),
    };

    const res = await super.is(queryParam);
    return res;
  }

  /**
   * @description 해당 date가 해당 Semester 인지 검증합니다.
   * @param id Semester ID
   * @param date? Date, 기본값: 현재 시간
   * @throws BadRequestException 해당 date가 해당 Semester 가 아닐 경우
   */
  async validate(query: SemesterIsQuery): Promise<void> {
    await super.validate(query);
  }

  /**
   * @description 해당 학기의 활동 마감 기한을 반환합니다.
   * @param date? Date, 기본값: 현재 시간
   * @returns MSemester of the semester
   * @throws NotFoundException 해당 학기가 존재하지 않을 경우 (DB에 안 넣은 것임)
   */
  async load(query: SemesterLoadQuery): Promise<MSemester> {
    const dateParam = query.date ?? new Date();

    const res = await super.load({
      date: dateParam,
    });
    return res;
  }
}
