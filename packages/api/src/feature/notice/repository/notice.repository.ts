import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { Notice } from "@sparcs-clubs/api/drizzle/schema/notice.schema";
import {
  INoticeCreate,
  MNotice,
} from "@sparcs-clubs/api/feature/notice/model/notice.model";

export type NoticeQuery = {
  id: number;
  title: string;
  date: Date;
  createdAt: Date;
  author: string;
  articleId: number;
};

type NoticeOrderByKeys = "id" | "date" | "createdAt" | "articleId";
type NoticeQuerySupport = {};

type NoticeTable = typeof Notice;
type NoticeDbSelect = InferSelectModel<NoticeTable>;
type NoticeDbUpdate = Partial<NoticeDbSelect>;
type NoticeDbInsert = InferInsertModel<NoticeTable>;
type NoticeFieldMapKeys = BaseTableFieldMapKeys<
  NoticeQuery,
  NoticeOrderByKeys,
  NoticeQuerySupport
>;

@Injectable()
export class NoticeRepository extends BaseSingleTableRepository<
  MNotice,
  INoticeCreate,
  NoticeTable,
  NoticeQuery,
  NoticeOrderByKeys,
  NoticeQuerySupport
> {
  constructor() {
    super(Notice, MNotice);
  }

  protected dbToModelMapping(result: NoticeDbSelect): MNotice {
    return {
      date: result.date,
      author: result.author,
      createdAt: result.createdAt,
      id: result.id,
      link: result.link,
      title: result.title,
      articleId: result.articleId,
    };
  }

  protected modelToDBMapping(model: MNotice): NoticeDbUpdate {
    return {
      id: model.id,
      author: model.author,
      createdAt: model.createdAt,
      date: model.date,
      link: model.link,
      title: model.title,
      articleId: model.articleId,
    };
  }

  protected createToDBMapping(model: INoticeCreate): NoticeDbInsert {
    return {
      date: model.date,
      author: model.author,
      createdAt: model.createdAt,
      link: model.link,
      title: model.title,
      articleId: model.articleId,
    };
  }

  protected fieldMap(
    field: NoticeFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<NoticeFieldMapKeys, TableWithID | null> = {
      id: Notice,
      author: Notice,
      createdAt: Notice,
      title: Notice,
      date: Notice,
      articleId: Notice,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
