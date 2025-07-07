import { InferSelectModel } from "drizzle-orm";

import { IDivision } from "@clubs/interface/api/division/type/division.type";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";
import { Division } from "@sparcs-clubs/api/drizzle/schema/division.schema";

export type DivisionDBResult = InferSelectModel<typeof Division>;

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
