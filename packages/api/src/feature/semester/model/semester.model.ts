import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { ISemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";
import {
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type SemesterFromDb = InferSelectModel<typeof SemesterD>;
export type SemesterToDb = InferInsertModel<typeof SemesterD>;

export type SemesterQuery = {
  // specialKeys
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
  startTerm?: Date;
  endTerm?: Date;
};

export type SemesterOrderBy = ["startTerm", "endTerm", "year"][number];

export class MSemester extends MEntity implements ISemester {
  static modelName = "Semester";

  name: ISemester["name"];
  startTerm: ISemester["startTerm"];
  endTerm: ISemester["endTerm"];
  year: ISemester["year"];

  constructor(data: ISemester) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): SemesterToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      name: filtered.name,
      startTerm: filtered.startTerm,
      endTerm: filtered.endTerm,
      year: filtered.year,
    };
  }

  static from(result: SemesterFromDb): MSemester {
    return new MSemester({
      id: result.id,
      name: result.name,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
      year: result.year,
    });
  }

  static fieldMap(field: keyof SemesterQuery): MySqlColumnType {
    const fieldMappings: Record<keyof SemesterQuery, MySqlColumnType> = {
      duration: null,
      date: null,
      startTerm: SemesterD.startTerm,
      endTerm: SemesterD.endTerm,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
