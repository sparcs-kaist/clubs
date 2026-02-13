import { Injectable } from "@nestjs/common";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  IStudentCreate,
  MStudent,
} from "@sparcs-clubs/api/feature/user/model/student.model";

export type StudentQuery = {};

type StudentOrderByKeys = "id";
type StudentQuerySupport = {};

type StudentFieldMapKeys = BaseTableFieldMapKeys<
  StudentQuery,
  StudentOrderByKeys,
  StudentQuerySupport
>;

@Injectable()
export class StudentRepository extends BaseSingleTableRepository<
  MStudent,
  IStudentCreate,
  StudentQuery,
  StudentOrderByKeys,
  StudentQuerySupport
> {
  constructor() {
    super("student", MStudent);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MStudent {
    return new MStudent({
      id: result.id,
      name: result.name,
      studentNumber: String(result.number),
      userId: result.userId,
      email: result.email,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MStudent): any {
    return {
      id: model.id,
      name: model.name,
      number: Number(model.studentNumber),
      userId: model.userId,
      email: model.email,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IStudentCreate): any {
    return {
      name: model.name,
      number: Number(model.studentNumber),
      userId: model.userId,
      email: model.email,
    };
  }

  protected fieldMap(field: StudentFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<StudentFieldMapKeys, string | null> = {
      id: "id",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
