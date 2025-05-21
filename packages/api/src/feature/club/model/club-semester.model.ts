import { IClubSemester } from "@clubs/domain/club/club-semester";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

/**
 * @description ClubOld 중 학기에 따라 정해지는 모델입니다.
 */

export interface IClubSemesterCreate {
  club: IClubSemester["club"];
  semester: IClubSemester["semester"];
  clubTypeEnum: IClubSemester["clubTypeEnum"];
  characteristicKr: IClubSemester["characteristicKr"];
  characteristicEn: IClubSemester["characteristicEn"];
  professor: IClubSemester["professor"];
  startTerm: IClubSemester["startTerm"];
  endTerm: IClubSemester["endTerm"];
}

export class MClubSemester
  extends MEntity
  implements IClubSemester, IClubSemesterCreate
{
  static modelName = "clubSemester";

  club: IClubSemester["club"];
  semester: IClubSemester["semester"];

  clubTypeEnum: IClubSemester["clubTypeEnum"];
  characteristicKr: IClubSemester["characteristicKr"];
  characteristicEn: IClubSemester["characteristicEn"];

  professor: IClubSemester["professor"];

  // TODO: 나중에 정규화 시에 떼야 함
  startTerm: IClubSemester["startTerm"];
  endTerm: IClubSemester["endTerm"];

  constructor(data: IClubSemester) {
    super();
    Object.assign(this, data);
  }
}
