import { InferSelectModel } from "drizzle-orm";

import { IClubSummary } from "@clubs/interface/api/club/type/club.type";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import { ClubOld, ClubT } from "@sparcs-clubs/api/drizzle/schema/club.schema";

type ClubSummaryDBResult = {
  club: InferSelectModel<typeof ClubOld>;
  club_t?: InferSelectModel<typeof ClubT>;
};

export class VClubSummary implements IClubSummary {
  id: IClubSummary["id"];

  name: IClubSummary["name"];

  nameEn: IClubSummary["nameEn"];

  typeEnum: IClubSummary["typeEnum"];

  division: IClubSummary["division"];

  constructor(result: VClubSummary) {
    this.id = result.id;
    this.name = result.name;
    this.typeEnum = result.typeEnum;
    this.division = result.division;
  }

  static fromDBResult(result: ClubSummaryDBResult): VClubSummary {
    return new VClubSummary({
      id: result.club.id,
      name: result.club.nameKr,
      nameEn: result.club.nameEn,
      typeEnum: result.club_t // left join 및 기본값 처리로 club_t 가 없을 때 가등록 상태로 처리하게 함 -> reg025 이슈
        ? result.club_t.clubStatusEnumId
        : ClubTypeEnum.Provisional,
      division: {
        id: result.club.divisionId,
      },
    });
  }
}
