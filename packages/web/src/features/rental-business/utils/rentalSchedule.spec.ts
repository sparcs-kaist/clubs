import assert from "node:assert/strict";
import { it } from "node:test";

import {
  addRentalDays,
  isSameRentalSlot,
  rentalSlotSelection,
} from "./rentalSchedule.ts";

const saved = {
  date: "2026-11-16",
  opensAt: "2026-11-16T12:00:00.000Z",
  closesAt: "2026-11-16T13:00:00.000Z",
};

it("distinguishes changes to either time on the same office date", () => {
  assert.equal(isSameRentalSlot(saved, { ...saved }), true);
  assert.equal(
    isSameRentalSlot(saved, {
      ...saved,
      opensAt: "2026-11-16T11:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    isSameRentalSlot(saved, {
      ...saved,
      closesAt: "2026-11-16T14:00:00.000Z",
    }),
    false,
  );
});

it("sends only the displayed date and times for a rental slot", () => {
  const available = { ...saved, availableQuantity: 2 };
  assert.deepEqual(rentalSlotSelection(available), saved);
});

it("keeps configurable date arithmetic within the supported calendar", () => {
  assert.equal(addRentalDays("2026-11-23", 7), "2026-11-30");
  assert.equal(addRentalDays("9999-12-30", 14), "9999-12-31");
  assert.equal(addRentalDays("2026-11-23", 4294967295), "9999-12-31");
});
