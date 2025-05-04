import { IStudent } from "@clubs/interface/api/user/type/user.type";

export class MOldStudent implements IStudent {
  id: number;

  userId?: number;

  studentNumber: string;

  name: string;

  email?: string;

  phoneNumber?: string;

  constructor(student: IStudent) {
    Object.assign(this, student);
  }
}
