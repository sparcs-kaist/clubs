import { Global, INestApplication, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import request from "supertest";

import { CLOCK, type Clock } from "@sparcs-clubs/api/common/clock/clock";
import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { RandomModule } from "@sparcs-clubs/api/common/random/random.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import {
  HttpExceptionFilter,
  ZodErrorFilter,
} from "@sparcs-clubs/api/common/util/exception.filter";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import { JwtAccessGuard } from "@sparcs-clubs/api/feature/auth/guard/jwt-access.guard";
import { JwtAccessStrategy } from "@sparcs-clubs/api/feature/auth/strategy/jwt-access.strategy";
import { RentalModule } from "@sparcs-clubs/api/feature/rental/rental.module";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const secret = "rental-integration-secret";

@Global()
@Module({
  providers: [
    {
      provide: AppConfigService,
      useValue: {
        accessTokenSecretKey: secret,
        s3Region: "ap-northeast-2",
        s3AccessKey: "test",
        s3SecretAccessKey: "test",
      },
    },
  ],
  exports: [AppConfigService],
})
class TestConfigModule {}

const slot = (date: string) => ({ date, version: 1 });
const firstPickup = slot("2026-11-16");
const sharedShift = slot("2026-11-17");
const secondReturn = slot("2026-11-18");

