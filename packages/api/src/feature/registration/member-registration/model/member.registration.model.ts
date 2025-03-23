import {
  ColumnBaseConfig,
  ColumnDataType,
  InferSelectModel,
} from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

import { IMemberRegistration } from "@sparcs-clubs/interface/api/registration/type/member.registration.type";

import { MEntity } from "@sparcs-clubs/api/common/model/entity.model";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";

type MemberRegistrationDbResult = InferSelectModel<
  typeof RegistrationApplicationStudent
>;

export type MemberRegistrationQuery = {
  studentId: number;
  clubId: number;
  semesterId: number;
  registrationApplicationStudentEnumId: number;
  createdAt: Date;
};

export class MMemberRegistration
  extends MEntity
  implements IMemberRegistration
{
  static modelName = "member_registration";

  student: IMemberRegistration["student"];
  club: IMemberRegistration["club"];
  registrationApplicationStudentEnum: IMemberRegistration["registrationApplicationStudentEnum"];
  semester: IMemberRegistration["semester"];
  createdAt: IMemberRegistration["createdAt"];
  constructor(data: IMemberRegistration) {
    super();
    Object.assign(this, data);
  }

  static from(result: MemberRegistrationDbResult): MMemberRegistration {
    return new MMemberRegistration({
      id: result.id,
      student: { id: result.studentId },
      club: { id: result.clubId },
      semester: { id: result.semesterId },
      registrationApplicationStudentEnum:
        result.registrationApplicationStudentEnumId,
      createdAt: result.createdAt,
    });
  }

  static fieldMap(
    field: keyof MemberRegistrationQuery,
  ): MySqlColumn<ColumnBaseConfig<ColumnDataType, string>> {
    const fieldMappings: Record<
      keyof MemberRegistrationQuery,
      MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>
    > = {
      studentId: RegistrationApplicationStudent.studentId,
      clubId: RegistrationApplicationStudent.clubId,
      semesterId: RegistrationApplicationStudent.semesterId,
      registrationApplicationStudentEnumId:
        RegistrationApplicationStudent.registrationApplicationStudentEnumId,
      createdAt: RegistrationApplicationStudent.createdAt,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
