import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IRegistrationDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";
import {
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import { RegistrationDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type RegistrationDeadlineFromDb = InferSelectModel<
  typeof RegistrationDeadlineD
>;
export type RegistrationDeadlineToDb = InferInsertModel<
  typeof RegistrationDeadlineD
>;

export type RegistrationDeadlineQuery = {
  deadlineEnum?: number;
  semesterId?: number;
  // specialKeys
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
};

export class MRegistrationDeadline
  extends MEntity
  implements IRegistrationDeadline
{
  static modelName = "RegistrationDeadline";

  semester: IRegistrationDeadline["semester"];
  deadlineEnum: IRegistrationDeadline["deadlineEnum"];
  startTerm: IRegistrationDeadline["startTerm"];
  endTerm: IRegistrationDeadline["endTerm"];

  constructor(data: IRegistrationDeadline) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): RegistrationDeadlineToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      registrationDeadlineEnum: filtered.deadlineEnum,
      semesterId: filtered.semester.id,
      startTerm: filtered.startTerm,
      endTerm: filtered.endTerm,
    };
  }

  static from(data: RegistrationDeadlineFromDb): MRegistrationDeadline {
    return new MRegistrationDeadline({
      ...data,
      deadlineEnum: data.registrationDeadlineEnum,
      semester: { id: data.semesterId },
    });
  }

  static fieldMap(field: keyof RegistrationDeadlineQuery): MySqlColumnType {
    const fieldMappings: Record<
      keyof RegistrationDeadlineQuery,
      MySqlColumnType
    > = {
      deadlineEnum: RegistrationDeadlineD.registrationDeadlineEnum,
      semesterId: RegistrationDeadlineD.semesterId,
      duration: null,
      date: null,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
