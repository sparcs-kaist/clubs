import { IDivision } from "@clubs/interface/api/division/type/division.type";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export type DivisionDBResult = {
  id: number;
  name: string;
  startTerm: Date;
  endTerm: Date | null;
  districtId: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export class OldMDivision extends MEntity implements IDivision {
  static modelName = "division";

  name!: IDivision["name"];

  startTerm!: IDivision["startTerm"];

  endTerm!: IDivision["endTerm"];

  district!: IDivision["district"];

  constructor(data: IDivision) {
    super();
    Object.assign(this, data);
  }

  static from(result: DivisionDBResult): OldMDivision {
    return new OldMDivision({
      ...result,
      district: {
        id: result.districtId,
      },
    });
  }
}
