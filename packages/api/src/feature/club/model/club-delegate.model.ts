import { IClubDelegate } from "@clubs/domain/club/club-delegate";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

import { MOldStudent } from "../../user/model/old.student.model";

export interface IClubDelegateCreate {
  club: IClubDelegate["club"];
  student: IClubDelegate["student"];
  clubDelegateEnum: IClubDelegate["clubDelegateEnum"];
  startTerm: IClubDelegate["startTerm"];
  endTerm: IClubDelegate["endTerm"];
}

export class MClubDelegate
  extends MEntity
  implements IClubDelegate, IClubDelegateCreate
{
  static modelName = "clubDelegate";

  club: IClubDelegate["club"];
  student: IClubDelegate["student"];
  clubDelegateEnum: IClubDelegate["clubDelegateEnum"];
  startTerm: IClubDelegate["startTerm"];
  endTerm: IClubDelegate["endTerm"];

  constructor(data: IClubDelegate) {
    super();
    Object.assign(this, data);
  }
}

export interface RMClubDelegate {
  studentId: MOldStudent["id"];
  name: MOldStudent["name"];
  studentNumber: MOldStudent["studentNumber"];
  email: MOldStudent["email"];
  phoneNumber: MOldStudent["phoneNumber"];
  clubDelegateEnum: MClubDelegate["clubDelegateEnum"];
  startTerm: MClubDelegate["startTerm"];
  endTerm: MClubDelegate["endTerm"];
}
