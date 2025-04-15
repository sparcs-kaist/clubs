import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

extendZodWithOpenApi(z);

export const zSemester = z.object({
  id: zId.openapi({
    description: "학기 ID",
    examples: [15, 16, 17],
  }),
  name: z
    .string()
    .max(10)
    .openapi({
      description: "학기명",
      examples: ["봄", "가을"],
    }),
  year: z.coerce
    .number()
    .int()
    .min(1)
    .openapi({
      description: "년도",
      examples: [2023, 2024],
    }),
  startTerm: z.coerce.date().openapi({
    description: "학기 시작일",
    examples: ["2023-03-01", "2024-09-01"],
  }),
  endTerm: z.coerce.date().openapi({
    description: "학기 종료일",
    examples: ["2023-06-30", "2024-12-31"],
  }),
});

export type ISemester = z.infer<typeof zSemester>;
