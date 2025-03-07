import { z } from "zod";

export const zSemester = z.object({
  id: z.coerce.number().int().min(1),
  name: z.string().max(10),
  year: z.coerce.number().int().min(1),
  startTerm: z.date(),
  endTerm: z.date(),
});

export type ISemester = z.infer<typeof zSemester>;
