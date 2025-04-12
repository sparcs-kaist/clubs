import { z } from "zod";

import { ActivityDurationTypeEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";
import { zId } from "@sparcs-clubs/interface/common/type/id.type";

import { zSemester } from "./semester.type";

export const zActivityDuration = z.object({
  id: zId,
  semester: zSemester.pick({ id: true }),
  activityDurationTypeEnum: z.nativeEnum(ActivityDurationTypeEnum),
  year: z.coerce.number().int().min(1),
  name: z.string().max(10).min(1),
  startTerm: z.date(),
  endTerm: z.date(),
});

export type IActivityDuration = z.infer<typeof zActivityDuration>;
