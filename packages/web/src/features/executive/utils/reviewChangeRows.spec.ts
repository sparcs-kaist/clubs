import assert from "node:assert/strict";
import { describe, it } from "node:test";

import getReviewChangeRows from "./reviewChangeRows";

const duration = {
  startTerm: "2026-11-19T15:00:00.000Z",
  endTerm: "2026-11-20T14:59:59.000Z",
};

const getDurationRow = (before: unknown[], after: unknown[]) =>
  getReviewChangeRows(
    "activity",
    { durations: before },
    { durations: after },
  )[0];

describe("review change history duration comparison", () => {
  it("ignores recreated database rows when only the report content changed", () => {
    const rows = getReviewChangeRows(
      "activity",
      {
        durations: [
          {
            ...duration,
            id: 1,
            activityId: 8681,
            createdAt: "2026-11-23T00:00:00.000Z",
            deletedAt: null,
          },
        ],
        detail: "수정 전 활동 내용",
      },
      {
        durations: [
          {
            ...duration,
            id: 2,
            activityId: 8681,
            createdAt: "2026-11-23T01:00:00.000Z",
            deletedAt: null,
          },
        ],
        detail: "수정 후 활동 내용",
      },
    );

    const durationRow = rows.find(row => row.key === "durations");
    assert.ok(durationRow);
    assert.equal(durationRow.before, durationRow.after);
    assert.equal(durationRow.changed, false);
    assert.deepEqual(
      rows.filter(row => row.changed).map(row => row.key),
      ["detail"],
    );
  });

  it("compares equivalent timestamp representations as the same period", () => {
    const row = getDurationRow(
      [duration],
      [
        {
          startTerm: "2026-11-20T00:00:00+09:00",
          endTerm: "2026-11-20T23:59:59+09:00",
        },
      ],
    );

    assert.equal(row.changed, false);
  });

  it("detects changes to either timestamp even within the same displayed date", () => {
    [
      { ...duration, startTerm: "2026-11-19T16:00:00.000Z" },
      { ...duration, endTerm: "2026-11-20T13:59:59.000Z" },
    ].forEach(changedDuration => {
      const row = getDurationRow([duration], [changedDuration]);

      assert.equal(row.before, row.after);
      assert.equal(row.changed, true);
    });
  });

  it("detects added, removed and reordered periods", () => {
    const secondDuration = {
      startTerm: "2026-11-20T15:00:00.000Z",
      endTerm: "2026-11-21T14:59:59.000Z",
    };

    assert.equal(
      getDurationRow([duration], [duration, secondDuration]).changed,
      true,
    );
    assert.equal(
      getDurationRow([duration, secondDuration], [duration]).changed,
      true,
    );
    assert.equal(
      getDurationRow([duration, secondDuration], [secondDuration, duration])
        .changed,
      true,
    );
  });

  it("preserves comparison of unrelated funding fields", () => {
    const rows = getReviewChangeRows(
      "funding",
      { expenditureAmount: 50_000, fixture: { name: "비품 A", number: 1 } },
      { expenditureAmount: 60_000, fixture: { name: "비품 A", number: 2 } },
    );

    assert.deepEqual(
      rows.filter(row => row.changed).map(row => row.key),
      ["expenditureAmount", "fixture.number"],
    );
  });
});
