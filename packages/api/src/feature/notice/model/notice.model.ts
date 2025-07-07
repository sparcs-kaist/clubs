import { INotice } from "@clubs/domain/notice/notice";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface INoticeCreate {
  createdAt: INotice["createdAt"];
  author: INotice["author"];
  title: INotice["title"];
  date: INotice["date"];
  link: INotice["link"];
  articleId: INotice["articleId"];
}

export class MNotice extends MEntity implements INotice {
  static modelName = "Notice";

  title!: INotice["title"];
  date!: INotice["date"];
  link!: INotice["link"];
  author!: INotice["author"];
  createdAt!: INotice["createdAt"];
  articleId!: INotice["articleId"] | null;

  constructor(data: INotice) {
    super();
    Object.assign(this, data);
  }
}
