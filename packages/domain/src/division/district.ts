import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

export const zDistrict = z.object({
  id: zId,
  name: z.string().max(10).min(1),
});

export type IDistrict = z.infer<typeof zDistrict>;
