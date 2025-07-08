import { IDistrict } from "@clubs/interface/api/division/type/division.type";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IDistrictCreate {
  name: IDistrict["name"];
}

export class MDistrict extends MEntity implements IDistrict {
  static modelName = "district";

  name!: IDistrict["name"];

  constructor(data: IDistrict) {
    super();
    Object.assign(this, data);
  }
}
