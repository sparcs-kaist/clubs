import {
  ACTIVITY_DURATION_FUTURE_ERROR,
  ACTIVITY_DURATION_OUT_OF_TARGET_ERROR,
  getActivityDurationValidationError,
  getKstEndOfToday,
} from "./activity-duration.validator";

describe("activity-duration.validator", () => {
  const activityD = {
    startTerm: new Date("2026-03-01T00:00:00.000Z"),
    endTerm: new Date("2026-06-30T14:59:59.999Z"),
  };

  it("allows durations ending today when the activity duration continues", () => {
    const result = getActivityDurationValidationError(
      [
        {
          startTerm: new Date("2026-05-17T00:00:00.000Z"),
          endTerm: new Date("2026-05-17T14:59:00.000Z"),
        },
      ],
      activityD,
      new Date("2026-05-17T03:00:00.000Z"),
    );

    expect(result).toBeNull();
  });

  it("rejects durations ending after today with a future-date message", () => {
    const result = getActivityDurationValidationError(
      [
        {
          startTerm: new Date("2026-05-17T00:00:00.000Z"),
          endTerm: new Date("2026-05-18T14:59:00.000Z"),
        },
      ],
      activityD,
      new Date("2026-05-17T03:00:00.000Z"),
    );

    expect(result).toBe(ACTIVITY_DURATION_FUTURE_ERROR);
  });

  it("keeps the target-duration message for dates outside ActivityD", () => {
    const result = getActivityDurationValidationError(
      [
        {
          startTerm: new Date("2026-06-30T00:00:00.000Z"),
          endTerm: new Date("2026-07-01T14:59:00.000Z"),
        },
      ],
      activityD,
      new Date("2026-06-29T03:00:00.000Z"),
    );

    expect(result).toBe(ACTIVITY_DURATION_OUT_OF_TARGET_ERROR);
  });

  it("calculates the end of today in KST", () => {
    expect(getKstEndOfToday(new Date("2026-05-17T03:00:00.000Z"))).toEqual(
      new Date("2026-05-17T14:59:59.999Z"),
    );
  });
});
