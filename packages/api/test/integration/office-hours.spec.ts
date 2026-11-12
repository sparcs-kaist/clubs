import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";

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
    }).compile();
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
    await generate().expect(201, { createdCount: 3 });
    await generate().expect(201, { createdCount: 0 });

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
      version: 1,
    });

    expect((await put(open).expect(200)).body.officeHour.version).toBe(1);
    expect((await put(closed).expect(200)).body.officeHour.version).toBe(2);
    await generate().expect(201, { createdCount: 0 });

    const latest = await request(server)
      .get("/office-hours")
      .query(range)
      .expect(200);
    expect(latest.body.items).toHaveLength(4);
    expect(latest.body.items[2]).toMatchObject({
      date: exceptionDate,
      isClosed: true,
      version: 2,
    });
    await expect(
      officeHours.listVersions([{ date: exceptionDate, version: 1 }]),
    ).resolves.toMatchObject([{ isClosed: false, version: 1 }]);
    await expect(
      officeHours.listDayVersions(exceptionDate),
    ).resolves.toMatchObject([
      { isClosed: false, version: 1 },
      { isClosed: true, version: 2 },
    ]);
    expect(
      await prisma.officeHour.findUnique({
        where: {
          date_version: { date: parseKstDate(exceptionDate), version: 2 },
        },
      }),
    ).toMatchObject({ updatedByExecutiveId: executiveId });
    const stored = await prisma.$queryRaw<{ date: string; dataType: string }[]>`
      SELECT CAST(shift.date AS CHAR) AS date, col.DATA_TYPE AS dataType
      FROM office_hour AS shift
      JOIN information_schema.COLUMNS AS col
        ON col.TABLE_SCHEMA = DATABASE()
        AND col.TABLE_NAME = 'office_hour'
        AND col.COLUMN_NAME = 'date'
      WHERE shift.date = ${exceptionDate} AND shift.version = 2
    `;
    expect(stored).toEqual([{ date: exceptionDate, dataType: "date" }]);
  });
});
