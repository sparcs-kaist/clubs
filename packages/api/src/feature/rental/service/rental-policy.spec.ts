import {
  activeRentalStatus,
  addRentalDays,
  beforeSameDayReturns,
  checkoutQuantity,
  hasSameDayReturn,
  peakReservedQuantity,
  physicalQuantity,
  regularReturnLimit,
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
  it("uses the configured calendar days or published office count", () => {
    expect(
      regularReturnLimit(
        { durationType: "DAYS", durationValue: 3 },
        "2026-12-30",
        [],
      ),
    ).toBe("2027-01-02");
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
    ).toBeUndefined();
  });

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
    ["RESERVED", true],
    ["CHECKED_OUT", true],
    ["RETURNED", false],
    ["CANCELLED", false],
    ["REJECTED", false],
  ] as const)("marks %s as active or terminal", (status, active) => {
    expect(activeRentalStatus(status)).toBe(active);
  });
});
