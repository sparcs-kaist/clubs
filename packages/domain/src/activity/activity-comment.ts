import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zDbText } from "@clubs/domain/common/string";
import { zExtractId } from "@clubs/domain/common/utils";
import { zExecutive } from "@clubs/domain/user/executive";

import { ActivityStatusEnum, zActivity } from "./activity";

extendZodWithOpenApi(z);

export const zActivityComment = z.object({
  id: zId,
  activity: zExtractId(zActivity),
  content: zDbText,
  activityStatusEnum: z.nativeEnum(ActivityStatusEnum),
  createdAt: z.coerce.date(),
  executive: zExtractId(zExecutive),
});

export type IActivityComment = z.infer<typeof zActivityComment>;
