import { INotice } from "@clubs/interface/api/notice/type/notice.type";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface INoticeCreate {
  id: INotice["id"]; // ArticleId를 넘겨주기 위해서
  createdAt: INotice["createdAt"];
  author: INotice["author"];
  title: INotice["title"];
  date: INotice["date"];
  link: INotice["link"];
  articleId: INotice["articleId"];
}

export class MNotice extends MEntity implements INotice {
  static modelName = "Notice";

  title: INotice["title"];
  date: INotice["date"];
  link: INotice["link"];
  author: INotice["author"];
  createdAt: INotice["createdAt"];
  articleId: INotice["articleId"];

  constructor(data: INotice) {
    super();
    Object.assign(this, data);
  }
}
