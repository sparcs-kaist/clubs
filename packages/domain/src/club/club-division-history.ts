import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

import { zClub } from "./club";
import { zDivision } from "./division";

extendZodWithOpenApi(z);

export const zClubDivisionHistory = z.object({
  id: zId.openapi({
    description: "동아리 분과 이력 ID",
    examples: [1, 2, 3],
  }),
  club: z.object({ id: zClub.shape.id }),
  division: z.object({ id: zDivision.shape.id }),
  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

export type IClubDivisionHistory = z.infer<typeof zClubDivisionHistory>;
