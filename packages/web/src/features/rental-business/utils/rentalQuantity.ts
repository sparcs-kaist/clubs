export function rentalQuantityState(
  quantity: number,
  slot: {
    availableQuantity: number;
    requestedQuantity: number;
    availableWithoutSameDayReturns: number;
  },
) {
  const canRequest =
    Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity <= slot.availableQuantity;

  return {
    canRequest,
    exceedsAvailable: quantity > slot.availableQuantity,
    waitingForApproval:
      canRequest &&
      quantity > Math.max(slot.availableQuantity - slot.requestedQuantity, 0),
    dependsOnReturn:
      canRequest && quantity > slot.availableWithoutSameDayReturns,
  };
}
