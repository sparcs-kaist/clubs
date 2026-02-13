import { Injectable } from "@nestjs/common";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  IClubSemesterCreate,
  MClubSemester,
} from "@sparcs-clubs/api/feature/club/model/club-semester.model";

export type ClubSemesterQuery = {
  // id: number; // id 는 기본 내장
  clubId: number;
  semesterId: number;
  clubTypeEnum: ClubTypeEnum;
  professorId: number;
};

type ClubSemesterOrderByKeys = "id";
type ClubSemesterQuerySupport = {}; // Query Support 용

type ClubSemesterFieldMapKeys = BaseTableFieldMapKeys<
  ClubSemesterQuery,
  ClubSemesterOrderByKeys,
  ClubSemesterQuerySupport
>;

export type ClubSemesterRepositoryFindQuery = BaseRepositoryFindQuery<
  ClubSemesterQuery,
  ClubSemesterOrderByKeys
>;
export type ClubSemesterRepositoryQuery =
  BaseRepositoryQuery<ClubSemesterQuery>;

@Injectable()
export class ClubSemesterRepository extends BaseSingleTableRepository<
  MClubSemester,
  IClubSemesterCreate,
  ClubSemesterQuery,
  ClubSemesterOrderByKeys,
  ClubSemesterQuerySupport
> {
  constructor() {
    super("clubT", MClubSemester);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MClubSemester {
    return new MClubSemester({
      id: result.id,
      club: { id: result.clubId },
      semester: { id: result.semesterId },
      clubTypeEnum: result.clubStatusEnumId,
      characteristicKr: result.characteristicKr,
      characteristicEn: result.characteristicEn,
      professor: { id: result.professorId },
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MClubSemester): any {
    return {
      id: model.id,
      clubId: model.club.id,
      semesterId: model.semester.id,
      clubStatusEnumId: model.clubTypeEnum,
      characteristicKr: model.characteristicKr,
      characteristicEn: model.characteristicEn,
      professorId: model.professor.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IClubSemesterCreate): any {
    return {
      clubId: model.club.id,
      semesterId: model.semester.id,
      clubStatusEnumId: model.clubTypeEnum,
      characteristicKr: model.characteristicKr,
      characteristicEn: model.characteristicEn,
      professorId: model.professor.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: ClubSemesterFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<ClubSemesterFieldMapKeys, string | null> = {
      id: "id",
      clubId: "clubId",
      semesterId: "semesterId",
      clubTypeEnum: "clubStatusEnumId",
      professorId: "professorId",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
