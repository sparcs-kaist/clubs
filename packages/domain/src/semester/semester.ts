import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

export const zSemester = z.object({
  id: zId,
  name: z.string().max(10),
  year: z.coerce.number().int().min(1),
  startTerm: z.date(),
  endTerm: z.date(),
});

export type ISemester = z.infer<typeof zSemester>;
