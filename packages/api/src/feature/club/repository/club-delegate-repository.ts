import { ConflictException, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { ClubDelegateEnum } from "@clubs/domain/club/club-delegate";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
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
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("clubDelegateD", MClubDelegate);
  }

  async endCurrentTerms(clubId: number, now: Date): Promise<void> {
    const delegate = this.getDelegate(this.txHost.tx);
    await delegate.updateMany({
      where: {
        clubId,
        startTerm: { lte: now },
        OR: [{ endTerm: { gte: now } }, { endTerm: null }],
        deletedAt: null,
      },
      data: { endTerm: now },
    });
  }

  async ensureRegistrationApplicantRepresentative(param: {
    clubId: number;
    studentId: number;
    effectiveAt: Date;
  }): Promise<void> {
    const delegate = this.getDelegate(this.txHost.tx);
    const otherClubDelegate = await delegate.findFirst({
      where: {
        clubId: { not: param.clubId },
        studentId: param.studentId,
        startTerm: { lte: param.effectiveAt },
        OR: [{ endTerm: { gt: param.effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
    });
    if (otherClubDelegate) {
      throw new ConflictException(
        "Registration applicant is a delegate of another club",
      );
    }

    await this.endCurrentTerms(param.clubId, param.effectiveAt);
    await delegate.create({
      data: {
        clubId: param.clubId,
        studentId: param.studentId,
        clubDelegateEnum: ClubDelegateEnum.Representative,
        startTerm: param.effectiveAt,
      },
    });
  }

  async lockForRegistrationChange(
    clubId: number,
    studentId: number,
    now: Date,
  ): Promise<void> {
    const { tx } = this.txHost;
    await this.acquireLock(tx, { clubId, date: now });
    await this.acquireLock(tx, { studentId, date: now });
  }

  async replaceForRegistration(param: {
    clubId: number;
    studentId: number;
    clubDelegateEnumId: number;
    effectiveAt: Date;
  }): Promise<void> {
    const { tx } = this.txHost;
    const delegate = this.getDelegate(tx);
    const futureClubHistory = await delegate.findFirst({
      where: {
        clubId: param.clubId,
        startTerm: { gt: param.effectiveAt },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (futureClubHistory) {
      throw new ConflictException(
        "Delegate history already exists after effectiveAt",
      );
    }

    const otherClubHistory = await delegate.findFirst({
      where: {
        studentId: param.studentId,
        clubId: { not: param.clubId },
        OR: [{ endTerm: { gt: param.effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (otherClubHistory) {
      throw new ConflictException(
        "Student is already a delegate of another club",
      );
    }

    const currentRoles = await delegate.findMany({
      where: {
        clubId: param.clubId,
        clubDelegateEnum: param.clubDelegateEnumId,
        startTerm: { lte: param.effectiveAt },
        OR: [{ endTerm: { gt: param.effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
      select: { studentId: true },
    });
    if (currentRoles.length > 1) {
      throw new ConflictException("Multiple students have the selected role");
    }
    if (currentRoles[0]?.studentId === param.studentId) {
      throw new ConflictException("Student already has the selected role");
    }

    const currentStudentRoles = await delegate.findMany({
      where: {
        clubId: param.clubId,
        studentId: param.studentId,
        startTerm: { lte: param.effectiveAt },
        OR: [{ endTerm: { gt: param.effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (currentStudentRoles.length > 1) {
      throw new ConflictException("Student has multiple delegate roles");
    }

    await delegate.updateMany({
      where: {
        clubId: param.clubId,
        clubDelegateEnum: param.clubDelegateEnumId,
        startTerm: { lte: param.effectiveAt },
        OR: [{ endTerm: { gt: param.effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
      data: { endTerm: param.effectiveAt },
    });
    await delegate.updateMany({
      where: {
        clubId: param.clubId,
        studentId: param.studentId,
        startTerm: { lte: param.effectiveAt },
        OR: [{ endTerm: { gt: param.effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
      data: { endTerm: param.effectiveAt },
    });
    await delegate.create({
      data: {
        clubId: param.clubId,
        studentId: param.studentId,
        clubDelegateEnum: param.clubDelegateEnumId,
        startTerm: param.effectiveAt,
      },
    });
  }

  async cancelForRegistration(param: {
    clubId: number;
    studentId: number;
    clubDelegateEnumId: number;
    effectiveAt: Date;
  }): Promise<void> {
    if (param.clubDelegateEnumId === ClubDelegateEnum.Representative) {
      throw new ConflictException("Representative role cannot be canceled");
    }

    const delegate = this.getDelegate(this.txHost.tx);
    const currentRoles = await delegate.findMany({
      where: {
        clubId: param.clubId,
        studentId: param.studentId,
        clubDelegateEnum: param.clubDelegateEnumId,
        startTerm: { lte: param.effectiveAt },
        OR: [{ endTerm: { gt: param.effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (currentRoles.length !== 1) {
      throw new ConflictException("Delegate role does not exist");
    }

    await delegate.updateMany({
      where: { id: currentRoles[0].id, deletedAt: null },
      data: { endTerm: param.effectiveAt },
    });
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
