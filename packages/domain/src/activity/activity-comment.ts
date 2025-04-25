import z from "zod";

import { zId } from "../common/id";
import { zExtractId } from "../common/utils";
import { zExecutive } from "../user/executive";
import { ActivityStatusEnum, zActivity } from "./activity";

export const zActivityComment = z.object({
  id: zId,
  activityId: zExtractId(zActivity),
  content: z.string(),
  activityStatusEnum: z.nativeEnum(ActivityStatusEnum),
  createdAt: z.coerce.date(),
  executive: zExtractId(zExecutive),
});

export type IActivityComment = z.infer<typeof zActivityComment>;
