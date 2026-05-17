import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

interface ActivityDurationNameSource {
  year: number;
  name: string;
}

const formatActivityDurationName = (
  activityDuration?: ActivityDurationNameSource | null,
) =>
  activityDuration
    ? `${activityDuration.year}년 ${activityDuration.name}`
    : "-";

export const defaultActivityDuration = {
  id: 0,
  semester: { id: 0 },
  activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
  year: 0,
  name: "",
  startTerm: new Date(0),
  endTerm: new Date(0),
};

export default formatActivityDurationName;
