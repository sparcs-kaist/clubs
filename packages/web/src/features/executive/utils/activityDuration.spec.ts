import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatActivityDurationSemesterName } from "./activityDuration.ts";

describe("formatActivityDurationSemesterName", () => {
  it("formats activity duration without the activity duration suffix", () => {
    assert.equal(
      formatActivityDurationSemesterName({
        year: 2026,
        name: "겨울-봄",
      }),
      "2026년 겨울-봄",
    );
  });
});
