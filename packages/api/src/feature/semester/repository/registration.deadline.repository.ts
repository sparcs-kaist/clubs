import { Injectable } from "@nestjs/common";
import {
  and,
  gte,
  InferInsertModel,
  InferSelectModel,
  lt,
  SQL,
} from "drizzle-orm";

import {
  IRegistrationDeadline,
  RegistrationDeadlineEnum,
} from "@clubs/domain/semester/deadline";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { RegistrationDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import { MRegistrationDeadline } from "@sparcs-clubs/api/feature/semester/model/registration.deadline.model";

type RegistrationDeadlineQuery = {
  semesterId: number;
  date: Date;
  deadlineEnum: RegistrationDeadlineEnum;
};

type RegistrationDeadlineOrderByKeys = "id";
type RegistrationDeadlineQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type RegistrationDeadlineTable = typeof RegistrationDeadlineD;
type RegistrationDeadlineDbSelect = InferSelectModel<RegistrationDeadlineTable>;
type RegistrationDeadlineDbInsert = InferInsertModel<RegistrationDeadlineTable>;
type RegistrationDeadlineDbUpdate = Partial<RegistrationDeadlineDbInsert>;

type RegistrationDeadlineFieldMapKeys = BaseTableFieldMapKeys<
  RegistrationDeadlineQuery,
  RegistrationDeadlineOrderByKeys,
  RegistrationDeadlineQuerySupport
>;

@Injectable()
export default class RegistrationDeadlineRepository extends BaseSingleTableRepository<
  MRegistrationDeadline,
  IRegistrationDeadline,
  RegistrationDeadlineTable,
  RegistrationDeadlineDbSelect,
  RegistrationDeadlineDbInsert,
  RegistrationDeadlineDbUpdate,
  RegistrationDeadlineQuery,
  RegistrationDeadlineOrderByKeys,
  RegistrationDeadlineQuerySupport
> {
  constructor() {
    super(RegistrationDeadlineD, MRegistrationDeadline);
  }

  protected dbToModelMapping(
    result: RegistrationDeadlineDbSelect,
  ): MRegistrationDeadline {
    return new MRegistrationDeadline({
      id: result.id,
      semester: { id: result.semesterId },
      deadlineEnum: result.deadlineEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(
    model: MRegistrationDeadline,
  ): RegistrationDeadlineDbUpdate {
    return {
      id: model.id,
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: RegistrationDeadlineFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      RegistrationDeadlineFieldMapKeys,
      TableWithID | null
    > = {
      id: RegistrationDeadlineD,
      semesterId: RegistrationDeadlineD,
      deadlineEnum: RegistrationDeadlineD,
      startTerm: RegistrationDeadlineD,
      endTerm: RegistrationDeadlineD,
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }

  protected processSpecialCondition(
    key: RegistrationDeadlineFieldMapKeys,
    value: PrimitiveConditionValue,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      return and(
        gte(RegistrationDeadlineD.startTerm, value),
        lt(RegistrationDeadlineD.endTerm, value),
      );
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
