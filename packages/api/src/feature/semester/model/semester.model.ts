import { InferSelectModel } from "drizzle-orm";

import { ISemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";

import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

type SemesterDBResult = InferSelectModel<typeof SemesterD>;

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
}
