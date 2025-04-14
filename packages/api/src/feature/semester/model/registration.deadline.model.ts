import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IRegistrationDeadline } from "@clubs/interface/api/semester/type/deadline.type";
import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";
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
import { RegistrationDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type RegistrationDeadlineFromDb = InferSelectModel<
  typeof RegistrationDeadlineD
>;
export type RegistrationDeadlineToDb = InferInsertModel<
  typeof RegistrationDeadlineD
>;

export type RegistrationDeadlineQuery = {
  deadlineEnum?: RegistrationDeadlineEnum;
  deadlineEnums?: RegistrationDeadlineEnum[];
  semesterId?: number;
  startTerm?: Date;
  endTerm?: Date;
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
    const adjusted = makeObjectPropsToDBTimezone(filtered);
    return {
      ...adjusted,
      registrationDeadlineEnum: adjusted.deadlineEnum,
    };
  }

  static from(data: RegistrationDeadlineFromDb): MRegistrationDeadline {
    const adjusted = makeObjectPropsFromDBTimezone(data);
    return new MRegistrationDeadline({
      id: adjusted.id,
      startTerm: adjusted.startTerm,
      endTerm: adjusted.endTerm,
      deadlineEnum: adjusted.registrationDeadlineEnum,
      semester: { id: adjusted.semesterId },
    });
  }

  static fieldMap(field: keyof RegistrationDeadlineQuery): MySqlColumnType {
    const fieldMappings: Record<
      keyof RegistrationDeadlineQuery,
      MySqlColumnType
    > = {
      deadlineEnum: RegistrationDeadlineD.registrationDeadlineEnum,
      deadlineEnums: RegistrationDeadlineD.registrationDeadlineEnum,
      semesterId: RegistrationDeadlineD.semesterId,
      duration: null,
      date: null,
      startTerm: RegistrationDeadlineD.startTerm,
      endTerm: RegistrationDeadlineD.endTerm,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
