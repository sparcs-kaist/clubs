import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zId } from "@clubs/domain/common/id";
import { zExtractId } from "@clubs/domain/common/utils";
import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zExecutive } from "@clubs/domain/user/executive";

extendZodWithOpenApi(z);

export const zActivityClubChargedExecutive = z.object({
  id: zId,
  club: zExtractId(zClub),
  activityDuration: zExtractId(zActivityDuration),
  executive: zExtractId(zExecutive),
});

export type IActivityClubChargedExecutive = z.infer<
  typeof zActivityClubChargedExecutive
>;
