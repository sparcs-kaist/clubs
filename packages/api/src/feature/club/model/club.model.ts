import { InferSelectModel } from "drizzle-orm";

import { IClub } from "@clubs/interface/api/club/type/club.type";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import {
  Club,
  ClubDelegateD,
  ClubRoomT,
  ClubT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";

type ClubDBResult = {
  club: InferSelectModel<typeof Club>;
  club_t: InferSelectModel<typeof ClubT>;
  club_room_t: InferSelectModel<typeof ClubRoomT>;
  club_delegate_d: InferSelectModel<typeof ClubDelegateD>[];
};

export class MClub implements IClub {
  id: IClub["id"];

  nameKr: IClub["nameKr"];

  nameEn: IClub["nameEn"];

  typeEnum: IClub["typeEnum"];

  description: IClub["description"];

  foundingYear: IClub["foundingYear"];

  characteristicKr: IClub["characteristicKr"];

  characteristicEn: IClub["characteristicEn"];

  semester: IClub["semester"];

  clubRoom: IClub["clubRoom"];

  clubRepresentative: IClub["clubRepresentative"];

  clubDelegate1: IClub["clubDelegate1"];

  clubDelegate2: IClub["clubDelegate2"];

  division: IClub["division"];

  professor: IClub["professor"];

  constructor(data: IClub) {
    Object.assign(this, data);
  }

  static fromDBResult(result: ClubDBResult): MClub {
    const president = result.club_delegate_d.find(
      e => e.ClubDelegateEnumId === ClubDelegateEnum.Representative,
    );
    const delegate1 = result.club_delegate_d.find(
      e => e.ClubDelegateEnumId === ClubDelegateEnum.Delegate1,
    );
    const delegate2 = result.club_delegate_d.find(
      e => e.ClubDelegateEnumId === ClubDelegateEnum.Delegate2,
    );

    return new MClub({
      id: result.club.id,
      nameKr: result.club.nameKr,
      nameEn: result.club.nameEn,
      typeEnum: result.club_t.clubStatusEnumId,
      description: result.club.description,
      foundingYear: result.club.foundingYear,
      characteristicKr: result.club_t.characteristicKr,
      characteristicEn: result.club_t.characteristicEn,
      semester: {
        id: result.club_t.semesterId,
      },
      clubRoom: result.club_room_t
        ? {
            id: result.club_room_t.id,
          }
        : null,
      clubRepresentative: {
        ...president,
        student: {
          id: president.studentId,
        },
        clubDelegateEnum: president.ClubDelegateEnumId,
      },
      clubDelegate1: delegate1
        ? {
            ...delegate1,
            student: {
              id: delegate1.studentId,
            },
            clubDelegateEnum: delegate1.ClubDelegateEnumId,
          }
        : null,
      clubDelegate2: delegate2
        ? {
            ...delegate2,
            student: {
              id: delegate2.studentId,
            },
            clubDelegateEnum: delegate2.ClubDelegateEnumId,
          }
        : null,
      division: {
        id: result.club.divisionId,
      },
      professor: result.club_t.professorId
        ? {
            id: result.club_t.professorId,
          }
        : null,
    });
  }
}
