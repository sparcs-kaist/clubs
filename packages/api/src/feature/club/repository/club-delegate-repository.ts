import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
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

import {
  cancelPendingDelegateRequests,
  lockClubDelegates,
  lockDelegateStudent,
} from "./lock-club-delegates";

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
        OR: [{ endTerm: { gt: now } }, { endTerm: null }],
        deletedAt: null,
      },
      data: { endTerm: now },
    });
  }

  async ensureRegistrationApplicantRepresentative(param: {
    clubId: number;
    studentId: number;
    previousSemesterEnd: Date;
    semesterStart: Date;
    semesterEnd: Date;
    approvedAt: Date;
  }): Promise<void> {
    const { tx } = this.txHost;
    const delegate = this.getDelegate(tx);
    const otherClubDelegate = await delegate.findFirst({
      where: {
        clubId: { not: param.clubId },
        studentId: param.studentId,
        OR: [{ endTerm: { gt: param.semesterStart } }, { endTerm: null }],
        deletedAt: null,
      },
    });
    if (otherClubDelegate) {
      throw new ConflictException(
        "Registration applicant is a delegate of another club",
      );
    }

    const laterTerm = await delegate.findFirst({
      where: {
        clubId: param.clubId,
        startTerm: { gte: param.semesterEnd },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (laterTerm) {
      throw new ConflictException(
        "Delegate history exists after the registration semester",
      );
    }

    await this.endCurrentTerms(param.clubId, param.previousSemesterEnd);
    // 승인 전에 만들어진 임시 직책을 새 학기에 이어가지 않습니다.
    await delegate.updateMany({
      where: {
        clubId: param.clubId,
        startTerm: { gte: param.previousSemesterEnd, lt: param.semesterEnd },
        deletedAt: null,
      },
      data: { deletedAt: param.approvedAt },
    });
    await delegate.create({
      data: {
        clubId: param.clubId,
        studentId: param.studentId,
        clubDelegateEnum: ClubDelegateEnum.Representative,
        startTerm: param.semesterStart,
      },
    });
    await cancelPendingDelegateRequests(
      this.txHost,
      param.clubId,
      param.approvedAt,
    );
  }

  async lockForRegistrationChange(
    clubId: number,
    studentId?: number,
  ): Promise<void> {
    await lockClubDelegates(this.txHost, clubId, studentId);
  }

  async lockRegistrationApplicant(studentId: number): Promise<void> {
    await lockDelegateStudent(this.txHost, studentId);
  }

  async deleteProvisionalClub(clubId: number, now: Date): Promise<void> {
    const { tx } = this.txHost;
    const club = await tx.club.updateMany({
      where: { id: clubId, deletedAt: null },
      data: { deletedAt: now },
    });
    const delegates = await tx.clubDelegateD.updateMany({
      where: { clubId, deletedAt: null },
      data: { deletedAt: now },
    });
    if (club.count !== 1) {
      throw new InternalServerErrorException(
        "ClubOld or delegate delete failed",
      );
    }
    if (delegates.count === 0) {
      throw new InternalServerErrorException(
        "ClubOld or delegate delete failed",
      );
    }
    await cancelPendingDelegateRequests(this.txHost, clubId, now);
  }

  async replaceForRegistration(param: {
    clubId: number;
    studentId: number;
    clubDelegateEnumId: number;
    effectiveAt: Date;
    changedAt: Date;
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
      select: { clubDelegateEnum: true },
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
    await cancelPendingDelegateRequests(
      this.txHost,
      param.clubId,
      param.changedAt,
      {
        clubDelegateEnumId: {
          in: [
            param.clubDelegateEnumId,
            ...currentStudentRoles.map(role => role.clubDelegateEnum),
          ],
        },
      },
    );
  }

  async cancelForRegistration(param: {
    clubId: number;
    studentId: number;
    clubDelegateEnumId: number;
    effectiveAt: Date;
    changedAt: Date;
  }): Promise<void> {
    if (param.clubDelegateEnumId === ClubDelegateEnum.Representative) {
      throw new ConflictException("Representative role cannot be canceled");
    }

    const { tx } = this.txHost;
    const delegate = this.getDelegate(tx);
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
    await cancelPendingDelegateRequests(
      this.txHost,
      param.clubId,
      param.changedAt,
      {
        clubDelegateEnumId: param.clubDelegateEnumId,
      },
    );
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
