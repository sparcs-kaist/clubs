import { IDivisionSummary } from "@clubs/interface/api/division/type/division.type";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

import { OldMDivision } from "./old.division.model";

export type DivisionDBResult = {
  id: number;
  name: string;
  startTerm: Date;
  endTerm: Date | null;
  districtId: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export class VDivisionSummary
  extends MEntity<number>
  implements IDivisionSummary
{
  static modelName = "divisionSummary";

  name!: IDivisionSummary["name"];

  // 첫 번째 생성자: IDivision\Summary로부터 초기화
  constructor(divisionSummary: IDivisionSummary);

  // 두 번째 생성자: OldMDivision로부터 초기화
  constructor(division: OldMDivision);

  constructor(param: IDivisionSummary | OldMDivision) {
    super();
    Object.assign(this, param);
  }

  static from(result: DivisionDBResult): VDivisionSummary {
    return new VDivisionSummary({
      ...result,
    });
  }
}
