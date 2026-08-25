import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import {
  IMemberRegistrationCreate,
  MMemberRegistration,
} from "@sparcs-clubs/api/feature/registration/model/member.registration.model";

export type MemberRegistrationQuery = {
  studentId: number;
  clubId: number;
  semesterId: number;
  registrationApplicationStudentEnum: RegistrationApplicationStudentStatusEnum;
};
type MemberRegistrationOrderByKeys = "id" | "createdAt";

type MemberRegistrationFieldMapKeys = BaseTableFieldMapKeys<
  MemberRegistrationQuery,
  MemberRegistrationOrderByKeys
>;

@Injectable()
export class MemberRegistrationRepository extends BaseSingleTableRepository<
  MMemberRegistration,
  IMemberRegistrationCreate,
  MemberRegistrationQuery,
  MemberRegistrationOrderByKeys
> {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("registrationApplicationStudent", MMemberRegistration);
  }

  async createPending(
    studentId: number,
    clubId: number,
    semesterId: number,
  ): Promise<void> {
    const delegate = this.getDelegate(this.txHost.tx);
    await delegate.create({
      data: {
        studentId,
        clubId,
        semesterId,
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Pending,
      },
    });
  }

  async rejectPending(clubId: number, semesterId: number): Promise<void> {
    const delegate = this.getDelegate(this.txHost.tx);
    await delegate.updateMany({
      where: {
        clubId,
        semesterId,
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Pending,
        deletedAt: null,
      },
      data: {
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Rejected,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MMemberRegistration {
    const res = new MMemberRegistration({
      id: result.id,
      student: { id: result.studentId },
      club: { id: result.clubId },
      semester: { id: result.semesterId },
      registrationApplicationStudentEnum:
        result.registrationApplicationStudentEnum,
      createdAt: result.createdAt,
    });

    return res;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MMemberRegistration): any {
    return {
      id: model.id,
      studentId: model.student.id,
      clubId: model.club.id,
      semesterId: model.semester.id,
      registrationApplicationStudentEnum:
        model.registrationApplicationStudentEnum,
      createdAt: model.createdAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IMemberRegistrationCreate): any {
    return {
      studentId: model.student.id,
      clubId: model.club.id,
      semesterId: model.semester.id,
      registrationApplicationStudentEnum:
        model.registrationApplicationStudentEnum,
    };
  }

  protected fieldMap(
    field: MemberRegistrationFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<MemberRegistrationFieldMapKeys, string | null> =
      {
        id: "id",
        studentId: "studentId",
        clubId: "clubId",
        semesterId: "semesterId",
        registrationApplicationStudentEnum:
          "registrationApplicationStudentEnum",
        createdAt: "createdAt",
      };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }

  async getSemesterIdsWithMemberRegistrations(): Promise<number[]> {
    const rows = await this.prisma.registrationApplicationStudent.groupBy({
      by: ["semesterId"],
      where: {
        deletedAt: null,
        semesterId: { not: null },
      },
    });

    return rows.flatMap(row => (row.semesterId ? [row.semesterId] : []));
  }
}
