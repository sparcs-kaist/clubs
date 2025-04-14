import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { ISemester } from "@clubs/interface/api/semester/type/semester.type";
import {
  filterExcludedFields,
  OperationType,
} from "@clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import {
  makeObjectPropsFromDBTimezone,
  makeObjectPropsToDBTimezone,
} from "@sparcs-clubs/api/common/util/util";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type SemesterFromDb = InferSelectModel<typeof SemesterD>;
export type SemesterToDb = InferInsertModel<typeof SemesterD>;

export type SemesterQuery = {
  startTerm?: Date;
  endTerm?: Date;

  // specialKeys
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
};

export type SemesterOrderBy = ["startTerm", "endTerm", "year"][number];

/**
 * @description Semester 모델
 * @description 항상 모든 날짜에 대해 하나의 Semester가 존재합니다.
 * @description 최상위 기본단위입니다.
 * @description 현재 구현상 학기 추가 시 학기 추가 전 학기의 끝날짜와 새로 추가되는 학기의 시작날짜가 같아야 합니다.
 */

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
    const adjusted = makeObjectPropsToDBTimezone(filtered);
    return {
      ...adjusted,
    };
  }

  static from(result: SemesterFromDb): MSemester {
    const adjusted = makeObjectPropsFromDBTimezone(result);
    return new MSemester({
      id: adjusted.id,
      name: adjusted.name,
      startTerm: adjusted.startTerm,
      endTerm: adjusted.endTerm,
      year: adjusted.year,
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
