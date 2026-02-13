import { IMemberRegistration } from "@clubs/domain/registration/member-registration";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export type FromDb = {
  id: number;
  studentId: number;
  clubId: number;
  semesterId: number;
  registrationApplicationStudentEnumId: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type ToDb = {
  studentId: number;
  clubId: number;
  semesterId: number;
  registrationApplicationStudentEnumId: number;
};

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

  createdAt: IMemberRegistration["createdAt"];

  constructor(data: IMemberRegistration) {
    super();
    Object.assign(this, data);
  }
}
