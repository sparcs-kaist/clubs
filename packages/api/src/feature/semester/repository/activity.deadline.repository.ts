import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import {
  IActivityDeadlineCreate,
  MActivityDeadline,
} from "@sparcs-clubs/api/feature/semester/model/activity.deadline.model";

export type ActivityDeadlineQuery = {
  semesterId: number;
  date: Date;
  deadlineEnum: ActivityDeadlineEnum;
};

type ActivityDeadlineOrderByKeys = "id" | "startTerm" | "endTerm";
type ActivityDeadlineQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type ActivityDeadlineFieldMapKeys = BaseTableFieldMapKeys<
  ActivityDeadlineQuery,
  ActivityDeadlineOrderByKeys,
  ActivityDeadlineQuerySupport
>;

@Injectable()
export class ActivityDeadlineRepository extends BaseSingleTableRepository<
  MActivityDeadline,
  IActivityDeadlineCreate,
  ActivityDeadlineQuery,
  ActivityDeadlineOrderByKeys,
  ActivityDeadlineQuerySupport
> {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("activityDeadlineD", MActivityDeadline);
  }

  async createActivityDeadline(
    activityDeadline: IActivityDeadlineCreate,
  ): Promise<MActivityDeadline> {
    const result = await this.txHost.tx.activityDeadlineD.create({
      data: this.createToDB(activityDeadline),
    });

    return this.dbToModel(result);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MActivityDeadline {
    return new MActivityDeadline({
      id: result.id,
      semester: { id: result.semesterId },
      deadlineEnum: result.deadlineEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MActivityDeadline): any {
    return {
      id: model.id,
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IActivityDeadlineCreate): any {
    return {
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: ActivityDeadlineFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<ActivityDeadlineFieldMapKeys, string | null> = {
      id: "id",
      semesterId: "semesterId",
      deadlineEnum: "deadlineEnum",
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
    key: ActivityDeadlineFieldMapKeys,
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
