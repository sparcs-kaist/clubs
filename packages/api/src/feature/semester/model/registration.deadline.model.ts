import { IRegistrationDeadline } from "@clubs/domain/semester/deadline";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export class MRegistrationDeadline
  extends MEntity<IRegistrationDeadline>
  implements IRegistrationDeadline
{
  static modelName = "RegistrationDeadline";

  semester: IRegistrationDeadline["semester"];
  deadlineEnum: IRegistrationDeadline["deadlineEnum"];
  startTerm: IRegistrationDeadline["startTerm"];
  endTerm: IRegistrationDeadline["endTerm"];

  constructor(data: IRegistrationDeadline) {
    super(data);
  }
}
