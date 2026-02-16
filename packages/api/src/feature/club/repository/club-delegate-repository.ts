import { Injectable } from "@nestjs/common";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
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

type ClubDelegateFieldMapKeys = BaseTableFieldMapKeys<
  ClubDelegateQuery,
  ClubDelegateOrderByKeys,
  ClubDelegateQuerySupport
>;

@Injectable()
export class ClubDelegateRepository extends BaseSingleTableRepository<
  MClubDelegate,
  IClubDelegateCreate,
  ClubDelegateQuery,
  ClubDelegateOrderByKeys,
  ClubDelegateQuerySupport
> {
  constructor() {
    super("clubDelegateD", MClubDelegate);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MClubDelegate {
    return new MClubDelegate({
      id: result.id,
      student: { id: result.studentId },
      club: { id: result.clubId },
      clubDelegateEnum: result.clubDelegateEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MClubDelegate): any {
    return {
      id: model.id,
      studentId: model.student.id,
      clubId: model.club.id,
      clubDelegateEnum: model.clubDelegateEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IClubDelegateCreate): any {
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
  ): string | null | undefined {
    const fieldMappings: Record<ClubDelegateFieldMapKeys, string | null> = {
      id: "id",
      studentId: "studentId",
      clubId: "clubId",
      clubDelegateEnum: "clubDelegateEnum",
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
    key: ClubDelegateFieldMapKeys,
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
