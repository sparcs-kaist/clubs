import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IMemberRegistration } from "@clubs/interface/api/registration/type/member.registration.type";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";
import {
  Exclude,
  filterExcludedFields,
  OperationType,
} from "@clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";

export type FromDb = InferSelectModel<typeof RegistrationApplicationStudent>;
export type ToDb = InferInsertModel<typeof RegistrationApplicationStudent>;

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

  @Exclude(OperationType.CREATE, OperationType.PUT)
  registrationApplicationStudentEnum: IMemberRegistration["registrationApplicationStudentEnum"] =
    RegistrationApplicationStudentStatusEnum.Pending;

  semester: IMemberRegistration["semester"];

  @Exclude(OperationType.CREATE)
  createdAt: IMemberRegistration["createdAt"];

  constructor(data: IMemberRegistration) {
    super();
    Object.assign(this, data);
  }

  static from(result: FromDb): MMemberRegistration {
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

  to(operation: OperationType): ToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      id: filtered.id ?? undefined,
      studentId: filtered.student?.id,
      clubId: filtered.club?.id,
      semesterId: filtered.semester?.id,
      registrationApplicationStudentEnumId:
        filtered.registrationApplicationStudentEnum ??
        RegistrationApplicationStudentStatusEnum.Pending,
      createdAt: filtered.createdAt ?? undefined,
    } as ToDb;
  }

  static fieldMap(field: keyof MemberRegistrationQuery): MySqlColumnType {
    const fieldMappings: Record<
      keyof MemberRegistrationQuery,
      MySqlColumnType
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
