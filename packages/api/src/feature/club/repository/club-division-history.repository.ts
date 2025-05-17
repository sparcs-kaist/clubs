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
import { ClubDivisionHistory } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  IClubDivisionHistoryCreate,
  MClubDivisionHistory,
} from "@sparcs-clubs/api/feature/club/model/club-division-history.model";

export type ClubDivisionHistoryQuery = {
  // id: number; // id 는 기본 내장

  clubId: number;
  divisionId: number;
  date: Date;
};

type ClubDivisionHistoryOrderByKeys = "id";
type ClubDivisionHistoryQuerySupport = { startTerm: Date; endTerm: Date }; // Query Support 용

type ClubDivisionHistoryTable = typeof ClubDivisionHistory;
type ClubDivisionHistoryDbSelect = InferSelectModel<ClubDivisionHistoryTable>;
type ClubDivisionHistoryDbUpdate = Partial<ClubDivisionHistoryDbSelect>;
type ClubDivisionHistoryDbInsert = InferInsertModel<ClubDivisionHistoryTable>;

type ClubDivisionHistoryFieldMapKeys = BaseTableFieldMapKeys<
  ClubDivisionHistoryQuery,
  ClubDivisionHistoryOrderByKeys,
  ClubDivisionHistoryQuerySupport
>;

@Injectable()
export class ClubDivisionHistoryRepository extends BaseSingleTableRepository<
  MClubDivisionHistory,
  IClubDivisionHistoryCreate,
  ClubDivisionHistoryTable,
  ClubDivisionHistoryQuery,
  ClubDivisionHistoryOrderByKeys,
  ClubDivisionHistoryQuerySupport
> {
  constructor() {
    super(ClubDivisionHistory, MClubDivisionHistory);
  }

  protected dbToModelMapping(
    result: ClubDivisionHistoryDbSelect,
  ): MClubDivisionHistory {
    return new MClubDivisionHistory({
      id: result.id,
      club: { id: result.clubId },
      division: { id: result.divisionId },
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(
    model: MClubDivisionHistory,
  ): ClubDivisionHistoryDbUpdate {
    return {
      id: model.id,
      clubId: model.club.id,
      divisionId: model.division.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected createToDBMapping(
    model: IClubDivisionHistoryCreate,
  ): ClubDivisionHistoryDbInsert {
    return {
      clubId: model.club.id,
      divisionId: model.division.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: ClubDivisionHistoryFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      ClubDivisionHistoryFieldMapKeys,
      TableWithID | null
    > = {
      id: ClubDivisionHistory,
      clubId: ClubDivisionHistory,
      divisionId: ClubDivisionHistory,
      startTerm: ClubDivisionHistory,
      endTerm: ClubDivisionHistory,
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
  protected processSpecialCondition(
    key: ClubDivisionHistoryFieldMapKeys,
    value: PrimitiveConditionValue,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      return not(
        or(
          gt(ClubDivisionHistory.startTerm, value),
          and(
            isNotNull(ClubDivisionHistory.endTerm),
            lte(ClubDivisionHistory.endTerm, value),
          ),
        ),
      );
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
