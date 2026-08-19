import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

export const zNotice = z.object({
  id: zId,
  title: z.string().max(255),
  author: z.string().max(30),
  date: z.date(),
  link: z.string().max(255),
  createdAt: z.date(),
  articleId: z.coerce.number().nullable(),
});

export type INotice = z.infer<typeof zNotice>;
