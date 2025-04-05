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

export type FromDb = InferSelectModel<typeof RegistrationDeadlineD>;
export type ToDb = InferInsertModel<typeof RegistrationDeadlineD>;

export type RegistrationDeadlineQuery = {
  deadlineEnum?: number;
  semesterId?: number;
  startDate?: Date;
  endDate?: Date;
  date?: Date; // 특정 시점으로 쿼리할 수 있게 함. specialKeys로 처리
};

export class MRegistrationDeadline
  extends MEntity
  implements IRegistrationDeadline
{
  static modelName = "RegistrationDeadline";

  semester: IRegistrationDeadline["semester"];
  deadlineEnum: IRegistrationDeadline["deadlineEnum"];
  startDate: IRegistrationDeadline["startDate"];
  endDate: IRegistrationDeadline["endDate"];

  constructor(data: IRegistrationDeadline) {
    super();
    Object.assign(this, data);
  }

  to(operation: OperationType): ToDb {
    const filtered = filterExcludedFields(this, operation);

    return {
      semesterId: filtered.semester.id,
    } as ToDb;
  }

  static from(data: FromDb): MRegistrationDeadline {
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
      startDate: RegistrationDeadlineD.startDate,
      endDate: RegistrationDeadlineD.endDate,
      date: null,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
