import { InferSelectModel } from "drizzle-orm";

import { IMemberRegistration } from "@sparcs-clubs/interface/api/registration/type/member.registration.type";

import { MEntity } from "@sparcs-clubs/api/common/model/entity.model";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";

export type MemberRegistrationDbResult = InferSelectModel<
  typeof RegistrationApplicationStudent
>;

export class MMemberRegistration
  extends MEntity
  implements IMemberRegistration
{
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
}
