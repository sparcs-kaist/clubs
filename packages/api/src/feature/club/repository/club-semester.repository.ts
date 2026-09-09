import { ConflictException, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
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
  date: Date;
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
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("clubT", MClubSemester);
  }

  async ensureForRegistration(param: {
    clubId: number;
    semesterId: number;
    clubStatusEnumId: ClubTypeEnum;
    characteristicKr: string | null;
    characteristicEn: string | null;
    professorId: number | null;
    startTerm: Date;
    endTerm: Date;
  }): Promise<{ startTerm: Date; endTerm: Date | null }> {
    const delegate = this.getDelegate(this.txHost.tx);
    const existing = await delegate.findFirst({
      where: {
        clubId: param.clubId,
        semesterId: param.semesterId,
        deletedAt: null,
      },
    });
    if (existing) return existing;
    return delegate.create({ data: param });
  }

  async cancelRegistration(clubId: number, now: Date): Promise<number> {
    const delegate = this.getDelegate(this.txHost.tx);
    const where = {
      clubId,
      clubStatusEnumId: {
        in: [ClubTypeEnum.Regular, ClubTypeEnum.Provisional],
      },
      startTerm: { lte: now },
      OR: [{ endTerm: { gte: now } }, { endTerm: null }],
      deletedAt: null,
    };
    const clubT = await delegate.findFirst({
      where,
      select: { semesterId: true },
    });
    if (!clubT) {
      throw new ConflictException("Club registration cannot be canceled");
    }

    const result = await delegate.updateMany({
      where,
      data: {
        clubStatusEnumId: ClubTypeEnum.RegistrationCanceled,
        endTerm: now,
      },
    });
    if (result.count !== 1) {
      throw new ConflictException("Club registration cannot be canceled");
    }

    return clubT.semesterId;
  }

  async countClubsBySemester(excludedClubIds: number[]) {
    const delegate = this.getDelegate(this.txHost.tx);
    const rows = await delegate.groupBy({
      by: ["semesterId"],
      where: {
        clubId: { notIn: excludedClubIds },
        clubStatusEnumId: {
          in: [ClubTypeEnum.Regular, ClubTypeEnum.Provisional],
        },
        deletedAt: null,
      },
      _count: true,
    });

    return rows.map(({ semesterId, _count: clubCount }) => ({
      semesterId,
      clubCount,
    }));
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
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }

  protected processSpecialCondition(
    key: ClubSemesterFieldMapKeys,
    value: PrimitiveConditionValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (key !== "date") {
      throw new Error(`Invalid key: ${key}`);
    }
    if (!(value instanceof Date)) {
      throw new Error(`Invalid date: ${value}`);
    }

    return {
      NOT: {
        OR: [
          { startTerm: { gt: value } },
          { AND: [{ endTerm: { not: null } }, { endTerm: { lte: value } }] },
        ],
      },
    };
  }
}
