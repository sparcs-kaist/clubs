import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { ClubT as ClubSemester } from "@sparcs-clubs/api/drizzle/schema/club.schema";
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

type ClubSemesterTable = typeof ClubSemester;
type ClubSemesterDbSelect = InferSelectModel<ClubSemesterTable>;
type ClubSemesterDbUpdate = Partial<ClubSemesterDbSelect>;
type ClubSemesterDbInsert = InferInsertModel<ClubSemesterTable>;

type ClubSemesterFieldMapKeys = BaseTableFieldMapKeys<
  ClubSemesterQuery,
  ClubSemesterOrderByKeys,
  ClubSemesterQuerySupport
>;

@Injectable()
export class ClubSemesterRepository extends BaseSingleTableRepository<
  MClubSemester,
  IClubSemesterCreate,
  ClubSemesterTable,
  ClubSemesterQuery,
  ClubSemesterOrderByKeys,
  ClubSemesterQuerySupport
> {
  constructor() {
    super(ClubSemester, MClubSemester);
  }

  protected dbToModelMapping(result: ClubSemesterDbSelect): MClubSemester {
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

  protected modelToDBMapping(model: MClubSemester): ClubSemesterDbUpdate {
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

  protected createToDBMapping(
    model: IClubSemesterCreate,
  ): ClubSemesterDbInsert {
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
  ): TableWithID | null | undefined {
    const fieldMappings: Record<ClubSemesterFieldMapKeys, TableWithID | null> =
      {
        id: ClubSemester,
        clubId: ClubSemester,
        semesterId: ClubSemester,
        clubTypeEnum: ClubSemester,
        professorId: ClubSemester,
      };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
