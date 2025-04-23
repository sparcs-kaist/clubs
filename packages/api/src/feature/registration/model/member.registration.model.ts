import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IMemberRegistration } from "@clubs/domain/member-registration/member-registration";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";
import { ExcludeInCreate } from "@sparcs-clubs/api/common/util/decorators/model-property-decorator";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";

export type FromDb = InferSelectModel<typeof RegistrationApplicationStudent>;
export type ToDb = InferInsertModel<typeof RegistrationApplicationStudent>;

export type MemberRegistrationQuery = {
  studentId: number;
  clubId: number;
  semesterId: number;
  registrationApplicationStudentEnum: RegistrationApplicationStudentStatusEnum;
  createdAt: Date;
};
export interface IMemberRegistrationCreate {
  student: IMemberRegistration["student"];

  club: IMemberRegistration["club"];

  semester: IMemberRegistration["semester"];

  registrationApplicationStudentEnum: IMemberRegistration["registrationApplicationStudentEnum"];
}

export class MMemberRegistration
  extends MEntity
  implements IMemberRegistration
{
  static modelName = "member_registration";

  student: IMemberRegistration["student"];

  club: IMemberRegistration["club"];

  registrationApplicationStudentEnum: IMemberRegistration["registrationApplicationStudentEnum"];

  semester: IMemberRegistration["semester"];

  @ExcludeInCreate()
  createdAt: IMemberRegistration["createdAt"];

  constructor(data: IMemberRegistration) {
    super();
    Object.assign(this, data);
  }
}
