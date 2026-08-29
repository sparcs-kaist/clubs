import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getLocalDateLastTime } from "./getKSTDate.ts";

describe("getLocalDateLastTime", () => {
  it("returns 23:59:59 of the KST date", () => {
    const result = getLocalDateLastTime("2024-01-01T15:00:00Z");

    assert.deepEqual(
      [
        result.getFullYear(),
        result.getMonth(),
        result.getDate(),
        result.getHours(),
        result.getMinutes(),
        result.getSeconds(),
        result.getMilliseconds(),
      ],
      [2024, 0, 2, 23, 59, 59, 0],
    );
  });
});
