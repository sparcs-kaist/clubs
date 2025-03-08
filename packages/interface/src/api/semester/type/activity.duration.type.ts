import { z } from "zod";

import { zId } from "@sparcs-clubs/interface/common/type/id.type";

export const zActivityDuration = z.object({
  id: zId,
  year: z.coerce.number().int().min(1),
  name: z.string().max(10).min(1),
  startTerm: z.date(),
  endTerm: z.date(),
});

export type IActivityDuration = z.infer<typeof zActivityDuration>;
