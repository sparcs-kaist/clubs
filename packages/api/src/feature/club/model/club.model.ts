import { IClub } from "@clubs/domain/club/club";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";
import { RMDivision } from "@sparcs-clubs/api/feature/division/model/division.model";
import { RMProfessor } from "@sparcs-clubs/api/feature/user/model/professor.model";

import { RMClubDelegate } from "./club-delegate.model";
import { MClubSemester } from "./club-semester.model";

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
  static modelName = "club";

  nameKr: IClub["nameKr"];
  nameEn: IClub["nameEn"];
  description: IClub["description"];
  foundingYear: IClub["foundingYear"];

  constructor(data: IClub) {
    super();
    Object.assign(this, data);
  }
}

export interface RMClub extends MClub {
  semester: MClubSemester["semester"];

  clubTypeEnum: MClubSemester["clubTypeEnum"];
  characteristicKr: MClubSemester["characteristicKr"];
  characteristicEn: MClubSemester["characteristicEn"];

  professor: RMProfessor;

  clubRepresentative: RMClubDelegate;

  clubDelegate1: RMClubDelegate | undefined;

  clubDelegate2: RMClubDelegate | undefined;

  division: RMDivision;
}
