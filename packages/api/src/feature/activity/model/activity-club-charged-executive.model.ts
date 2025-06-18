import { IActivityClubChargedExecutive } from "@clubs/domain/activity/activity-club-charged-executive";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface ActivityClubChargedExecutiveCreate {
  activityDuration: IActivityClubChargedExecutive["activityDuration"];
  club: IActivityClubChargedExecutive["club"];
  executive: IActivityClubChargedExecutive["executive"];
}

export class MActivityClubChargedExecutive
  extends MEntity
  implements IActivityClubChargedExecutive
{
  static modelName = "ActivityClubChargedExecutive";

  activityDuration: IActivityClubChargedExecutive["activityDuration"];
  club: IActivityClubChargedExecutive["club"];
  executive: IActivityClubChargedExecutive["executive"];

  constructor(data: IActivityClubChargedExecutive) {
    super();
    Object.assign(this, data);
  }

  static updateExecutiveId(
    executiveId: number,
  ): (model: MActivityClubChargedExecutive) => MActivityClubChargedExecutive {
    return (model: MActivityClubChargedExecutive) =>
      new MActivityClubChargedExecutive({
        ...model,
        executive: { id: executiveId },
      });
  }
}
