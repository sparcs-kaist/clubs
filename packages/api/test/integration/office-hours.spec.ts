import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { parseKstDate } from "@sparcs-clubs/api/common/util/calendar-date";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import { JwtAccessGuard } from "@sparcs-clubs/api/feature/auth/guard/jwt-access.guard";
import { JwtAccessStrategy } from "@sparcs-clubs/api/feature/auth/strategy/jwt-access.strategy";
import { OfficeHoursModule } from "@sparcs-clubs/api/feature/office-hours/office-hours.module";
import { OfficeHoursPublicService } from "@sparcs-clubs/api/feature/office-hours/publicService/office-hours.public.service";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

describe("Office hours API with MySQL", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let officeHours: OfficeHoursPublicService;
  let executiveId: number;
  let authorization: string;
  const secret = "office-hours-integration-secret";
  const range = { from: "2026-11-16", to: "2026-11-20" };
  const exceptionDate = "2026-11-18";
  const exceptionUrl = `/executive/office-hours/${exceptionDate}`;
  const generationUrl = "/executive/office-hours/generate";
  const now = new Date("2026-11-12T08:00:00.500Z");
  const closed = { openTime: "20:00", closeTime: "21:00", isClosed: true };

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [ClockModule, TransactionModule, OfficeHoursModule],
      providers: [
        JwtAccessStrategy,
        {
          provide: AppConfigService,
          useValue: { accessTokenSecretKey: secret },
        },
        { provide: APP_GUARD, useClass: JwtAccessGuard },
      ],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => now, endOfToday: () => now })
      .compile();
    app = fixture.createNestApplication();
    await app.init();
    prisma = fixture.get(PrismaService);
    officeHours = fixture.get(OfficeHoursPublicService);
    await clearDatabase();
    const student = await prisma.student.create({
      data: { name: "Office hours executive", number: 20260080 },
    });
    const executive = await prisma.executive.create({
      data: { studentId: student.id, name: student.name },
    });
    executiveId = executive.id;
    const token = new JwtService().sign(
      { type: "executive", executiveId },
      { secret },
    );
    authorization = `Bearer ${token}`;
  });

  afterAll(async () => {
    await app?.close();
    await closeDatabase();
  });

  it("allows public schedule reads and requires an executive for edits", async () => {
    await request(app.getHttpServer())
      .get("/office-hours")
      .query(range)
      .expect(200, { items: [] });
    await request(app.getHttpServer())
      .post(generationUrl)
      .send(range)
      .expect(401);
    await request(app.getHttpServer())
      .put(exceptionUrl)
      .send(closed)
      .expect(401);

    const token = new JwtService().sign({ type: "undergraduate" }, { secret });
    await request(app.getHttpServer())
      .post(generationUrl)
      .set("Authorization", `Bearer ${token}`)
      .send(range)
      .expect(401);
  });

  it("generates KST weekday shifts and preserves existing changes on regeneration", async () => {
    const server = app.getHttpServer();
    const put = (body: typeof closed) =>
      request(server)
        .put(exceptionUrl)
        .set("Authorization", authorization)
        .send(body);
    const generate = () =>
      request(server)
        .post(generationUrl)
        .set("Authorization", authorization)
        .send(range);

    const open = { ...closed, isClosed: false };
    await put(open).expect(200);
    const original = await officeHours.findLatest(exceptionDate);
    const generations = await Promise.all([
      generate().expect(201),
      generate().expect(201),
    ]);
    expect(
      generations.map(response => response.body.createdCount).sort(),
    ).toEqual([0, 3]);

    const { body } = await request(server)
      .get("/office-hours")
      .query(range)
      .expect(200);
    expect(body.items.map(({ date }: { date: string }) => date)).toEqual([
      "2026-11-16",
      "2026-11-17",
      exceptionDate,
      "2026-11-19",
    ]);
    expect(body.items[0]).toMatchObject({
      opensAt: "2026-11-16T12:00:00.000Z",
      closesAt: "2026-11-16T13:00:00.000Z",
    });
    expect(body.items[2]).toMatchObject({
      opensAt: "2026-11-18T11:00:00.000Z",
      isClosed: false,
    });

    const same = await put(open).expect(200);
    expect(same.body.officeHour).toEqual({
      ...body.items[2],
      internalMemo: null,
    });
    await put(closed).expect(200);
    await generate().expect(201, { createdCount: 0 });

    const latest = await request(server)
      .get("/office-hours")
      .query(range)
      .expect(200);
    expect(latest.body.items).toHaveLength(4);
    expect(latest.body.items[2]).toEqual({
      date: exceptionDate,
      opensAt: "2026-11-18T11:00:00.000Z",
      closesAt: "2026-11-18T12:00:00.000Z",
      isClosed: true,
      publicMemo: null,
    });
    const current = await officeHours.findLatest(exceptionDate);
    expect(current.id).toBeGreaterThan(original.id);
    await expect(officeHours.listByIds([original.id])).resolves.toEqual([
      original,
    ]);
    await expect(officeHours.listIdsByDate(exceptionDate)).resolves.toEqual(
      expect.arrayContaining([original.id, current.id]),
    );
    await expect(
      officeHours.listIdsClosedBy(current.closesAt),
    ).resolves.toEqual(expect.arrayContaining([original.id, current.id]));
    expect(
      await prisma.officeHour.findMany({
        where: { date: parseKstDate(exceptionDate) },
        orderBy: { id: "asc" },
      }),
    ).toMatchObject([
      {
        id: original.id,
        updatedAt: now,
        updatedByExecutiveId: executiveId,
        isClosed: false,
      },
      {
        id: current.id,
        updatedAt: now,
        updatedByExecutiveId: executiveId,
        isClosed: true,
      },
    ]);
    const stored = await prisma.$queryRaw<{ date: string; dataType: string }[]>`
      SELECT CAST(shift.date AS CHAR) AS date, col.DATA_TYPE AS dataType
      FROM office_hour AS shift
      JOIN information_schema.COLUMNS AS col
        ON col.TABLE_SCHEMA = DATABASE()
        AND col.TABLE_NAME = 'office_hour'
        AND col.COLUMN_NAME = 'date'
      WHERE shift.date = ${exceptionDate} AND shift.id = ${current.id}
    `;
    expect(stored).toEqual([{ date: exceptionDate, dataType: "date" }]);

    const backdated = await prisma.officeHour.create({
      data: {
        date: parseKstDate(exceptionDate),
        opensAt: original.opensAt,
        closesAt: original.closesAt,
        isClosed: false,
        updatedAt: new Date(now.getTime() - 1),
        updatedByExecutiveId: executiveId,
      },
    });
    expect(backdated.id).toBeGreaterThan(current.id);
    await expect(officeHours.findLatest(exceptionDate)).resolves.toEqual(
      current,
    );
    await expect(
      officeHours.list(exceptionDate, exceptionDate),
    ).resolves.toEqual([current]);
  });

  it("keeps a holiday edit when default generation runs concurrently", async () => {
    const date = "2026-11-23";
    const server = app.getHttpServer();
    await Promise.all([
      request(server)
        .post(generationUrl)
        .set("Authorization", authorization)
        .send({ from: date, to: date })
        .expect(201),
      request(server)
        .put(`/executive/office-hours/${date}`)
        .set("Authorization", authorization)
        .send(closed)
        .expect(200),
    ]);
    await expect(officeHours.findLatest(date)).resolves.toMatchObject({
      date,
      isClosed: true,
    });
  });

  it("publishes the closure reason and records independent internal memo edits", async () => {
    const date = "2026-11-24";
    const query = { from: date, to: date };
    const server = app.getHttpServer();
    const url = `/executive/office-hours/${date}`;
    const put = (
      body: typeof closed & {
        publicMemo?: string | null;
        internalMemo?: string | null;
      },
    ) =>
      request(server).put(url).set("Authorization", authorization).send(body);
    const executiveList = () =>
      request(server)
        .get("/executive/office-hours")
        .set("Authorization", authorization)
        .query(query)
        .expect(200);
    const publicList = () => request(server).get("/office-hours").query(query);

    const reason = "시설 점검으로 휴무";
    const internalMemo = "시설 담당자와 비품 인수인계";
    await request(server)
      .get("/executive/office-hours")
      .query(query)
      .expect(401);
    await request(server)
      .put(url)
      .send({ ...closed, publicMemo: reason, internalMemo })
      .expect(401);
    const created = await put({
      ...closed,
      publicMemo: `  ${reason}  `,
      internalMemo: `  ${internalMemo}  `,
    }).expect(200);
    const publicWindow = {
      date,
      opensAt: "2026-11-24T11:00:00.000Z",
      closesAt: "2026-11-24T12:00:00.000Z",
      isClosed: true,
      publicMemo: reason,
    };
    expect(created.body.officeHour).toEqual({ ...publicWindow, internalMemo });
    await publicList().expect(200, { items: [publicWindow] });
    await expect(officeHours.findLatest(date)).resolves.toEqual({
      id: expect.any(Number),
      date,
      opensAt: new Date(publicWindow.opensAt),
      closesAt: new Date(publicWindow.closesAt),
      isClosed: true,
    });

    const editedMemo = "대여 물품 수량 확인";
    const updated = await put({ ...closed, internalMemo: editedMemo }).expect(
      200,
    );
    expect(updated.body.officeHour).toEqual({
      ...publicWindow,
      internalMemo: editedMemo,
    });
    expect((await executiveList()).body.items).toEqual([
      updated.body.officeHour,
    ]);
    await publicList().expect(200, { items: [publicWindow] });

    const revisedReason = "정기 점검으로 휴무";
    expect(
      (await put({ ...closed, publicMemo: revisedReason }).expect(200)).body
        .officeHour,
    ).toMatchObject({ publicMemo: revisedReason, internalMemo: editedMemo });
    const scheduleChange = { ...closed, closeTime: "22:00" };
    expect(
      (await put(scheduleChange).expect(200)).body.officeHour,
    ).toMatchObject({
      publicMemo: revisedReason,
      internalMemo: editedMemo,
    });
    expect(
      (await put({ ...scheduleChange, publicMemo: " " }).expect(200)).body
        .officeHour,
    ).toMatchObject({ publicMemo: null, internalMemo: editedMemo });
    expect(
      (await put({ ...scheduleChange, internalMemo: null }).expect(200)).body
        .officeHour,
    ).toMatchObject({ publicMemo: null, internalMemo: null });
    expect((await executiveList()).body.items[0]).toMatchObject({
      publicMemo: null,
      internalMemo: null,
    });
    const history = await prisma.officeHour.findMany({
      where: { date: parseKstDate(date) },
      orderBy: { id: "asc" },
      select: { publicMemo: true, internalMemo: true, updatedAt: true },
    });
    expect(history).toEqual(
      [
        [reason, internalMemo],
        [reason, editedMemo],
        [revisedReason, editedMemo],
        [revisedReason, editedMemo],
        [null, editedMemo],
        [null, null],
      ].map(([publicMemo, memo]) => ({
        publicMemo,
        internalMemo: memo,
        updatedAt: now,
      })),
    );
  });
});
