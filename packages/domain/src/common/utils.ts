import { z } from "zod";

import { zFileId, zId } from "./id";

type ZIdSchema = typeof zId | typeof zFileId;

export type ExtractId<
  T extends z.ZodObject<{ id: ZId }>,
  ZId extends ZIdSchema,
> = z.ZodObject<{
  id: T["shape"]["id"];
}>;

export const zExtractId = <T extends z.ZodObject<{ id: ZIdSchema }>>(
  schema: T,
): ExtractId<T, ZIdSchema> =>
  z.object({
    id: schema.shape.id,
  }) as ExtractId<T, ZIdSchema>;
