import { Injectable } from "@nestjs/common";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
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

type NoticeFieldMapKeys = BaseTableFieldMapKeys<
  NoticeQuery,
  NoticeOrderByKeys,
  NoticeQuerySupport
>;

@Injectable()
export class NoticeRepository extends BaseSingleTableRepository<
  MNotice,
  INoticeCreate,
  NoticeQuery,
  NoticeOrderByKeys,
  NoticeQuerySupport
> {
  constructor() {
    super("notice", MNotice);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MNotice {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MNotice): any {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: INoticeCreate): any {
    return {
      date: model.date,
      author: model.author,
      createdAt: model.createdAt,
      link: model.link,
      title: model.title,
      articleId: model.articleId,
    };
  }

  protected fieldMap(field: NoticeFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<NoticeFieldMapKeys, string | null> = {
      id: "id",
      author: "author",
      createdAt: "createdAt",
      title: "title",
      date: "date",
      articleId: "articleId",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
