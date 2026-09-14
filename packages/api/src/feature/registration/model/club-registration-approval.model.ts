import { Registration } from "@prisma/client";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export type ClubRegistrationApproval = Pick<
  Registration,
  | "id"
  | "clubId"
  | "semesterId"
  | "studentId"
  | "registrationApplicationTypeEnumId"
  | "divisionId"
  | "activityFieldKr"
  | "activityFieldEn"
  | "professorId"
>;

export type IClubRegistrationApprovalCreate = Omit<
  ClubRegistrationApproval,
  "id"
>;

export class MClubRegistrationApproval
  extends MEntity
  implements IClubRegistrationApprovalCreate
{
  static modelName = "clubRegistrationApproval";

  clubId: number | null;
  semesterId: number | null;
  studentId: number;
  registrationApplicationTypeEnumId: number;
  divisionId: number;
  activityFieldKr: string | null;
  activityFieldEn: string | null;
  professorId: number | null;

  constructor(data: ClubRegistrationApproval) {
    super();
    Object.assign(this, data);
  }
}
