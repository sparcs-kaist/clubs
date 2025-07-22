import { Injectable } from "@nestjs/common";

import {
  BaseMultiTableRepository,
  MultiInsertModel,
  MultiSelectModel,
  MultiUpdateModel,
} from "@sparcs-clubs/api/common/base/base.multi.repository";
import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import {
  Professor,
  ProfessorT,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";
import {
  IProfessorCreate,
  MProfessor,
} from "@sparcs-clubs/api/feature/user/model/professor.model";

export type ProfessorQuery = {
  userId: number;
  email: string;
};

type ProfessorOrderByKeys = "id";
type ProfessorQuerySupport = {};

type ProfessorTable = {
  main: typeof Professor;
  oneToOne: {
    professorT: typeof ProfessorT;
  };
  oneToMany: {};
};
type ProfessorDbSelect = MultiSelectModel<ProfessorTable>;
type ProfessorDbUpdate = MultiUpdateModel<ProfessorTable>;
type ProfessorDbInsert = MultiInsertModel<ProfessorTable, "professorId">;

type ProfessorFieldMapKeys = BaseTableFieldMapKeys<
  ProfessorQuery,
  ProfessorOrderByKeys,
  ProfessorQuerySupport
>;

@Injectable()
export class ProfessorRepository extends BaseMultiTableRepository<
  MProfessor,
  IProfessorCreate,
  "professorId",
  ProfessorTable,
  ProfessorQuery,
  ProfessorOrderByKeys,
  ProfessorQuerySupport
> {
  constructor() {
    super(
      {
        main: Professor,
        oneToOne: {
          professorT: ProfessorT,
        },
        oneToMany: {},
      },
      MProfessor,
      "professorId",
    );
  }
  protected dbToModelMapping(result: ProfessorDbSelect): MProfessor {
    return new MProfessor({
      id: result.main.id,
      userId: result.main.userId,
      name: result.main.name,
      email: result.main.email,
      professorEnum: result.oneToOne.professorT.professorEnum,
      department: result.oneToOne.professorT.department,
    });
  }

  protected modelToDBMapping(model: MProfessor): ProfessorDbUpdate {
    return {
      main: {
        id: model.id,
        userId: model.userId,
        name: model.name,
        email: model.email,
      },
      oneToOne: {
        professorT: {
          id: model.id,
          professorId: model.id,
          professorEnum: model.professorEnum,
          department: model.department,
        },
      },
      oneToMany: {},
    };
  }

  protected createToDBMapping(model: IProfessorCreate): ProfessorDbInsert {
    return {
      main: {
        userId: model.userId,
        name: model.name,
        email: model.email,
      },
      oneToOne: {
        professorT: {
          startTerm: new Date(),
          //   professorEnum: model.professorEnum,
          //   department: model.department,
        },
      },
      oneToMany: {},
    };
  }

  protected fieldMap(
    field: ProfessorFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<ProfessorFieldMapKeys, TableWithID | null> = {
      id: Professor,
      userId: Professor,
      email: Professor,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
