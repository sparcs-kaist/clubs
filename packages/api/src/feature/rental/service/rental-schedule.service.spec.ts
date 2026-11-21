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
