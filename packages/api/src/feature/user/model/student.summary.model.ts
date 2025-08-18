import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";

import { MOldStudent } from "./old.student.model";

export class VStudentSummary implements IStudentSummary {
  id!: number;

  userId?: number;

  name!: string;

  studentNumber!: string;

  // 첫 번째 생성자: IStudentSummary로부터 초기화
  constructor(StudentSummary: IStudentSummary);
  // 두 번째 생성자: MOldStudent로부터 초기화
  constructor(Student: MOldStudent);

  constructor(param: IStudentSummary | MOldStudent) {
    if (param instanceof MOldStudent) {
      this.id = param.id;
      this.userId = param.userId;
      this.name = param.name;
      this.studentNumber = param.studentNumber;
    } else {
      Object.assign(this, param);
    }
  }
}
