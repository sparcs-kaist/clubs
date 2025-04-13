import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IFundingDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";
import { FundingDeadlineEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";
import {
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { makeObjectPropsToDBTimezone } from "@sparcs-clubs/api/common/util/util";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type FundingDeadlineFromDb = InferSelectModel<typeof FundingDeadlineD>;
export type FundingDeadlineToDb = InferInsertModel<typeof FundingDeadlineD>;

export type FundingDeadlineQuery = {
  deadlineEnum?: FundingDeadlineEnum;
  deadlineEnums?: FundingDeadlineEnum[];
  semesterId?: number;
  // specialKeys
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
  startTerm?: Date;
  endTerm?: Date;
};
export class MFundingDeadline extends MEntity implements IFundingDeadline {
  static modelName = "FundingDeadline";

  semester: IFundingDeadline["semester"];
  deadlineEnum: IFundingDeadline["deadlineEnum"];
  startTerm: IFundingDeadline["startTerm"];
  endTerm: IFundingDeadline["endTerm"];

  constructor(data: IFundingDeadline) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): FundingDeadlineToDb {
    const filtered = filterExcludedFields(this, operation);
    const adjusted = makeObjectPropsToDBTimezone(filtered);
    return {
      ...adjusted,
      semesterId: adjusted.semester.id,
    };
  }

  static from(data: FundingDeadlineFromDb): MFundingDeadline {
    return new MFundingDeadline({
      ...data,
      semester: { id: data.semesterId },
    });
  }

  static fieldMap(field: keyof FundingDeadlineQuery): MySqlColumnType {
    const fieldMappings: Record<keyof FundingDeadlineQuery, MySqlColumnType> = {
      deadlineEnum: FundingDeadlineD.deadlineEnum,
      deadlineEnums: FundingDeadlineD.deadlineEnum,
      semesterId: FundingDeadlineD.semesterId,
      duration: null,
      date: null,
      startTerm: FundingDeadlineD.startTerm,
      endTerm: FundingDeadlineD.endTerm,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
