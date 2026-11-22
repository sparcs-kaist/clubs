import assert from "node:assert/strict";
import { it } from "node:test";

import { rentalQuantityState } from "./rentalQuantity.ts";

const slot = {
  availableQuantity: 5,
  requestedQuantity: 2,
  availableWithoutSameDayReturns: 3,
};

it("warns only after pending requests use the remaining approved capacity", () => {
  [1, 3].forEach(quantity => {
    assert.deepEqual(rentalQuantityState(quantity, slot), {
      canRequest: true,
      exceedsAvailable: false,
      waitingForApproval: false,
      dependsOnReturn: false,
    });
  });
  [4, 5].forEach(quantity => {
    assert.deepEqual(rentalQuantityState(quantity, slot), {
      canRequest: true,
      exceedsAvailable: false,
      waitingForApproval: true,
      dependsOnReturn: true,
    });
  });
});

it("blocks excess quantities and suppresses approval and return notices", () => {
  [6, 10].forEach(quantity => {
    assert.deepEqual(rentalQuantityState(quantity, slot), {
      canRequest: false,
      exceedsAvailable: true,
      waitingForApproval: false,
      dependsOnReturn: false,
    });
  });
});

it("does not show queue or same-day notices for invalid quantities", () => {
  [0, -1, 4.5, Number.NaN].forEach(quantity => {
    const state = rentalQuantityState(quantity, slot);
    assert.equal(state.canRequest, false);
    assert.equal(state.waitingForApproval, false);
    assert.equal(state.dependsOnReturn, false);
  });
});

it("handles no pending demand and demand greater than available stock", () => {
  assert.equal(
    rentalQuantityState(5, { ...slot, requestedQuantity: 0 })
      .waitingForApproval,
    false,
  );
  assert.equal(
    rentalQuantityState(1, { ...slot, requestedQuantity: 10 })
      .waitingForApproval,
    true,
  );
  assert.equal(
    rentalQuantityState(1, { ...slot, availableQuantity: 0 }).canRequest,
    false,
  );
});

it("shows the same-day return notice independently of pending demand", () => {
  assert.deepEqual(
    rentalQuantityState(2, {
      ...slot,
      requestedQuantity: 0,
      availableWithoutSameDayReturns: 1,
    }),
    {
      canRequest: true,
      exceedsAvailable: false,
      waitingForApproval: false,
      dependsOnReturn: true,
    },
  );
});
