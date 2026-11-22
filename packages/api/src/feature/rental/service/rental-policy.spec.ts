import {
  activeRentalStatus,
  addRentalDays,
  beforeSameDayReturns,
  canCancelRental,
  cancellableRentalStatus,
  checkoutQuantity,
  hasSameDayReturn,
  peakReservedQuantity,
  physicalQuantity,
  regularReturnLimit,
  requestedQuantity,
  type ReservedStock,
} from "./rental-policy";

const monday = "2026-11-16";
const tuesday = "2026-11-17";
const wednesday = "2026-11-18";
const thursday = "2026-11-19";

function reservation(
  id: number,
  pickupDate: string,
  returnDate: string,
  quantity: number,
  status = "RESERVED",
): ReservedStock {
  return { id, pickupDate, returnDate, quantity, status };
}

describe("rental period and inventory", () => {
  it("caps the configured office count at the last published shift", () => {
    expect(
      regularReturnLimit(
        { durationType: "OFFICE_HOURS", durationValue: 3 },
        monday,
        [tuesday, wednesday, thursday],
      ),
    ).toBe(thursday);
    expect(
      regularReturnLimit(
        { durationType: "OFFICE_HOURS", durationValue: 3 },
        monday,
        [wednesday, thursday],
      ),
    ).toBe(thursday);
    expect(
      regularReturnLimit(
        { durationType: "OFFICE_HOURS", durationValue: 3 },
        monday,
        [],
      ),
    ).toBeUndefined();
  });

  it.each([
    [1, 1, "REQUESTED", true],
    [1, 2, "REQUESTED", false],
    [1, 1, "RESERVED", true],
    [1, 2, "RESERVED", false],
    [1, 1, "CHECKED_OUT", false],
    [1, 1, "RETURNED", false],
    [1, 1, "CANCELLED", false],
    [1, 1, "REJECTED", false],
  ])(
    "permits cancellation only for the applicant's uncollected request",
    (owner, viewer, status, allowed) => {
      expect(canCancelRental(owner, viewer, status)).toBe(allowed);
    },
  );

  it.each([
    ["REQUESTED", true],
    ["RESERVED", true],
    ["CHECKED_OUT", false],
    ["RETURNED", false],
    ["CANCELLED", false],
    ["REJECTED", false],
  ])("treats %s as cancellable: %s", (status, allowed) => {
    expect(cancellableRentalStatus(status)).toBe(allowed);
  });

  it("counts overlapping pending demand without including touching endpoints", () => {
    const requests = [
      reservation(1, monday, tuesday, 10, "REQUESTED"),
      reservation(2, tuesday, thursday, 2, "REQUESTED"),
      reservation(3, wednesday, thursday, 3, "REQUESTED"),
      reservation(4, thursday, "2026-11-23", 10, "REQUESTED"),
    ];
    expect(requestedQuantity(requests, tuesday, thursday)).toBe(5);
    expect(requestedQuantity([], tuesday, thursday)).toBe(0);
  });

  it.each([
    [6, ["2027-01-11", "2027-01-04", "2027-01-07", "2027-01-05"], "2027-01-07"],
    [3, ["2027-01-07", "2027-01-05"], "2027-01-07"],
    [3, ["2027-01-04", "2027-01-11"], undefined],
    [3, [], undefined],
    [4294967295, ["2027-01-07"], undefined],
  ])(
    "uses the last later office date within %i calendar days",
    (durationValue, dates, expected) => {
      expect(
        regularReturnLimit(
          { durationType: "DAYS", durationValue },
          "2027-01-04",
          dates,
        ),
      ).toBe(expected);
    },
  );

  it("handles the database date limit without returning an extended ISO year", () => {
    expect(addRentalDays("9999-12-30", 1)).toBe("9999-12-31");
    expect(addRentalDays("9999-12-30", 2)).toBeUndefined();
    expect(addRentalDays(monday, 4294967295)).toBeUndefined();
  });

  it("counts the peak within the requested interval and releases stock at the return shift", () => {
    const stock = [
      reservation(1, monday, tuesday, 2),
      reservation(2, tuesday, thursday, 3),
      reservation(3, wednesday, thursday, 1),
    ];
    expect(peakReservedQuantity(stock, monday)).toBe(4);
    expect(peakReservedQuantity(stock, monday, wednesday)).toBe(3);
    expect(peakReservedQuantity(stock, tuesday, thursday)).toBe(4);
    expect(peakReservedQuantity(stock, thursday)).toBe(0);
  });

  it("identifies the later pickup that depends on a scheduled same-day return", () => {
    const due = reservation(1, monday, tuesday, 2, "CHECKED_OUT");
    const first = reservation(2, tuesday, wednesday, 1);
    const second = reservation(3, tuesday, thursday, 1);
    const stock = [due, first, second];
    expect(hasSameDayReturn(stock, tuesday)).toBe(true);
    expect(beforeSameDayReturns(3, stock, tuesday, first.id)).toBe(1);
    expect(beforeSameDayReturns(3, stock, tuesday, second.id)).toBe(0);
    expect(beforeSameDayReturns(3, [first, second], tuesday, second.id)).toBe(
      2,
    );
    expect(hasSameDayReturn([first, second], tuesday)).toBe(false);
  });

  it("protects earlier pickup quantities until confirmed return restores physical inventory", () => {
    const overdue = reservation(1, monday, tuesday, 2, "CHECKED_OUT");
    const first = reservation(2, wednesday, thursday, 1);
    const second = reservation(3, wednesday, thursday, 1);
    expect(physicalQuantity(3, [overdue, first, second])).toBe(1);
    expect(checkoutQuantity(3, [overdue, first, second], second)).toBe(0);
    expect(checkoutQuantity(3, [first, second], second)).toBe(2);
  });

  it.each([
    ["REQUESTED", false],
    ["RESERVED", true],
    ["CHECKED_OUT", true],
    ["RETURNED", false],
    ["CANCELLED", false],
    ["REJECTED", false],
  ] as const)("marks %s as active or terminal", (status, active) => {
    expect(activeRentalStatus(status)).toBe(active);
  });
});
