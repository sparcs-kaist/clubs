import { Prisma } from "@prisma/client";

import {
  apiOfh001,
  apiOfh003,
  apiOfh004,
  zOfficeDate,
  zOfficeHour,
} from "@clubs/interface/api/office-hours";

import type { ExecutiveOfficeHourRow } from "../repository/office-hours.repository";
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
  publicMemo: null,
  internalMemo: null,
  id: 4,
};
const unchanged = { openTime: "21:00", closeTime: "22:00", isClosed: false };

function createService() {
  const repository = {
    findLatest: jest.fn().mockResolvedValue(current),
    list: jest.fn().mockResolvedValue([]),
    createMissing: jest.fn().mockResolvedValue(1),
    append: jest.fn(async (row: Omit<ExecutiveOfficeHourRow, "id">) => ({
      id: 5,
      date: row.date,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
      isClosed: row.isClosed,
      publicMemo: row.publicMemo,
      internalMemo: row.internalMemo,
    })),
  };
  const service = new OfficeHoursService(repository as never, {
    now: () => now,
    endOfToday: () => now,
  });
  return { service, repository };
}

function writeConflict() {
  return new Prisma.PrismaClientKnownRequestError("concurrent write", {
    code: "P2034",
    clientVersion: "test",
  });
}

describe("OfficeHoursService", () => {
  it("generates missing Monday to Thursday dates in the requested KST range", async () => {
    const { service, repository } = createService();
    repository.createMissing.mockResolvedValue(3);
    repository.list.mockResolvedValue([
      { ...current, date: "2026-11-18", isClosed: true },
    ]);
    await expect(
      service.generate({ from: "2026-11-15", to: "2026-11-20" }, executiveId),
    ).resolves.toEqual({ createdCount: 3 });

    const dates = ["2026-11-16", "2026-11-17", "2026-11-19"];
    expect(repository.createMissing).toHaveBeenCalledWith(
      dates.map(day => ({
        date: day,
        opensAt: new Date(`${day}T12:00:00Z`),
        closesAt: new Date(`${day}T13:00:00Z`),
        isClosed: false,
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
      publicMemo: null,
      internalMemo: null,
      id: 5,
    });
    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-11-15" }),
    );
  });

  it("preserves the existing row and audit information when nothing changed", async () => {
    const { service, repository } = createService();
    await expect(service.put(date, unchanged, executiveId)).resolves.toEqual(
      current,
    );
    expect(repository.append).not.toHaveBeenCalled();
  });

  it.each([
    { openTime: "20:30" },
    { closeTime: "21:30" },
    { isClosed: true },
    { publicMemo: "시설 점검" },
    { internalMemo: "인수인계" },
  ])("appends a new row for an independent change: %j", async change => {
    const { service, repository } = createService();
    await expect(
      service.put(date, { ...unchanged, ...change }, executiveId),
    ).resolves.toMatchObject({ id: 5 });
    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        date,
        updatedByExecutiveId: executiveId,
      }),
    );
  });

  it("preserves both memos when a schedule edit omits them", async () => {
    const { service, repository } = createService();
    const memos = { publicMemo: "시설 점검", internalMemo: "인수인계" };
    repository.findLatest.mockResolvedValue({ ...current, ...memos });
    await expect(
      service.put(date, { ...unchanged, closeTime: "22:30" }, executiveId),
    ).resolves.toMatchObject({
      ...memos,
      closesAt: new Date("2026-11-16T13:30:00Z"),
    });
  });

  it.each([
    ["publicMemo", null, { publicMemo: null, internalMemo: "인수인계" }],
    ["publicMemo", "", { publicMemo: null, internalMemo: "인수인계" }],
    ["internalMemo", null, { publicMemo: "시설 점검", internalMemo: null }],
    ["internalMemo", "", { publicMemo: "시설 점검", internalMemo: null }],
  ] as const)("clears only the provided %s (%p)", async (key, value, memos) => {
    const { service, repository } = createService();
    repository.findLatest.mockResolvedValue({
      ...current,
      publicMemo: "시설 점검",
      internalMemo: "인수인계",
    });
    await expect(
      service.put(date, { ...unchanged, [key]: value }, executiveId),
    ).resolves.toMatchObject({ id: 5, ...memos });
  });

  it("reads the date range again after a concurrent generator commits", async () => {
    const { service, repository } = createService();
    repository.list.mockResolvedValueOnce([]).mockResolvedValue([current]);
    repository.createMissing
      .mockRejectedValueOnce(writeConflict())
      .mockResolvedValue(0);

    await expect(
      service.generate({ from: date, to: date }, executiveId),
    ).resolves.toEqual({ createdCount: 0 });
    expect(repository.list).toHaveBeenCalledTimes(2);
    expect(repository.createMissing).toHaveBeenLastCalledWith([]);
  });

  it("returns a conflict after exhausting retries", async () => {
    const { service, repository } = createService();
    repository.append.mockRejectedValue(writeConflict());
    await expect(
      service.put(date, { ...unchanged, isClosed: true }, executiveId),
    ).rejects.toMatchObject({ status: 409 });
    expect(repository.append).toHaveBeenCalledTimes(3);
  });

  it.each([
    ["ordinary", new Error("write failed")],
    [
      "foreign key",
      new Prisma.PrismaClientKnownRequestError("invalid reference", {
        code: "P2003",
        clientVersion: "test",
      }),
    ],
  ] as const)("does not retry unrelated errors (%s)", async (_, error) => {
    const { service, repository } = createService();
    repository.append.mockRejectedValue(error);
    await expect(
      service.put(date, { ...unchanged, isClosed: true }, executiveId),
    ).rejects.toBe(error);
    expect(repository.append).toHaveBeenCalledTimes(1);
  });
});

describe("office hours API validation", () => {
  it("requires real calendar dates and a bounded chronological range", () => {
    expect(zOfficeDate.safeParse("2026-02-29").success).toBe(false);
    expect(zOfficeDate.safeParse("2028-02-29").success).toBe(true);
    expect(
      apiOfh001.requestQuery.safeParse({ from: date, to: date }).success,
    ).toBe(true);
    expect(apiOfh001.requestQuery.safeParse({ from: date }).success).toBe(true);
    expect(
      apiOfh001.requestQuery.safeParse({ from: date, to: "2028-11-16" })
        .success,
    ).toBe(false);
    expect(apiOfh003.requestBody.safeParse({ from: date }).success).toBe(false);
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
      date,
      opensAt: "2026-11-16T12:00:00.000Z",
      closesAt: "2026-11-16T13:00:00.000Z",
      isClosed: false,
      publicMemo: null,
    });
  });
});
