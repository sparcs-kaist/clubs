import { hasActivityTermOutOfRange } from "./activity-duration.validator";

describe("activity-duration.validator", () => {
  const activityDuration = {
    startTerm: new Date("2026-03-01T00:00:00.000Z"),
    endTerm: new Date("2026-06-30T14:59:59.999Z"),
  };

  it("allows activity terms inside the activity duration", () => {
    expect(
      hasActivityTermOutOfRange(
        [
          {
            durations: [
              {
                startTerm: new Date("2026-03-01T00:00:00.000Z"),
                endTerm: new Date("2026-05-31T14:59:59.999Z"),
              },
            ],
          },
        ],
        activityDuration,
      ),
    ).toBe(false);
  });

  it("rejects activity terms starting before the activity duration", () => {
    expect(
      hasActivityTermOutOfRange(
        [
          {
            durations: [
              {
                startTerm: new Date("2026-02-28T00:00:00.000Z"),
                endTerm: new Date("2026-05-31T14:59:59.999Z"),
              },
            ],
          },
        ],
        activityDuration,
      ),
    ).toBe(true);
  });

  it("rejects activity terms ending after the activity duration", () => {
    expect(
      hasActivityTermOutOfRange(
        [
          {
            durations: [
              {
                startTerm: new Date("2026-03-01T00:00:00.000Z"),
                endTerm: new Date("2026-07-01T00:00:00.000Z"),
              },
            ],
          },
        ],
        activityDuration,
      ),
    ).toBe(true);
  });

  it("allows activities without terms", () => {
    expect(
      hasActivityTermOutOfRange([{ durations: [] }], activityDuration),
    ).toBe(false);
  });
});
