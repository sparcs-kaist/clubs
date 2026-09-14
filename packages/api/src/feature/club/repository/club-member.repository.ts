import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { ClubStudentT } from "@prisma/client";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import {
  IClubMemberCreate,
  MClubMember,
} from "@sparcs-clubs/api/feature/club/model/club-member.model";

type ClubMemberQuery = {
  clubId: number;
  studentId: number;
  semesterId: number;
};

@Injectable()
export class ClubMemberRepository extends BaseSingleTableRepository<
  MClubMember,
  IClubMemberCreate,
  ClubMemberQuery
> {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("clubStudentT", MClubMember);
  }

  async ensureMembershipForStudent(
    param: ClubMemberQuery & { startTerm: Date; endTerm: Date },
  ): Promise<void> {
    const delegate = this.getDelegate(this.txHost.tx);
    const { clubId, studentId, semesterId } = param;
    const existingMember = await delegate.findFirst({
      where: { clubId, studentId, semesterId, deletedAt: null },
      select: { id: true },
    });
    if (existingMember) return;
    await delegate.create({ data: param });
  }

  protected dbToModelMapping(result: ClubStudentT): MClubMember {
    return new MClubMember({
      id: result.id,
      club: { id: result.clubId },
      student: { id: result.studentId },
      semester: { id: result.semesterId },
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(model: MClubMember) {
    return { id: model.id, ...this.createToDBMapping(model) };
  }

  protected createToDBMapping(model: IClubMemberCreate) {
    return {
      clubId: model.club.id,
      studentId: model.student.id,
      semesterId: model.semester.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(field: BaseTableFieldMapKeys<ClubMemberQuery, "id">) {
    const fields = {
      id: "id",
      clubId: "clubId",
      studentId: "studentId",
      semesterId: "semesterId",
    };
    return fields[field];
  }
}
