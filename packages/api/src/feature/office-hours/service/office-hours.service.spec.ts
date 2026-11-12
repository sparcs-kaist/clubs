import {
  apiOfh001,
  apiOfh003,
  apiOfh004,
  zOfficeDate,
  zOfficeHour,
} from "@clubs/interface/api/office-hours";

import type { OfficeHourRow } from "../repository/office-hours.repository";
import { OfficeHoursService } from "./office-hours.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

const date = "2026-11-16";
const executiveId = 5;
const now = new Date("2026-11-12T08:00:00Z");
const current = {
  date,
  opensAt: new Date("2026-11-16T12:00:00Z"),
  closesAt: new Date("2026-11-16T13:00:00Z"),
  isClosed: false,
  version: 4,
};
const unchanged = { openTime: "21:00", closeTime: "22:00", isClosed: false };

function createService() {
  const repository = {
    findLatest: jest.fn().mockResolvedValue(current),
    createMissing: jest.fn().mockResolvedValue(1),
    append: jest.fn(async (row: OfficeHourRow) => ({
      date: row.date,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
      isClosed: row.isClosed,
      version: row.version,
    })),
  };
  const service = new OfficeHoursService(repository as never, {
    now: () => now,
    endOfToday: () => now,
  });
  return { service, repository };
}

describe("OfficeHoursService", () => {
  it("generates missing Monday to Thursday dates in the requested KST range", async () => {
    const { service, repository } = createService();
    repository.createMissing.mockResolvedValue(3);
    await expect(
      service.generate({ from: "2026-11-15", to: "2026-11-20" }, executiveId),
    ).resolves.toEqual({ createdCount: 3 });

    const dates = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"];
    expect(repository.createMissing).toHaveBeenCalledWith(
      dates.map(day => ({
        date: day,
        opensAt: new Date(`${day}T12:00:00Z`),
        closesAt: new Date(`${day}T13:00:00Z`),
        isClosed: false,
        version: 1,
        updatedAt: now,
        updatedByExecutiveId: executiveId,
      })),
    );
  });

  it("creates an exception on a date that has no generated shift", async () => {
    const { service, repository } = createService();
    repository.findLatest.mockResolvedValue(null);

    await expect(
      service.put("2026-11-15", { ...unchanged, isClosed: true }, executiveId),
    ).resolves.toEqual({
      date: "2026-11-15",
      opensAt: new Date("2026-11-15T12:00:00Z"),
      closesAt: new Date("2026-11-15T13:00:00Z"),
      isClosed: true,
      version: 1,
    });
    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-11-15", version: 1 }),
    );
  });

  it("preserves the version and audit information when nothing changed", async () => {
    const { service, repository } = createService();
    await expect(service.put(date, unchanged, executiveId)).resolves.toEqual(
      current,
    );
    expect(repository.append).not.toHaveBeenCalled();
  });

  it.each([{ openTime: "20:30" }, { closeTime: "21:30" }, { isClosed: true }])(
    "appends a new version for an independent change: %j",
    async change => {
      const { service, repository } = createService();
      await expect(
        service.put(date, { ...unchanged, ...change }, executiveId),
      ).resolves.toMatchObject({ version: 5 });
      expect(repository.append).toHaveBeenCalledWith(
        expect.objectContaining({
          date,
          version: 5,
          updatedByExecutiveId: executiveId,
        }),
      );
    },
  );

  it("rejects a racing edit rather than replacing the new schedule", async () => {
    const { service, repository } = createService();
    repository.append.mockResolvedValue(null);

    await expect(
      service.put(date, { ...unchanged, isClosed: true }, executiveId),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects a racing insertion rather than returning an uncommitted version", async () => {
    const { service, repository } = createService();
    repository.findLatest.mockResolvedValue(null);
    repository.append.mockResolvedValue(null);

    await expect(
      service.put(date, unchanged, executiveId),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("office hours API validation", () => {
  it("requires real calendar dates and a bounded chronological range", () => {
    expect(zOfficeDate.safeParse("2026-02-29").success).toBe(false);
    expect(zOfficeDate.safeParse("2028-02-29").success).toBe(true);
    expect(
      apiOfh001.requestQuery.safeParse({ from: date, to: date }).success,
    ).toBe(true);
    expect(
      apiOfh003.requestBody.safeParse({ from: date, to: "2026-11-15" }).success,
    ).toBe(false);
    expect(
      apiOfh003.requestBody.safeParse({ from: date, to: "2027-11-17" }).success,
    ).toBe(false);
  });

  it("requires a chronological shift and parses Axios-transformed timestamps", () => {
    expect(
      apiOfh004.requestBody.safeParse({
        ...unchanged,
        closeTime: unchanged.openTime,
      }).success,
    ).toBe(false);
    expect(zOfficeHour.parse(current)).toEqual({
      ...current,
      opensAt: "2026-11-16T12:00:00.000Z",
      closesAt: "2026-11-16T13:00:00.000Z",
    });
  });
});
