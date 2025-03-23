import {
  ColumnBaseConfig,
  ColumnDataType,
  InferSelectModel,
} from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

import { IMemberRegistration } from "@sparcs-clubs/interface/api/registration/type/member.registration.type";
import {
  Exclude,
  ExcludeFieldsInOperation,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

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

  @Exclude(OperationType.CREATE, OperationType.PUT)
  declare id: IMemberRegistration["id"];

  student: IMemberRegistration["student"];

  club: IMemberRegistration["club"];

  @Exclude(OperationType.CREATE, OperationType.PUT)
  registrationApplicationStudentEnum: IMemberRegistration["registrationApplicationStudentEnum"];

  semester: IMemberRegistration["semester"];

  @Exclude(OperationType.CREATE)
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

export type IMemberRegistrationCreate = ExcludeFieldsInOperation<
  IMemberRegistration,
  MMemberRegistration,
  OperationType.CREATE
>;

export type IMemberRegistrationPut = ExcludeFieldsInOperation<
  IMemberRegistration,
  MMemberRegistration,
  OperationType.PUT
>;
