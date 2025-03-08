import { asc, desc, InferSelectModel, SQL } from "drizzle-orm";

import { ISemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";

import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

type SemesterDBResult = InferSelectModel<typeof SemesterD>;

const orderByFieldMap = {
  startTerm: SemesterD.startTerm,
  endTerm: SemesterD.endTerm,
  year: SemesterD.year,
};

export enum OrderByTypeEnum {
  ASC = 1,
  DESC,
}

export type ISemesterOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

export class MSemester implements ISemester {
  id: ISemester["id"];
  name: ISemester["name"];
  startTerm: ISemester["startTerm"];
  endTerm: ISemester["endTerm"];
  year: ISemester["year"];

  constructor(data: ISemester) {
    Object.assign(this, data);
  }

  static fromDBResult(result: SemesterDBResult): MSemester {
    return new MSemester({
      id: result.id,
      name: result.name,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
      year: result.year,
    });
  }

  static makeOrderBy(orderBy: ISemesterOrderBy): SQL[] {
    return Object.entries(orderBy)
      .filter(
        ([key, orderByType]) =>
          orderByType && orderByFieldMap[key as keyof typeof orderByFieldMap],
      )
      .map(([key, orderByType]) =>
        orderByType === OrderByTypeEnum.ASC
          ? asc(orderByFieldMap[key])
          : desc(orderByFieldMap[key]),
      );
  }
}
