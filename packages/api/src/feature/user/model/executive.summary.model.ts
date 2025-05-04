import { IExecutiveSummary } from "@clubs/interface/api/user/type/user.type";

import { MExecutive } from "./executive.model";

export class VExecutiveSummary implements IExecutiveSummary {
  id: number;

  userId?: number;

  name: string;

  studentNumber: string;

  // 첫 번째 생성자: IExecutiveSummary로부터 초기화
  constructor(executiveSummary: IExecutiveSummary);
  // 두 번째 생성자: MExecutive로부터 초기화
  constructor(executive: MExecutive);

  constructor(param: IExecutiveSummary | MExecutive) {
    if (param instanceof MExecutive) {
      this.id = param.id;
      this.userId = param.userId;
      this.name = param.name;
      this.studentNumber = param.studentNumber;
    } else {
      Object.assign(this, param);
    }
  }

  static fromDBResult(result: {
    executive: {
      id: number;
      name: string;
      userId: number;
    };
    student: {
      number: number;
    };
  }): VExecutiveSummary {
    return new VExecutiveSummary({
      id: result.executive.id,
      name: result.executive.name,
      studentNumber: result.student.number.toString(),
      userId: result.executive.userId,
    });
  }
}
