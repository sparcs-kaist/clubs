import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const zReviewChangeHistory = z.array(
  z.object({
    id: z.coerce.number().int().positive(),
    createdAt: z.coerce.date(),
    before: z.record(z.unknown()),
    after: z.record(z.unknown()),
  }),
);

export type ReviewChangeHistory = z.infer<typeof zReviewChangeHistory>;
