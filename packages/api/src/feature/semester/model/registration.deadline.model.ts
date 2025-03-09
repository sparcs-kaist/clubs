import { asc, desc, InferSelectModel, SQL } from "drizzle-orm";

import { IRegistrationDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";

import { RegistrationDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import { OrderByTypeEnum } from "./semester.model";

type RegistrationDeadlineDBResult = InferSelectModel<
  typeof RegistrationDeadlineD
>;

const orderByFieldMap = {
  startTerm: RegistrationDeadlineD.startDate,
  endTerm: RegistrationDeadlineD.endDate,
};

export type IRegistrationDeadlineOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

export class MRegistrationDeadline implements IRegistrationDeadline {
  id: IRegistrationDeadline["id"];
  deadlineEnum: IRegistrationDeadline["deadlineEnum"];
  startDate: IRegistrationDeadline["startDate"];
  endDate: IRegistrationDeadline["endDate"];

  constructor(data: IRegistrationDeadline) {
    Object.assign(this, data);
  }

  static from(data: RegistrationDeadlineDBResult): MRegistrationDeadline {
    return new MRegistrationDeadline({
      ...data,
      deadlineEnum: data.registrationDeadlineEnumId,
    });
  }

  static makeOrderBy(orderBy: IRegistrationDeadlineOrderBy): SQL[] {
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
