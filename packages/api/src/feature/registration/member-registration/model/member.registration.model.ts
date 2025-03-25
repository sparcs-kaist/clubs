import {
  ColumnBaseConfig,
  ColumnDataType,
  InferSelectModel,
} from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

import { IMemberRegistration } from "@sparcs-clubs/interface/api/registration/type/member.registration.type";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import {
  Exclude,
  filterExcludedFields,
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
  registrationApplicationStudentEnum: IMemberRegistration["registrationApplicationStudentEnum"] =
    RegistrationApplicationStudentStatusEnum.Pending;

  semester: IMemberRegistration["semester"];

  @Exclude(OperationType.CREATE)
  createdAt: IMemberRegistration["createdAt"];

  deletedAt: IMemberRegistration["deletedAt"];

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
      deletedAt: result.deletedAt,
    });
  }

  to(operation: OperationType): MemberRegistrationDbResult {
    const filtered = filterExcludedFields(
      this,
      MMemberRegistration.constructor as new (...args: unknown[]) => unknown,
      operation,
    );

    return {
      id: filtered.id ?? undefined,
      studentId: filtered.student?.id,
      clubId: filtered.club?.id,
      semesterId: filtered.semester?.id,
      registrationApplicationStudentEnumId:
        filtered.registrationApplicationStudentEnum ?? undefined,
      createdAt: filtered.createdAt ?? undefined,
      deletedAt: filtered.deletedAt,
    } as MemberRegistrationDbResult;
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
