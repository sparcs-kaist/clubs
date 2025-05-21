import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";
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

type MemberRegistrationTable = typeof RegistrationApplicationStudent;
type MemberRegistrationDbSelect = InferSelectModel<MemberRegistrationTable>;
type MemberRegistrationDbUpdate = Partial<MemberRegistrationDbSelect>;
type MemberRegistrationDbInsert = InferInsertModel<MemberRegistrationTable>;

type MemberRegistrationFieldMapKeys = BaseTableFieldMapKeys<
  MemberRegistrationQuery,
  MemberRegistrationOrderByKeys
>;

@Injectable()
export class MemberRegistrationRepository extends BaseSingleTableRepository<
  MMemberRegistration,
  IMemberRegistrationCreate,
  MemberRegistrationTable,
  MemberRegistrationQuery,
  MemberRegistrationOrderByKeys
> {
  constructor() {
    super(RegistrationApplicationStudent, MMemberRegistration);
  }

  protected dbToModelMapping(
    result: MemberRegistrationDbSelect,
  ): MMemberRegistration {
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

  protected modelToDBMapping(
    model: MMemberRegistration,
  ): MemberRegistrationDbUpdate {
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

  protected createToDBMapping(
    model: IMemberRegistrationCreate,
  ): MemberRegistrationDbInsert {
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
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      MemberRegistrationFieldMapKeys,
      TableWithID | null
    > = {
      id: RegistrationApplicationStudent,
      studentId: RegistrationApplicationStudent,
      clubId: RegistrationApplicationStudent,
      semesterId: RegistrationApplicationStudent,
      registrationApplicationStudentEnum: RegistrationApplicationStudent,
      createdAt: RegistrationApplicationStudent,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
