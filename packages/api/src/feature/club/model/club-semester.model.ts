import { IClubSemester } from "@clubs/domain/club/club-semester";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

/**
 * @description Club 중 학기에 따라 정해지는 모델입니다.
 */

export interface IClubSemesterCreate {
  typeEnum: IClubSemester["typeEnum"];
  characteristicKr: IClubSemester["characteristicKr"];
  characteristicEn: IClubSemester["characteristicEn"];
  professor: IClubSemester["professor"];
  semester: IClubSemester["semester"];
}

export class MClubSemester
  extends MEntity
  implements IClubSemester, IClubSemesterCreate
{
  club: IClubSemester["club"];
  semester: IClubSemester["semester"];

  typeEnum: IClubSemester["typeEnum"];
  characteristicKr: IClubSemester["characteristicKr"];
  characteristicEn: IClubSemester["characteristicEn"];

  professor: IClubSemester["professor"];

  constructor(data: IClubSemester) {
    super();
    Object.assign(this, data);
  }
}
