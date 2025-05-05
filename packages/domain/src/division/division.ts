import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

import { zDistrict } from "../club/division";
import { zExtractId } from "../common/utils";

export const zDivision = z.object({
  id: zId,
  name: z.string().max(255).min(1),
  district: zExtractId(zDistrict),
  startTerm: z.coerce.date(),
  endTerm: z.coerce.date().nullable(),
});

export type IDivision = z.infer<typeof zDivision>;
