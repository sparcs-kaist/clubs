import { HttpException, HttpStatus } from "@nestjs/common";

export const ACTIVITY_DURATION_OUT_OF_TARGET_ERROR =
  "Some duration is not in the last activity duration";
export const ACTIVITY_DURATION_FUTURE_ERROR =
  "Activity duration cannot include future dates";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type ActivityDurationRange = {
  startTerm: Date;
  endTerm: Date;
};

export const getKstEndOfToday = (now = new Date()): Date => {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);

  return new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
      14,
      59,
      59,
      999,
    ),
  );
};

export const getActivityDurationValidationError = (
  durations: ActivityDurationRange[],
  activityD: ActivityDurationRange,
  now = new Date(),
): string | null => {
  const hasOutOfTargetDuration = durations.some(
    duration =>
      duration.startTerm > duration.endTerm ||
      duration.startTerm < activityD.startTerm ||
      duration.endTerm > activityD.endTerm,
  );

  if (hasOutOfTargetDuration) {
    return ACTIVITY_DURATION_OUT_OF_TARGET_ERROR;
  }

  const todayEndTerm = getKstEndOfToday(now);
  const hasFutureDuration = durations.some(
    duration => duration.endTerm > todayEndTerm,
  );

  return hasFutureDuration ? ACTIVITY_DURATION_FUTURE_ERROR : null;
};

export const assertActivityDurationsAreSubmittable = (
  durations: ActivityDurationRange[],
  activityD: ActivityDurationRange,
): void => {
  const errorMessage = getActivityDurationValidationError(durations, activityD);

  if (errorMessage !== null) {
    throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
  }
};
