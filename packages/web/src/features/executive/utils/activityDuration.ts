import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";

type ActivityDuration = ApiSem012ResponseOK["activityDurations"][number];

const filterRegularActivityDurations = (
  activityDurations: ActivityDuration[],
) =>
  activityDurations.filter(
    activityDuration =>
      activityDuration.activityDurationTypeEnum ===
      ActivityDurationTypeEnum.Regular,
  );

export { filterRegularActivityDurations };
export type { ActivityDuration };
