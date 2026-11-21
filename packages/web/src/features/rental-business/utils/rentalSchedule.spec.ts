import assert from "node:assert/strict";
import { it } from "node:test";

import { isSameRentalSlot, rentalSlotSelection } from "./rentalSchedule.ts";

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
