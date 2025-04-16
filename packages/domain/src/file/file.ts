import { z } from "zod";

import { zFileId } from "../common/id";

export const zFile = z.object({
  id: zFileId,
  name: z.string().max(255),
  extension: z.string().max(30),
  size: z.number(),
  url: z.string(),
  userId: z.coerce.number().min(1),
});

export const zFileSummary = zFile.pick({ id: true, name: true, url: true });

export type IFile = z.infer<typeof zFile>;
export type IFileSummary = z.infer<typeof zFileSummary>;
