import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { groupFundingDeadlinesByActivityDuration } from "./groupFundingDeadlines.ts";

describe("groupFundingDeadlinesByActivityDuration", () => {
  it("groups one funding deadline response by activity duration id", () => {
    const activityDurations = [
      {
        id: 1,
        semester: { id: 10, name: "봄", year: 2026 },
        activityDurationTypeEnum: 1,
        year: 2026,
        name: "겨울-봄",
        startTerm: new Date("2026-01-01"),
        endTerm: new Date("2026-06-01"),
      },
      {
        id: 2,
        semester: { id: 11, name: "가을", year: 2026 },
        activityDurationTypeEnum: 1,
        year: 2026,
        name: "여름-가을",
        startTerm: new Date("2026-06-01"),
        endTerm: new Date("2026-12-01"),
      },
    ];
    const deadlines = [
      {
        id: 101,
        semesterId: 10,
        activityDId: 1,
        deadlineEnum: 1,
        startTerm: new Date("2026-01-05"),
        endTerm: new Date("2026-01-10"),
      },
      {
        id: 102,
        semesterId: 11,
        activityDId: 2,
        deadlineEnum: 2,
        startTerm: new Date("2026-06-05"),
        endTerm: new Date("2026-06-10"),
      },
    ];

    const grouped = groupFundingDeadlinesByActivityDuration(
      activityDurations,
      deadlines,
    );

    assert.deepEqual(
      grouped.map(({ activityDuration, fundingDeadlines }) => ({
        activityDId: activityDuration.id,
        deadlineIds: fundingDeadlines.deadlines.map(deadline => deadline.id),
      })),
      [
        { activityDId: 2, deadlineIds: [102] },
        { activityDId: 1, deadlineIds: [101] },
      ],
    );
  });
});