describe("Rental API with MySQL", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let representative: string;
  let outsider: string;
  let executive: string;
  let executiveId: number;
  let clubId: number;
  let itemId: number;
  let now = new Date("2026-11-16T08:00:00Z");

  function authorization(payload: object) {
    return `Bearer ${new JwtService().sign(payload, { secret })}`;
  }

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        ClockModule,
        RandomModule,
        TransactionModule,
        RentalModule,
      ],
      providers: [
        JwtAccessStrategy,
        { provide: APP_GUARD, useClass: JwtAccessGuard },
      ],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => now, endOfToday: () => now })
      .compile();
    app = fixture.createNestApplication();
    const clock = fixture.get<Clock>(CLOCK);
    app.useGlobalFilters(
      new ZodErrorFilter(clock),
      new HttpExceptionFilter(clock),
    );
    await app.init();
    prisma = fixture.get(PrismaService);
    await clearDatabase();

    async function createStudent(number: number, name: string) {
      const user = await prisma.user.create({ data: { name } });
      const student = await prisma.student.create({
        data: { userId: user.id, name, number },
      });
      return {
        id: user.id,
        name,
        studentId: student.id,
        studentNumber: number,
      };
    }

    const delegate = await createStudent(20260081, "Rental delegate");
    representative = authorization({ ...delegate, type: "undergraduate" });
    const other = await createStudent(20260082, "Rental outsider");
    outsider = authorization({ ...other, type: "undergraduate" });
    const staff = await createStudent(20260083, "Rental executive");
    const staffRecord = await prisma.executive.create({
      data: { userId: staff.id, studentId: staff.studentId, name: staff.name },
    });
    executiveId = staffRecord.id;
    executive = authorization({ ...staff, executiveId, type: "executive" });

    const district = await prisma.district.create({ data: { name: "테스트" } });
    const division = await prisma.division.create({
      data: { name: "테스트", districtId: district.id },
    });
    const club = await prisma.club.create({
      data: {
        nameKr: "대여 테스트",
        foundingYear: 2020,
        divisionId: division.id,
      },
    });
    clubId = club.id;
    await prisma.clubDelegateD.create({
      data: {
        clubId,
        studentId: delegate.studentId,
        clubDelegateEnum: 1,
        startTerm: new Date("2026-09-01T00:00:00Z"),
      },
    });

    const server = app.getHttpServer();
    await request(server)
      .post("/executive/office-hours/generate")
      .set("Authorization", executive)
      .send({ from: firstPickup.date, to: "2026-12-03" })
      .expect(201);
    const { body } = await request(server)
      .post("/executive/rental-items")
      .set("Authorization", executive)
      .send({
        name: "운반 카트",
        totalQuantity: 1,
        durationPolicy: "DAYS_14",
        isActive: true,
      })
      .expect(201);
    itemId = body.id;
  });

  afterAll(async () => {
    await app?.close();
    await closeDatabase();
  });

  it("accepts only one concurrent claim and releases same-shift stock after actual return", async () => {
    const server = app.getHttpServer();
    const create = (
      pickup: typeof firstPickup,
      returnSlot: typeof secondReturn,
    ) => ({
      clubId,
      itemId,
      quantity: 1,
      pickup,
      return: returnSlot,
      contactPhoneNumber: "010-1234-5678",
      purpose: "운반",
      clientRequestId: randomUUID(),
    });
    const submit = (body: ReturnType<typeof create>, auth = representative) =>
      request(server)
        .post("/student/rentals")
        .set("Authorization", auth)
        .send(body);
    const act = (id: number, action: string, body: object = {}) =>
      request(server)
        .post(`/executive/rentals/${id}/${action}`)
        .set("Authorization", executive)
        .send(body);

    const applicants = [
      create(firstPickup, sharedShift),
      create(firstPickup, sharedShift),
    ];
    await request(server)
      .post("/student/rentals")
      .send(applicants[0])
      .expect(401);
    await submit(applicants[0], outsider).expect(403);

    const closedPickup = slot("2026-11-19");
    await request(server)
      .put(`/executive/office-hours/${closedPickup.date}`)
      .set("Authorization", executive)
      .send({ openTime: "21:00", closeTime: "22:00", isClosed: true })
      .expect(200);
    const stale = await submit(create(closedPickup, slot("2026-11-23"))).expect(
      409,
    );
    expect(stale.body.message).toMatchObject({
      message: "OFFICE_HOURS_CHANGED",
    });

    const responses = await Promise.all(applicants.map(body => submit(body)));
    expect(responses.map(response => response.status).sort()).toEqual([
      201, 409,
    ]);
    const winner = responses.findIndex(response => response.status === 201);
    const firstId = responses[winner].body.id;
    const retry = await submit(applicants[winner]).expect(201);
    expect(retry.body.id).toBe(firstId);
    expect(await prisma.rentalReservation.count()).toBe(1);

    const second = await submit(create(sharedShift, secondReturn)).expect(201);
    const secondId = second.body.id;
    expect(second.body.requiresSameDayReturn).toBe(true);

    const changeSharedShift = (isClosed: boolean) =>
      request(server)
        .put(`/executive/office-hours/${sharedShift.date}`)
        .set("Authorization", executive)
        .send({ openTime: "21:00", closeTime: "22:00", isClosed });
    await changeSharedShift(true).expect(200);
    const affected = await request(server)
      .get(`/student/rentals/${secondId}`)
      .set("Authorization", representative)
      .expect(200);
    expect(affected.body).toMatchObject({
      pickup: { ...sharedShift, opensAt: "2026-11-17T12:00:00.000Z" },
      needsReschedule: true,
    });
    await changeSharedShift(false).expect(200);

    now = new Date("2026-11-16T12:15:00Z");
    const handedOut = await act(firstId, "checkout").expect(200);
    expect(handedOut.body).toMatchObject({
      status: "CHECKED_OUT",
      checkoutMemo: null,
      hasDependentPickup: true,
    });

    now = new Date("2026-11-17T12:15:00Z");
    await request(server)
      .put(`/executive/office-hours/${sharedShift.date}`)
      .set("Authorization", executive)
      .send({ openTime: "21:00", closeTime: "21:10", isClosed: false })
      .expect(200);
    const notOverdue = await request(server)
      .get("/executive/rentals?overdue=false")
      .set("Authorization", executive)
      .expect(200);
    expect(notOverdue.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstId, overdue: false }),
      ]),
    );
    await changeSharedShift(false).expect(200);

    const blocked = await act(secondId, "checkout").expect(409);
    expect(blocked.body).toMatchObject({
      statusCode: 409,
      message: { message: "WAITING_FOR_RETURN" },
    });
    expect((await act(firstId, "return").expect(200)).body.status).toBe(
      "RETURNED",
    );
    expect((await act(secondId, "checkout").expect(200)).body.status).toBe(
      "CHECKED_OUT",
    );

    const extended = await act(secondId, "extend", {
      return: slot("2026-12-03"),
      reason: "동아리 행사 일정 변경",
    }).expect(200);
    expect(extended.body.extensions).toMatchObject([
      {
        previousReturnDate: secondReturn.date,
        newReturnDate: "2026-12-03",
        reason: "동아리 행사 일정 변경",
        processedByExecutiveId: executiveId,
      },
    ]);
    const extension = await prisma.rentalExtension.findFirstOrThrow({
      where: { reservationId: secondId },
    });
    expect(extension).toMatchObject({
      previousReturnVersion: 1,
      newReturnVersion: 1,
    });
    await expect(
      prisma.rentalReservation.update({
        where: { id: firstId },
        data: { approvedExtensionId: extension.id },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await request(server)
      .patch(`/executive/rental-items/${itemId}`)
      .set("Authorization", executive)
      .send({ name: "수정된 카트" })
      .expect(200);
    const renamed = await request(server)
      .get(`/student/rentals/${secondId}`)
      .set("Authorization", representative)
      .expect(200);
    expect(renamed.body.itemName).toBe("수정된 카트");
  });
});
