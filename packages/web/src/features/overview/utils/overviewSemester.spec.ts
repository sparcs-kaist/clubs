import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isOverviewSelectableSemester } from "./overviewSemester.ts";

describe("isOverviewSelectableSemester", () => {
  it("only shows semesters from 2024 spring onward", () => {
    assert.equal(
      isOverviewSelectableSemester({ year: 2023, name: "가을" }),
      false,
    );
    assert.equal(
      isOverviewSelectableSemester({ year: 2024, name: "봄" }),
      true,
    );
    assert.equal(
      isOverviewSelectableSemester({ year: 2024, name: "가을" }),
      true,
    );
    assert.equal(
      isOverviewSelectableSemester({ year: 2025, name: "봄" }),
      true,
    );
  });
});
