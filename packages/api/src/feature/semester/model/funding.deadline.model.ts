import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IFundingDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";
import {
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type FromDb = InferSelectModel<typeof FundingDeadlineD>;
export type ToDb = InferInsertModel<typeof FundingDeadlineD>;

export type FundingDeadlineQuery = {
  deadlineEnum?: number;
  semesterId?: number;
  startDate?: Date;
  endDate?: Date;
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
};

export class MFundingDeadline extends MEntity implements IFundingDeadline {
  static modelName = "FundingDeadline";

  semester: IFundingDeadline["semester"];
  deadlineEnum: IFundingDeadline["deadlineEnum"];
  startDate: IFundingDeadline["startDate"];
  endDate: IFundingDeadline["endDate"];

  constructor(data: IFundingDeadline) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): ToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      semesterId: filtered.semester.id,
    } as ToDb;
  }

  static from(data: FromDb): MFundingDeadline {
    return new MFundingDeadline({
      ...data,
      semester: { id: data.semesterId },
    });
  }

  static fieldMap(field: keyof FundingDeadlineQuery): MySqlColumnType {
    const fieldMappings: Record<keyof FundingDeadlineQuery, MySqlColumnType> = {
      deadlineEnum: FundingDeadlineD.deadlineEnum,
      semesterId: FundingDeadlineD.semesterId,
      startDate: FundingDeadlineD.startDate,
      endDate: FundingDeadlineD.endDate,
      date: null,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
