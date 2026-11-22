import assert from "node:assert/strict";
import test from "node:test";

import { isClubRegistrationOpen } from "@clubs/interface/api/registration/endpoint/apiReg027";

test("accepts the registration start and closes the menu at the deadline", () => {
  const startDate = new Date("2026-09-01T00:00:00Z");
  const endTerm = new Date("2026-09-11T09:00:00Z");
  const period = { startDate, endTerm };

  assert.equal(isClubRegistrationOpen(null, +startDate), false);
  assert.equal(isClubRegistrationOpen(period, +startDate - 1), false);
  assert.equal(isClubRegistrationOpen(period, +startDate), true);
  assert.equal(isClubRegistrationOpen(period, +endTerm - 1), true);
  assert.equal(isClubRegistrationOpen(period, +endTerm), false);
});
