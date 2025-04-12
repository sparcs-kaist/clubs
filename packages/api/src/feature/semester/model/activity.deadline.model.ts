import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IActivityDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";
import { ISemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";
import { ActivityDeadlineEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";
import {
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { ActivityDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type ActivityDeadlineFromDb = InferSelectModel<typeof ActivityDeadlineD>;
export type ActivityDeadlineToDb = InferInsertModel<typeof ActivityDeadlineD>;

export type ActivityDeadlineQuery = {
  deadlineEnum?: number;
  semesterId?: number;
  startTerm?: Date;
  endTerm?: Date;

  // specialKeys
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
  deadlineEnums?: ActivityDeadlineEnum[];
};

export class MActivityDeadline extends MEntity implements IActivityDeadline {
  static modelName = "ActivityDeadline";

  semester: ISemester;
  deadlineEnum: IActivityDeadline["deadlineEnum"];
  startTerm: IActivityDeadline["startTerm"];
  endTerm: IActivityDeadline["endTerm"];

  constructor(data: IActivityDeadline) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): ActivityDeadlineToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      semesterId: filtered.semester.id,
      deadlineEnum: filtered.deadlineEnum,
      startTerm: filtered.startTerm,
      endTerm: filtered.endTerm,
    };
  }

  static from(data: ActivityDeadlineFromDb): MActivityDeadline {
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
        deadlineEnums: ActivityDeadlineD.deadlineEnum,
        semesterId: ActivityDeadlineD.semesterId,
        duration: null,
        date: null,
        startTerm: ActivityDeadlineD.startTerm,
        endTerm: ActivityDeadlineD.endTerm,
      };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
