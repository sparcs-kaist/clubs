import { Injectable } from "@nestjs/common";

import {
  BaseMultiTableRepository,
  MultiInsertModel,
  MultiSelectModel,
  MultiUpdateModel,
  PrismaMultiTableConfig,
} from "@sparcs-clubs/api/common/base/base.multi.repository";
import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
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

type ProfessorDbSelect = MultiSelectModel;
type ProfessorDbUpdate = MultiUpdateModel;
type ProfessorDbInsert = MultiInsertModel<unknown, "professorId">;

type ProfessorFieldMapKeys = BaseTableFieldMapKeys<
  ProfessorQuery,
  ProfessorOrderByKeys,
  ProfessorQuerySupport
>;

const professorTableConfig: PrismaMultiTableConfig = {
  main: "professor",
  oneToOne: {
    professorT: {
      prismaModelName: "professorT",
      relationField: "professorTs",
      foreignKey: "professorId",
    },
  },
  oneToMany: {},
};

@Injectable()
export class ProfessorRepository extends BaseMultiTableRepository<
  MProfessor,
  IProfessorCreate,
  "professorId",
  ProfessorQuery,
  ProfessorOrderByKeys,
  ProfessorQuerySupport
> {
  constructor() {
    super(professorTableConfig, MProfessor, "professorId");
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
          startTerm: this.clock.now(),
          //   professorEnum: model.professorEnum,
          //   department: model.department,
        },
      },
      oneToMany: {},
    };
  }

  protected fieldMap(field: ProfessorFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<ProfessorFieldMapKeys, string | null> = {
      id: "id",
      userId: "userId",
      email: "email",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
