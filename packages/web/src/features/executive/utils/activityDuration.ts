import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

import type { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";

type ActivityDuration = ApiSem012ResponseOK["activityDurations"][number];

const formatActivityDurationSemesterName = (
  activityDuration: Pick<ActivityDuration, "year" | "name">,
) => `${activityDuration.year}년 ${activityDuration.name}`;

const filterRegularActivityDurations = (
  activityDurations: ActivityDuration[],
) =>
  activityDurations.filter(
    activityDuration =>
      activityDuration.activityDurationTypeEnum ===
      ActivityDurationTypeEnum.Regular,
  );

export { filterRegularActivityDurations, formatActivityDurationSemesterName };
export type { ActivityDuration };
