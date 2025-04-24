import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

export const zNotice = z.object({
  id: zId,
  title: z.string(),
  author: z.string(),
  date: z.date(),
  link: z.string(),
  createdAt: z.date(),
  articleId: z.number(),
});

export const zNoticeResponse = zNotice;

export const zNoticeCreate = zNotice.omit({
  id: true,
  createdAt: true,
});

export const zNoticeUpdate = zNotice;

export type INotice = z.infer<typeof zNotice>;
export type INoticeResponse = z.infer<typeof zNoticeResponse>;
export type INoticeCreate = z.infer<typeof zNoticeCreate>;
export type INoticeUpdate = z.infer<typeof zNoticeUpdate>;
