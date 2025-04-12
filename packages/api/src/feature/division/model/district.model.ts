import { InferSelectModel } from "drizzle-orm";

import { IDistrict } from "@clubs/interface/api/division/type/division.type";

import { MEntity } from "@sparcs-clubs/api/common/model/entity.model";
import { District } from "@sparcs-clubs/api/drizzle/schema/division.schema";

export type DistrictDBResult = InferSelectModel<typeof District>;

export class MDistrict extends MEntity implements IDistrict {
  static modelName = "district";

  name: IDistrict["name"];

  constructor(data: IDistrict) {
    super();
    Object.assign(this, data);
  }

  static from(result: DistrictDBResult): MDistrict {
    return new MDistrict({
      ...result,
    });
  }
}
