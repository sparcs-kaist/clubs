import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const zId = z.coerce.number().int().min(1);
export const zFileId = z.string().max(128);
