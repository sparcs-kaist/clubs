import {
  asc,
  desc,
  InferInsertModel,
  InferSelectModel,
  SQL,
} from "drizzle-orm";

import { IActivityDuration } from "@sparcs-clubs/interface/api/semester/type/activity.duration.type";
import { ActivityDurationTypeEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";
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

export type ActivityDurationFromDb = InferSelectModel<typeof ActivityD>;
export type ActivityDurationToDb = InferInsertModel<typeof ActivityD>;

export type ActivityDurationQuery = {
  semesterId?: number;
  startTerm?: Date;
  endTerm?: Date;
  activityDurationTypeEnum?: ActivityDurationTypeEnum;

  // specialKeys
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
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
  semester: IActivityDuration["semester"];
  activityDurationTypeEnum: IActivityDuration["activityDurationTypeEnum"];

  constructor(data: IActivityDuration) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): ActivityDurationToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      semesterId: filtered.semester.id,
      year: filtered.year,
      name: filtered.name,
      startTerm: filtered.startTerm,
      endTerm: filtered.endTerm,
      activityDurationTypeEnum: filtered.activityDurationTypeEnum,
    };
  }

  static from(data: ActivityDurationFromDb): MActivityDuration {
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
        activityDurationTypeEnum: ActivityD.activityDurationTypeEnum,
        duration: null,
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
