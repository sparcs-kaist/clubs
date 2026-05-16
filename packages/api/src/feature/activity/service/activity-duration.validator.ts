import { Inject, Injectable } from "@nestjs/common";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";

export const ACTIVITY_DURATION_OUT_OF_TARGET_ERROR =
  "Some duration is not in the last activity duration";
export const ACTIVITY_DURATION_FUTURE_ERROR =
  "Activity duration cannot include future dates";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type ActivityDurationRange = {
  startTerm: Date;
  endTerm: Date;
};

export type ActivityDurationValidationError =
  | typeof ACTIVITY_DURATION_OUT_OF_TARGET_ERROR
  | typeof ACTIVITY_DURATION_FUTURE_ERROR;

export const getKstEndOfToday = (now: Date): Date => {
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
  now: Date,
): ActivityDurationValidationError | null => {
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

@Injectable()
export class ActivityDurationValidatorService {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  getValidationError(
    durations: ActivityDurationRange[],
    activityD: ActivityDurationRange,
  ): ActivityDurationValidationError | null {
    return getActivityDurationValidationError(
      durations,
      activityD,
      this.clock.now(),
    );
  }
}
