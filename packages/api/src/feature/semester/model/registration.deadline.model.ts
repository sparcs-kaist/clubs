import { IRegistrationDeadline } from "@clubs/domain/semester/deadline";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IRegistrationDeadlineCreate {
  semester: IRegistrationDeadline["semester"];
  deadlineEnum: IRegistrationDeadline["deadlineEnum"];
  startTerm: IRegistrationDeadline["startTerm"];
  endTerm: IRegistrationDeadline["endTerm"];
}

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
}
