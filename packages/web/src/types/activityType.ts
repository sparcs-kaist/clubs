import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

import { TagColor } from "@sparcs-clubs/web/common/components/Tag";

const ActivityTypeLabel: Record<ActivityTypeEnum, string> = {
  [ActivityTypeEnum.matchedInternalActivity]:
    "동아리 성격에 합치하는 내부 활동",
  [ActivityTypeEnum.matchedExternalActivity]:
    "동아리 성격에 합치하는 외부 활동",
  [ActivityTypeEnum.notMatchedActivity]: "동아리 성격에 합치하지 않는 활동",
};
export const getActivityTypeLabel = (activityType: ActivityTypeEnum): string =>
  ActivityTypeLabel[activityType];

const ActivityTypeTagColor: Record<ActivityTypeEnum, TagColor> = {
  [ActivityTypeEnum.matchedInternalActivity]: "ORANGE",
  [ActivityTypeEnum.matchedExternalActivity]: "BLUE",
  [ActivityTypeEnum.notMatchedActivity]: "PURPLE",
};
export const getActivityTypeTagColor = (
  activityType: ActivityTypeEnum,
): TagColor => ActivityTypeTagColor[activityType];
