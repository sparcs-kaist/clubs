import { Injectable } from "@nestjs/common";

import { RegistrationDeadlineEnum } from "@clubs/domain/semester/deadline";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  IRegistrationDeadlineCreate,
  MRegistrationDeadline,
} from "@sparcs-clubs/api/feature/semester/model/registration.deadline.model";

export type RegistrationDeadlineQuery = {
  semesterId: number;
  date: Date;
  deadlineEnum: RegistrationDeadlineEnum;
};

type RegistrationDeadlineOrderByKeys = "id" | "startTerm" | "endTerm";
type RegistrationDeadlineQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type RegistrationDeadlineFieldMapKeys = BaseTableFieldMapKeys<
  RegistrationDeadlineQuery,
  RegistrationDeadlineOrderByKeys,
  RegistrationDeadlineQuerySupport
>;

@Injectable()
export class RegistrationDeadlineRepository extends BaseSingleTableRepository<
  MRegistrationDeadline,
  IRegistrationDeadlineCreate,
  RegistrationDeadlineQuery,
  RegistrationDeadlineOrderByKeys,
  RegistrationDeadlineQuerySupport
> {
  constructor() {
    super("registrationDeadlineD", MRegistrationDeadline);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MRegistrationDeadline {
    return new MRegistrationDeadline({
      id: result.id,
      semester: { id: result.semesterId },
      deadlineEnum: result.deadlineEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MRegistrationDeadline): any {
    return {
      id: model.id,
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IRegistrationDeadlineCreate): any {
    return {
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: RegistrationDeadlineFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<
      RegistrationDeadlineFieldMapKeys,
      string | null
    > = {
      id: "id",
      semesterId: "semesterId",
      deadlineEnum: "deadlineEnum",
      startTerm: "startTerm",
      endTerm: "endTerm",
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }

  protected processSpecialCondition(
    key: RegistrationDeadlineFieldMapKeys,
    value: PrimitiveConditionValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (key === "date" && value instanceof Date) {
      return {
        AND: [{ startTerm: { lte: value } }, { endTerm: { gt: value } }],
      };
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
