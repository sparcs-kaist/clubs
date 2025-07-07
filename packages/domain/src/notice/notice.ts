import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

export const zNotice = z.object({
  id: zId,
  title: z.string(),
  author: z.string(),
  date: z.date(),
  link: z.string(),
  createdAt: z.date(),
  articleId: z.coerce.number().nullable(),
});

export type INotice = z.infer<typeof zNotice>;
