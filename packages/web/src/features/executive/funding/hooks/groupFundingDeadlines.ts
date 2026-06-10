import type { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";
import type { ApiSem016ResponseOk } from "@clubs/interface/api/semester/apiSem016";

type ActivityDuration = ApiSem012ResponseOK["activityDurations"][number];

interface GroupedFundingDeadline {
  activityDuration: ActivityDuration;
  fundingDeadlines: ApiSem016ResponseOk;
}

const groupFundingDeadlinesByActivityDuration = (
  activityDurations: ActivityDuration[],
  deadlines: ApiSem016ResponseOk["deadlines"],
): GroupedFundingDeadline[] => {
  const deadlinesByActivityDId = new Map<
    number,
    ApiSem016ResponseOk["deadlines"]
  >();

  deadlines.forEach(deadline => {
    const existingDeadlines = deadlinesByActivityDId.get(deadline.activityDId);
    if (existingDeadlines) {
      existingDeadlines.push(deadline);
      return;
    }

    deadlinesByActivityDId.set(deadline.activityDId, [deadline]);
  });

  return [...activityDurations]
    .sort((a, b) => b.semester.id - a.semester.id)
    .map(activityDuration => ({
      activityDuration,
      fundingDeadlines: {
        deadlines: deadlinesByActivityDId.get(activityDuration.id) ?? [],
      },
    }));
};

export { groupFundingDeadlinesByActivityDuration };
export type { GroupedFundingDeadline };
