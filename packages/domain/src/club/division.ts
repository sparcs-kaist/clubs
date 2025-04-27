import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

extendZodWithOpenApi(z);

export const zDistrict = z.object({
  id: zId,
  name: z.string().max(255).min(1),
});

export const zDivision = z.object({
  id: zId,
  name: z.string().max(255).min(1),
  district: zDistrict.pick({ id: true }),
  startTerm: z.coerce.date(),
  endTerm: z.coerce.date().nullable(),
});

export type IDistrict = z.infer<typeof zDistrict>;
export type IDivision = z.infer<typeof zDivision>;
