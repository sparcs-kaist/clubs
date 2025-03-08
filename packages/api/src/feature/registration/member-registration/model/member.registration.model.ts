import { asc, desc, InferSelectModel, SQL } from "drizzle-orm";

import { IMemberRegistration } from "@sparcs-clubs/interface/api/registration/type/member.registration.type";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import { MEntity } from "@sparcs-clubs/api/common/model/entity.model";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";

type MemberRegistrationDbResult = InferSelectModel<
  typeof RegistrationApplicationStudent
>;

const orderByFieldMap = {
  createdAt: RegistrationApplicationStudent.createdAt,
  registrationApplicationStudentEnum:
    RegistrationApplicationStudent.registrationApplicationStudentEnumId,
  semesterId: RegistrationApplicationStudent.semesterId,
};

export type IMemberRegistrationOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

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

  static makeOrderBy(orderBy: IMemberRegistrationOrderBy): SQL[] {
    return Object.entries(orderBy)
      .filter(
        ([key, orderByType]) =>
          orderByType && orderByFieldMap[key as keyof typeof orderByFieldMap],
      )
      .map(([key, orderByType]) =>
        orderByType === OrderByTypeEnum.ASC
          ? asc(orderByFieldMap[key])
          : desc(orderByFieldMap[key]),
      );
  }
}
