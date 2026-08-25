import { IClubDelegateChangeRequest } from "@clubs/domain/club/club-delegate-change-request";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export type IClubDelegateChangeRequestCreate = Omit<
  IClubDelegateChangeRequest,
  "id"
>;

export class MClubDelegateChangeRequest
  extends MEntity
  implements IClubDelegateChangeRequest, IClubDelegateChangeRequestCreate
{
  static modelName = "clubDelegateChangeRequest";

  club: IClubDelegateChangeRequest["club"];
  prevStudent: IClubDelegateChangeRequest["prevStudent"];
  student: IClubDelegateChangeRequest["student"];
  clubDelegateChangeRequestStatusEnum: IClubDelegateChangeRequest["clubDelegateChangeRequestStatusEnum"];
  deletedAt: Date | null;

  constructor(data: IClubDelegateChangeRequest & { deletedAt: Date | null }) {
    super();
    Object.assign(this, data);
  }
}
