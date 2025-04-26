import { IClubDivisionHistory } from "@clubs/domain/club/club-division-history";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IClubDivisionHistoryCreate {
  club: IClubDivisionHistory["club"];
  division: IClubDivisionHistory["division"];
  startTerm: IClubDivisionHistory["startTerm"];
  endTerm: IClubDivisionHistory["endTerm"];
}

export class MClubDivisionHistory
  extends MEntity
  implements IClubDivisionHistory, IClubDivisionHistoryCreate
{
  club: IClubDivisionHistory["club"];
  division: IClubDivisionHistory["division"];
  startTerm: IClubDivisionHistory["startTerm"];
  endTerm: IClubDivisionHistory["endTerm"];

  constructor(data: IClubDivisionHistory) {
    super();
    Object.assign(this, data);
  }
}
