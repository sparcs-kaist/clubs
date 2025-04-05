import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IActivityDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";
import { ISemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";
import {
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { ActivityDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type FromDb = InferSelectModel<typeof ActivityDeadlineD>;
export type ToDb = InferInsertModel<typeof ActivityDeadlineD>;

export type ActivityDeadlineQuery = {
  deadlineEnum: number;
  semesterId: number;
  startDate: Date;
  endDate: Date;
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
};

export class MActivityDeadline extends MEntity implements IActivityDeadline {
  static modelName = "ActivityDeadline";

  semester: ISemester;
  deadlineEnum: IActivityDeadline["deadlineEnum"];
  startDate: IActivityDeadline["startDate"];
  endDate: IActivityDeadline["endDate"];

  constructor(data: IActivityDeadline) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): ToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      semesterId: filtered.semester.id,
      deadlineEnum: filtered.deadlineEnum,
      startDate: filtered.startDate,
      endDate: filtered.endDate,
    } as ToDb;
  }

  static from(data: FromDb): MActivityDeadline {
    return new MActivityDeadline({
      ...data,
      deadlineEnum: data.deadlineEnum,
      semester: { id: data.semesterId },
    });
  }

  static fieldMap(field: keyof ActivityDeadlineQuery): MySqlColumnType {
    const fieldMappings: Record<keyof ActivityDeadlineQuery, MySqlColumnType> =
      {
        deadlineEnum: ActivityDeadlineD.deadlineEnum,
        semesterId: ActivityDeadlineD.semesterId,
        startDate: ActivityDeadlineD.startDate,
        endDate: ActivityDeadlineD.endDate,
        date: null,
      };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
