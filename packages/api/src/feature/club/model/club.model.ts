import { IClub } from "@clubs/domain/club/club";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

/**
 * @description ClubOld 중 학기에 따라 불변하는 값을 모은 부분 입니다.
 */

export interface IClubCreate {
  nameKr: IClub["nameKr"];
  nameEn: IClub["nameEn"];
  description: IClub["description"];
  foundingYear: IClub["foundingYear"];
}

export class MClub extends MEntity implements IClub, IClubCreate {
  nameKr: IClub["nameKr"];
  nameEn: IClub["nameEn"];
  description: IClub["description"];
  foundingYear: IClub["foundingYear"];

  constructor(data: IClub) {
    super();
    Object.assign(this, data);
  }
}
