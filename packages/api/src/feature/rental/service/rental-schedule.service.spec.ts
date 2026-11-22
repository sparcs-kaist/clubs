import type { OfficeHoursPublicService } from "@sparcs-clubs/api/feature/office-hours/publicService/office-hours.public.service";

import {
  RentalScheduleService,
  selectionMatches,
  serializeWindow,
} from "./rental-schedule.service";

const booked = {
  id: 3,
  date: "2026-11-16",
  opensAt: new Date("2026-11-16T12:00:00.000Z"),
  closesAt: new Date("2026-11-16T13:00:00.000Z"),
  isClosed: false,
};
const selection = serializeWindow(booked);
const now = new Date("2026-11-16T12:30:00.000Z");

describe("rental office hour selections", () => {
  const findLatest = jest.fn();
  const schedule = new RentalScheduleService({
    findLatest,
  } as unknown as OfficeHoursPublicService);

  it("matches by date and both instants and serializes no internal ID", () => {
    expect(selection).toEqual({
      date: "2026-11-16",
      opensAt: "2026-11-16T12:00:00.000Z",
      closesAt: "2026-11-16T13:00:00.000Z",
    });
    expect(selectionMatches(booked, selection)).toBe(true);
    expect(selectionMatches(booked, { ...selection, date: "2026-11-17" })).toBe(
      false,
    );
    expect(
      selectionMatches(booked, {
        ...selection,
        opensAt: "2026-11-16T11:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      selectionMatches(booked, {
        ...selection,
        closesAt: "2026-11-16T14:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("keeps the booked ID after the same hours are restored", async () => {
    findLatest.mockResolvedValue({ ...booked, id: 4 });
    await expect(schedule.resolveBooked(booked, now)).resolves.toEqual(booked);
  });

  it("rejects a booked shift after its latest closing time changes", async () => {
    findLatest.mockResolvedValue({
      ...booked,
      id: 4,
      closesAt: new Date("2026-11-16T12:50:00.000Z"),
    });
    await expect(schedule.resolveBooked(booked, now)).rejects.toThrow(
      "OFFICE_HOURS_CHANGED",
    );
  });

  it("rejects the exact end of a booked shift", async () => {
    findLatest.mockResolvedValue(booked);
    await expect(
      schedule.resolveBooked(booked, booked.closesAt),
    ).rejects.toThrow("OFFICE_HOURS_PASSED");
  });
});

describe("configured rental duration", () => {
  const window = (date: string, id: number, isClosed = false) => ({
    ...booked,
    id,
    date,
    isClosed,
    opensAt: new Date(`${date}T12:00:00.000Z`),
    closesAt: new Date(`${date}T13:00:00.000Z`),
  });

  it("counts only later open dates and reaches published shifts after a long break", async () => {
    const first = window("2026-11-18", 5);
    const second = window("2028-01-03", 6);
    const third = window("2028-01-04", 7);
    const list = jest
      .fn()
      .mockResolvedValue([
        booked,
        window("2026-11-17", 4, true),
        first,
        second,
        third,
        window("2028-01-05", 8),
      ]);
    const schedule = new RentalScheduleService({ list } as never);
    const result = await schedule.availableDates(
      { durationType: "OFFICE_HOURS", durationValue: 3 },
      booked.date,
    );
    expect(list).toHaveBeenCalledWith(booked.date, "9999-12-31");
    expect(result).toEqual({
      pickup: booked,
      limit: third.date,
      returns: [first, second, third],
    });
  });

  it("keeps unavailable future office counts unavailable", async () => {
    const schedule = new RentalScheduleService({
      list: jest.fn().mockResolvedValue([booked, window("2026-11-17", 4)]),
    } as never);
    await expect(
      schedule.availableDates(
        { durationType: "OFFICE_HOURS", durationValue: 2 },
        booked.date,
      ),
    ).resolves.toMatchObject({ limit: undefined, returns: [] });
    await expect(
      schedule.requireRegularLimit(
        { durationType: "OFFICE_HOURS", durationValue: 2 },
        booked.date,
      ),
    ).rejects.toThrow("OFFICE_HOURS_NOT_PUBLISHED");
  });

  it("uses the configured day count to query the complete calendar range", async () => {
    const limit = window("2027-12-21", 4);
    const list = jest.fn().mockResolvedValue([booked, limit]);
    const schedule = new RentalScheduleService({ list } as never);
    await expect(
      schedule.availableDates(
        { durationType: "DAYS", durationValue: 400 },
        booked.date,
      ),
    ).resolves.toMatchObject({ limit: "2027-12-21" });
    expect(list).toHaveBeenCalledWith(booked.date, "2027-12-21");
  });

  it.each([
    [6, "2026-11-22"],
    [7, "2026-11-23"],
  ])(
    "uses the last open shift when the %i-day cap is a weekend or closure",
    async (durationValue, cap) => {
      const last = window("2026-11-19", 4);
      const list = jest
        .fn()
        .mockResolvedValue([booked, last, window("2026-11-23", 5, true)]);
      const schedule = new RentalScheduleService({ list } as never);
      await expect(
        schedule.availableDates(
          { durationType: "DAYS", durationValue },
          booked.date,
        ),
      ).resolves.toEqual({ pickup: booked, limit: last.date, returns: [last] });
      expect(list).toHaveBeenCalledWith(booked.date, cap);
    },
  );

  it("offers no returns when the day cap includes no later open shift", async () => {
    const schedule = new RentalScheduleService({
      list: jest
        .fn()
        .mockResolvedValue([booked, window("2026-11-17", 4, true)]),
    } as never);
    await expect(
      schedule.availableDates(
        { durationType: "DAYS", durationValue: 1 },
        booked.date,
      ),
    ).resolves.toEqual({ pickup: booked, limit: undefined, returns: [] });
  });

  it("rejects a day count beyond the supported date range before querying", async () => {
    const list = jest.fn();
    const schedule = new RentalScheduleService({ list } as never);
    await expect(
      schedule.availableDates(
        { durationType: "DAYS", durationValue: 4294967295 },
        booked.date,
      ),
    ).rejects.toMatchObject({ status: 400, message: "INVALID_RENTAL_PERIOD" });
    expect(list).not.toHaveBeenCalled();
  });
});
