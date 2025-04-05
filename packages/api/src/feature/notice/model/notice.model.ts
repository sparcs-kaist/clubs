import { asc, desc, InferSelectModel, SQL } from "drizzle-orm";

import { INotice } from "@sparcs-clubs/interface/api/notice/type/notice.type";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import { MEntity } from "@sparcs-clubs/api/common/model/entity.model";
import { Notice } from "@sparcs-clubs/api/drizzle/schema/notice.schema";

type NoticeDbResult = InferSelectModel<typeof Notice>;

const orderByFieldMap = {
  createdAt: Notice.createdAt,
};

export type INoticeOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

export class MNotice extends MEntity implements INotice {
  title: INotice["title"];
  author: INotice["author"];
  date: INotice["date"];
  link: INotice["link"];
  createdAt: INotice["createdAt"];
  constructor(data: INotice) {
    super();
    Object.assign(this, data);
  }

  static from(result: NoticeDbResult): MNotice {
    return new MNotice({
      id: result.id,
      title: result.title,
      author: result.author,
      date: result.date,
      link: result.link,
      createdAt: result.createdAt,
    });
  }

  static makeOrderBy(orderBy: INoticeOrderBy): SQL[] {
    return Object.entries(orderBy)
      .filter(
        ([key, orderByType]) =>
          orderByType && orderByFieldMap[key as keyof typeof orderByFieldMap],
      )
      .map(([key, orderByType]) =>
        orderByType === OrderByTypeEnum.ASC
          ? asc(orderByFieldMap[key])
          : desc(orderByFieldMap[key]),
      );
  }
}
