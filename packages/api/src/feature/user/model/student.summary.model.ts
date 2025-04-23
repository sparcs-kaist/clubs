import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";

import { MStudent } from "./student.model";

export class VStudentSummary implements IStudentSummary {
  id: number;

  userId?: number;

  name: string;

  studentNumber: string;

  // 첫 번째 생성자: IStudentSummary로부터 초기화
  constructor(StudentSummary: IStudentSummary);
  // 두 번째 생성자: MStudent로부터 초기화
  constructor(Student: MStudent);

  constructor(param: IStudentSummary | MStudent) {
    if (param instanceof MStudent) {
      this.id = param.id;
      this.userId = param.userId;
      this.name = param.name;
      this.studentNumber = param.studentNumber;
    } else {
      Object.assign(this, param);
    }
  }
}
