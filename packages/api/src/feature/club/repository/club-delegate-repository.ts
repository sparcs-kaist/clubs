import { Injectable } from "@nestjs/common";
import {
  and,
  gt,
  InferInsertModel,
  InferSelectModel,
  isNotNull,
  lte,
  not,
  or,
  SQL,
} from "drizzle-orm";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { ClubDelegate } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  IClubDelegateCreate,
  MClubDelegate,
} from "@sparcs-clubs/api/feature/club/model/club-delegate.model";

export type ClubDelegateQuery = {
  // id: number; // id 는 기본 내장
  studentId: number;
  clubId: number;
  clubDelegateEnum: number;
  date: Date;
};

type ClubDelegateOrderByKeys = "id";
type ClubDelegateQuerySupport = { startTerm: Date; endTerm: Date }; // Query Support 용

type ClubDelegateTable = typeof ClubDelegate;
type ClubDelegateDbSelect = InferSelectModel<ClubDelegateTable>;
type ClubDelegateDbUpdate = Partial<ClubDelegateDbSelect>;
type ClubDelegateDbInsert = InferInsertModel<ClubDelegateTable>;

type ClubDelegateFieldMapKeys = BaseTableFieldMapKeys<
  ClubDelegateQuery,
  ClubDelegateOrderByKeys,
  ClubDelegateQuerySupport
>;

@Injectable()
export class ClubDelegateRepository extends BaseSingleTableRepository<
  MClubDelegate,
  IClubDelegateCreate,
  ClubDelegateTable,
  ClubDelegateQuery,
  ClubDelegateOrderByKeys,
  ClubDelegateQuerySupport
> {
  constructor() {
    super(ClubDelegate, MClubDelegate);
  }

  protected dbToModelMapping(result: ClubDelegateDbSelect): MClubDelegate {
    return new MClubDelegate({
      id: result.id,
      student: { id: result.studentId },
      club: { id: result.clubId },
      clubDelegateEnum: result.clubDelegateEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(model: MClubDelegate): ClubDelegateDbUpdate {
    return {
      id: model.id,
      studentId: model.student.id,
      clubId: model.club.id,
      clubDelegateEnum: model.clubDelegateEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected createToDBMapping(
    model: IClubDelegateCreate,
  ): ClubDelegateDbInsert {
    return {
      studentId: model.student.id,
      clubId: model.club.id,
      clubDelegateEnum: model.clubDelegateEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: ClubDelegateFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<ClubDelegateFieldMapKeys, TableWithID | null> =
      {
        id: ClubDelegate,
        studentId: ClubDelegate,
        clubId: ClubDelegate,
        clubDelegateEnum: ClubDelegate,
        startTerm: ClubDelegate,
        endTerm: ClubDelegate,
        date: null,
      };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
  protected processSpecialCondition(
    key: ClubDelegateFieldMapKeys,
    value: PrimitiveConditionValue,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      return not(
        or(
          gt(ClubDelegate.startTerm, value),
          and(
            isNotNull(ClubDelegate.endTerm),
            lte(ClubDelegate.endTerm, value),
          ),
        ),
      );
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
