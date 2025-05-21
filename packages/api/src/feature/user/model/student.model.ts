import { IStudent } from "@clubs/domain/user/student";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IStudentCreate {
  name: IStudent["name"];
  studentNumber: IStudent["studentNumber"];
  userId?: IStudent["userId"];
  email?: IStudent["email"];
  phoneNumber?: IStudent["phoneNumber"];
}

export class MStudent extends MEntity implements IStudent {
  name: IStudent["name"];
  studentNumber: IStudent["studentNumber"];
  userId?: IStudent["userId"];
  email?: IStudent["email"];
  phoneNumber?: IStudent["phoneNumber"];

  constructor(data: IStudent) {
    super();
    Object.assign(this, data);
  }
}
