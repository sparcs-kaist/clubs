import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IMemberRegistration } from "@clubs/interface/api/registration/type/member.registration.type";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";
import { MMemberRegistration } from "@sparcs-clubs/api/feature/registration/model/member.registration.model";

type MemberRegistrationQuery = {
  studentId: number;
  clubId: number;
  semesterId: number;
};

type MemberRegistrationTable = typeof RegistrationApplicationStudent;
type MemberRegistrationDbSelect = InferSelectModel<MemberRegistrationTable>;
type MemberRegistrationDbInsert = InferInsertModel<MemberRegistrationTable>;
type MemberRegistrationDbUpdate = Partial<MemberRegistrationDbInsert>;

type MemberRegistrationFieldMapKeys =
  BaseTableFieldMapKeys<MemberRegistrationQuery>;

@Injectable()
export default class MemberRegistrationRepository extends BaseSingleTableRepository<
  MMemberRegistration,
  IMemberRegistration,
  MemberRegistrationTable,
  MemberRegistrationDbSelect,
  MemberRegistrationDbInsert,
  MemberRegistrationDbUpdate,
  MemberRegistrationQuery
> {
  constructor() {
    super(RegistrationApplicationStudent, MMemberRegistration);
  }

  protected dbToModelMapping(
    result: MemberRegistrationDbSelect,
  ): MMemberRegistration {
    return new MMemberRegistration({
      id: result.id,
      student: { id: result.studentId },
      club: { id: result.clubId },
      semester: { id: result.semesterId },
      registrationApplicationStudentEnum:
        result.registrationApplicationStudentEnum,
      createdAt: result.createdAt,
    });
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
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
