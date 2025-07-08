import { IDivision } from "@clubs/domain/division/division";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

import { MDistrict } from "./district.model";

export interface IDivisionCreate {
  name: IDivision["name"];
  district: IDivision["district"];
  startTerm: IDivision["startTerm"];
  endTerm: IDivision["endTerm"];
}

export class MDivision extends MEntity implements IDivision, IDivisionCreate {
  name!: IDivision["name"];
  district!: IDivision["district"];
  startTerm!: IDivision["startTerm"];
  endTerm!: IDivision["endTerm"];

  constructor(data: IDivision) {
    super();
    Object.assign(this, data);
  }
}

export interface RMDivision extends MDivision {
  district: MDistrict;
}
