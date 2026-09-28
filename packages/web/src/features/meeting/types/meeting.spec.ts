import assert from "node:assert/strict";
import { it } from "node:test";

import { meetingTypeOptions } from "./meeting.ts";

it("keeps all meeting types selectable with their existing numeric IDs", () => {
  assert.deepEqual(meetingTypeOptions, [
    { label: "전체동아리대표자회의", value: 1 },
    { label: "확대운영위원회", value: 2 },
    { label: "운영위원회", value: 3 },
    { label: "분과회의", value: 4 },
  ]);
});
