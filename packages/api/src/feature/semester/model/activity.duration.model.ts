import {
  asc,
  desc,
  InferInsertModel,
  InferSelectModel,
  SQL,
} from "drizzle-orm";

import { IActivityDuration } from "@sparcs-clubs/interface/api/semester/type/activity.duration.type";
import { ISemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";
import {
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { ActivityD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type FromDb = InferSelectModel<typeof ActivityD>;
export type ToDb = InferInsertModel<typeof ActivityD>;

export type ActivityDurationQuery = {
  semesterId?: number;
  startTerm?: Date;
  endTerm?: Date;
  year?: number;
  activityDurationTypeEnum?: number;
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
};

const orderByFieldMap = {
  startTerm: ActivityD.startTerm,
  endTerm: ActivityD.endTerm,
  year: ActivityD.year,
};

export type IActivityDurationOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

export class MActivityDuration extends MEntity implements IActivityDuration {
  static modelName = "ActivityDuration";

  year: IActivityDuration["year"];
  name: IActivityDuration["name"];
  startTerm: IActivityDuration["startTerm"];
  endTerm: IActivityDuration["endTerm"];
  semester: ISemester;
  activityDurationTypeEnum: IActivityDuration["activityDurationTypeEnum"];

  constructor(data: IActivityDuration) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): ToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      semesterId: filtered.semester.id,
    } as ToDb;
  }

  static from(data: FromDb): MActivityDuration {
    return new MActivityDuration({
      ...data,
      semester: { id: data.semesterId },
    });
  }

  static fieldMap(field: keyof ActivityDurationQuery): MySqlColumnType {
    const fieldMappings: Record<keyof ActivityDurationQuery, MySqlColumnType> =
      {
        semesterId: ActivityD.semesterId,
        startTerm: ActivityD.startTerm,
        endTerm: ActivityD.endTerm,
        year: ActivityD.year,
        activityDurationTypeEnum: ActivityD.activityDurationTypeEnum,
        date: null,
      };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${field}`);
    }
    return fieldMappings[field];
  }

  static makeOrderBy(orderBy: IActivityDurationOrderBy): SQL[] {
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
