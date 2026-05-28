export type ActivityTermRange = {
  startTerm: Date;
  endTerm: Date;
};

export type ActivityWithDurations = {
  durations: ActivityTermRange[];
};

export const hasActivityTermOutOfRange = (
  activities: ActivityWithDurations[],
  activityDuration: ActivityTermRange,
): boolean => {
  const activityTerms = activities.flatMap(activity => activity.durations);

  return activityTerms.some(
    duration =>
      duration.startTerm < activityDuration.startTerm ||
      duration.endTerm > activityDuration.endTerm,
  );
};
