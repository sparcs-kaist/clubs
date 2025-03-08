import { InferSelectModel } from "drizzle-orm";

import { IRegistrationDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";

import { RegistrationDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

type RegistrationDeadlineDBResult = InferSelectModel<
  typeof RegistrationDeadlineD
>;

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
      id: data.id,
      startDate: data.startDate,
      endDate: data.endDate,
      deadlineEnum: data.registrationDeadlineEnumId,
    });
  }
}
