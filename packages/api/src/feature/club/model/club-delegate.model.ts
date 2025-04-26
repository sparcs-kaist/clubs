import { IClubDelegate } from "@clubs/domain/club/club-delegate";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

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
