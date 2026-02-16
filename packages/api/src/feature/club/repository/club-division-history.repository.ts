import { Injectable } from "@nestjs/common";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
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

type ClubDivisionHistoryFieldMapKeys = BaseTableFieldMapKeys<
  ClubDivisionHistoryQuery,
  ClubDivisionHistoryOrderByKeys,
  ClubDivisionHistoryQuerySupport
>;

@Injectable()
export class ClubDivisionHistoryRepository extends BaseSingleTableRepository<
  MClubDivisionHistory,
  IClubDivisionHistoryCreate,
  ClubDivisionHistoryQuery,
  ClubDivisionHistoryOrderByKeys,
  ClubDivisionHistoryQuerySupport
> {
  constructor() {
    super("clubDivisionHistory", MClubDivisionHistory);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MClubDivisionHistory {
    return new MClubDivisionHistory({
      id: result.id,
      club: { id: result.clubId },
      division: { id: result.divisionId },
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MClubDivisionHistory): any {
    return {
      id: model.id,
      clubId: model.club.id,
      divisionId: model.division.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IClubDivisionHistoryCreate): any {
    return {
      clubId: model.club.id,
      divisionId: model.division.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: ClubDivisionHistoryFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<
      ClubDivisionHistoryFieldMapKeys,
      string | null
    > = {
      id: "id",
      clubId: "clubId",
      divisionId: "divisionId",
      startTerm: "startTerm",
      endTerm: "endTerm",
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }

  protected processSpecialCondition(
    key: ClubDivisionHistoryFieldMapKeys,
    value: PrimitiveConditionValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (key === "date" && value instanceof Date) {
      return {
        NOT: {
          OR: [
            { startTerm: { gt: value } },
            { AND: [{ endTerm: { not: null } }, { endTerm: { lte: value } }] },
          ],
        },
      };
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
