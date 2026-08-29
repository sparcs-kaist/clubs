import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import {
  ISemesterCreate,
  MSemester,
} from "@sparcs-clubs/api/feature/semester/model/semester.model";

export type SemesterQuery = { date: Date; endTerm: Date };

type SemesterOrderByKeys = "id" | "year" | "name" | "startTerm" | "endTerm";
type SemesterQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type SemesterFieldMapKeys = BaseTableFieldMapKeys<
  SemesterQuery,
  SemesterOrderByKeys,
  SemesterQuerySupport
>;

@Injectable()
export class SemesterRepository extends BaseSingleTableRepository<
  MSemester,
  ISemesterCreate,
  SemesterQuery,
  SemesterOrderByKeys,
  SemesterQuerySupport
> {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("semesterD", MSemester);
  }

  async createSemester(value: ISemesterCreate): Promise<{ id: number }> {
    const delegate = this.getDelegate(this.txHost.tx);
    const created = await delegate.create({ data: this.createToDB(value) });

    return { id: created.id };
  }

  async updateSemester(
    key: { name: string; year: number },
    value: { startTerm: Date; endTerm: Date },
  ): Promise<{ id: number }> {
    const delegate = this.getDelegate(this.txHost.tx);
    const existing = await delegate.findFirst({
      where: { ...key, deletedAt: null },
    });
    await delegate.updateMany({
      where: { ...key, deletedAt: null },
      data: value,
    });

    return { id: existing.id };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MSemester {
    return new MSemester({
      id: result.id,
      year: result.year,
      name: result.name,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MSemester): any {
    return {
      id: model.id,
      year: model.year,
      name: model.name,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: ISemesterCreate): any {
    return {
      year: model.year,
      name: model.name,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(field: SemesterFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<SemesterFieldMapKeys, string | null> = {
      id: "id",
      year: "year",
      name: "name",
      startTerm: "startTerm",
      endTerm: "endTerm",
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }

  protected processSpecialCondition(
    key: SemesterFieldMapKeys,
    value: PrimitiveConditionValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (key === "date" && value instanceof Date) {
      return {
        AND: [{ startTerm: { lte: value } }, { endTerm: { gt: value } }],
      };
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
