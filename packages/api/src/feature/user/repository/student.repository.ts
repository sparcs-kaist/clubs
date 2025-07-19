import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { Student } from "@sparcs-clubs/api/drizzle/schema/user.schema";
import {
  IStudentCreate,
  MStudent,
} from "@sparcs-clubs/api/feature/user/model/student.model";

export type StudentQuery = {};

type StudentOrderByKeys = "id";
type StudentQuerySupport = {};

type StudentTable = typeof Student;
type StudentDbSelect = InferSelectModel<StudentTable>;
type StudentDbUpdate = Partial<StudentDbSelect>;
type StudentDbInsert = InferInsertModel<StudentTable>;

type StudentFieldMapKeys = BaseTableFieldMapKeys<
  StudentQuery,
  StudentOrderByKeys,
  StudentQuerySupport
>;

@Injectable()
export class StudentRepository extends BaseSingleTableRepository<
  MStudent,
  IStudentCreate,
  StudentTable,
  StudentQuery,
  StudentOrderByKeys,
  StudentQuerySupport
> {
  constructor() {
    super(Student, MStudent);
  }

  protected dbToModelMapping(result: StudentDbSelect): MStudent {
    return new MStudent({
      id: result.id,
      name: result.name,
      studentNumber: String(result.number),
      userId: result.userId,
      email: result.email,
    });
  }

  protected modelToDBMapping(model: MStudent): StudentDbUpdate {
    return {
      id: model.id,
      name: model.name,
      number: Number(model.studentNumber),
      userId: model.userId,
      email: model.email,
    };
  }

  protected createToDBMapping(model: IStudentCreate): StudentDbInsert {
    return {
      name: model.name,
      number: Number(model.studentNumber),
      userId: model.userId,
      email: model.email,
    };
  }

  protected fieldMap(
    field: StudentFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<StudentFieldMapKeys, TableWithID | null> = {
      id: Student,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
