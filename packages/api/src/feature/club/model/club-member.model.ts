import { IClubMember } from "@clubs/domain/club/club-member";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export type IClubMemberCreate = Pick<
  IClubMember,
  "club" | "student" | "semester"
> & {
  startTerm: Date;
  endTerm: Date | null;
};

export class MClubMember extends MEntity implements IClubMemberCreate {
  static modelName = "clubMember";

  club: IClubMember["club"];
  student: IClubMember["student"];
  semester: IClubMember["semester"];
  startTerm: Date;
  endTerm: Date | null;

  constructor(data: IClubMemberCreate & { id: number }) {
    super();
    Object.assign(this, data);
  }
}
