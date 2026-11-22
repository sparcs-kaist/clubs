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
import { formatKstDate } from "@sparcs-clubs/api/common/util/calendar-date";
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

const slot = (date: string) => ({
  date,
  opensAt: `${date}T12:00:00.000Z`,
  closesAt: `${date}T13:00:00.000Z`,
});
const firstPickup = slot("2026-11-16");
const sharedShift = slot("2026-11-17");
const secondReturn = slot("2026-11-18");

describe("Rental API with MySQL", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let representative: string;
  let fellowDelegate: string;
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
    const fellow = await createStudent(20260084, "Rental fellow delegate");
    fellowDelegate = authorization({ ...fellow, type: "undergraduate" });
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
    await prisma.clubDelegateD.create({
      data: {
        clubId,
        studentId: fellow.studentId,
        clubDelegateEnum: 2,
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
        durationType: "DAYS",
        durationValue: 14,
        isActive: true,
      })
      .expect(201);
    itemId = body.id;
  });

  afterAll(async () => {
    await app?.close();
    await closeDatabase();
  });

  it("accepts concurrent requests, approves only the FIFO claim and releases same-shift stock after actual return", async () => {
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

    const editedPickup = slot("2026-11-23");
    await request(server)
      .put(`/executive/office-hours/${editedPickup.date}`)
      .set("Authorization", executive)
      .send({ openTime: "21:30", closeTime: "22:00", isClosed: false })
      .expect(200);
    const staleHours = await submit(
      create(editedPickup, slot("2026-11-24")),
    ).expect(409);
    expect(staleHours.body.message).toMatchObject({
      message: "OFFICE_HOURS_CHANGED",
    });

    const responses = await Promise.all(applicants.map(body => submit(body)));
    expect(responses.map(response => response.status).sort()).toEqual([
      201, 201,
    ]);
    const winner = responses[0].body.id < responses[1].body.id ? 0 : 1;
    const firstId = responses[winner].body.id;
    const laterId = responses[1 - winner].body.id;
    const retry = await submit(applicants[winner]).expect(201);
    expect(retry.body.id).toBe(firstId);
    expect(retry.body).toMatchObject({ status: "REQUESTED", approvedAt: null });
    expect(await prisma.rentalReservation.count()).toBe(2);
    const requested = await request(server)
      .get(`/rentals/items/${itemId}/return-options`)
      .query({ pickupDate: firstPickup.date })
      .expect(200);
    expect(requested.body.options[0]).toMatchObject({
      availableQuantity: 1,
      requestedQuantity: 2,
    });
    await act(firstId, "checkout").expect(409);
    await request(server)
      .post(`/executive/rentals/${firstId}/approve`)
      .expect(401);
    await request(server)
      .post(`/executive/rentals/${firstId}/approve`)
      .set("Authorization", representative)
      .expect(401);
    const fifo = await act(laterId, "approve").expect(409);
    expect(fifo.body.message).toMatchObject({
      message: "WAITING_FOR_APPROVAL",
    });
    const approvals = await Promise.all([
      act(firstId, "approve"),
      act(laterId, "approve"),
    ]);
    expect(approvals.map(response => response.status).sort()).toEqual([
      200, 409,
    ]);
    const approved = await act(firstId, "approve").expect(200);
    expect(approved.body).toMatchObject({
      status: "RESERVED",
      approvedAt: now.toISOString(),
      approvedByExecutiveId: executiveId,
    });
    const afterApproval = await request(server)
      .get(`/rentals/items/${itemId}/return-options`)
      .query({ pickupDate: firstPickup.date })
      .expect(200);
    expect(afterApproval.body.options[0]).toMatchObject({
      availableQuantity: 0,
      requestedQuantity: 1,
    });
    await act(laterId, "reject", { reason: "중복 신청 정리" }).expect(200);

    const second = await submit(create(sharedShift, secondReturn)).expect(201);
    const secondId = second.body.id;
    expect(second.body.requiresSameDayReturn).toBe(false);
    expect(
      (await act(secondId, "approve").expect(200)).body.requiresSameDayReturn,
    ).toBe(true);
    expect(second.body.pickup).toEqual(sharedShift);
    expect(second.body.return).toEqual(secondReturn);
    expect(second.body).not.toHaveProperty("pickupHourId");
    expect(second.body).not.toHaveProperty("returnHourId");

    const changeSharedShift = (isClosed: boolean) =>
      request(server)
        .put(`/executive/office-hours/${sharedShift.date}`)
        .set("Authorization", executive)
        .send({ openTime: "21:00", closeTime: "22:00", isClosed });
    await request(server)
      .put(`/executive/office-hours/${sharedShift.date}`)
      .set("Authorization", executive)
      .send({
        openTime: "21:00",
        closeTime: "22:00",
        isClosed: false,
        publicMemo: "학생회실에서 수령하세요.",
        internalMemo: "인도 전 물품 상태 확인",
      })
      .expect(200);
    const memoOnly = await request(server)
      .get(`/student/rentals/${secondId}`)
      .set("Authorization", representative)
      .expect(200);
    expect(memoOnly.body.needsReschedule).toBe(false);
    expect(memoOnly.body.pickup).toEqual(sharedShift);

    await changeSharedShift(true).expect(200);
    const affected = await request(server)
      .get(`/student/rentals/${secondId}`)
      .set("Authorization", representative)
      .expect(200);
    expect(affected.body).toMatchObject({
      pickup: sharedShift,
      needsReschedule: true,
    });
    const officeDateReservations = await request(server)
      .get(`/executive/rentals?officeDate=${sharedShift.date}&status=RESERVED`)
      .set("Authorization", executive)
      .expect(200);
    expect(officeDateReservations.body.total).toBe(2);
    expect(
      officeDateReservations.body.items.map(
        (order: { id: number }) => order.id,
      ),
    ).toEqual([firstId, secondId]);
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
    const overdue = await request(server)
      .get("/executive/rentals?overdue=true")
      .set("Authorization", executive)
      .expect(200);
    expect(overdue.body.total).toBe(0);
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

    const extensionRequest = {
      return: slot("2026-12-03"),
      reason: "동아리 행사 일정 변경",
    };
    const extended = await act(secondId, "extend", extensionRequest).expect(
      200,
    );
    await act(secondId, "extend", extensionRequest).expect(200);
    expect(
      await prisma.rentalExtension.count({
        where: { reservationId: secondId },
      }),
    ).toBe(1);
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
    const previousReturnHour = await prisma.officeHour.findUniqueOrThrow({
      where: { id: extension.previousReturnHourId },
    });
    const newReturnHour = await prisma.officeHour.findUniqueOrThrow({
      where: { id: extension.newReturnHourId },
    });
    expect(formatKstDate(previousReturnHour.date)).toBe(secondReturn.date);
    expect(previousReturnHour.closesAt.toISOString()).toBe(
      secondReturn.closesAt,
    );
    expect(formatKstDate(newReturnHour.date)).toBe(
      extensionRequest.return.date,
    );
    expect(newReturnHour.closesAt.toISOString()).toBe(
      extensionRequest.return.closesAt,
    );
    const foreignExtension = await prisma.rentalExtension.create({
      data: {
        reservationId: firstId,
        previousReturnHourId: extension.previousReturnHourId,
        newReturnHourId: extension.newReturnHourId,
        reason: "다른 대여의 연장 승인",
        processedByExecutiveId: executiveId,
        processedAt: now,
      },
    });
    await prisma.rentalReservation.update({
      where: { id: secondId },
      data: { approvedExtensionId: foreignExtension.id },
    });
    try {
      const beforeRejectedUpdate =
        await prisma.rentalReservation.findUniqueOrThrow({
          where: { id: secondId },
        });
      const rejectedUpdate = await request(server)
        .patch(`/executive/rentals/${secondId}/schedule`)
        .set("Authorization", executive)
        .send({ return: extensionRequest.return })
        .expect(409);
      expect(rejectedUpdate.body.message).toMatchObject({
        message: "INVALID_RENTAL_STATE",
      });
      expect(
        await prisma.rentalReservation.findUniqueOrThrow({
          where: { id: secondId },
        }),
      ).toEqual(beforeRejectedUpdate);
    } finally {
      await prisma.rentalReservation.update({
        where: { id: secondId },
        data: { approvedExtensionId: extension.id },
      });
      await prisma.rentalExtension.delete({
        where: { id: foreignExtension.id },
      });
    }

    const reschedule = (returnSlot: typeof secondReturn) =>
      request(server)
        .patch(`/executive/rentals/${secondId}/schedule`)
        .set("Authorization", executive)
        .send({ return: returnSlot });
    await request(server)
      .put(`/executive/office-hours/${extensionRequest.return.date}`)
      .set("Authorization", executive)
      .send({ openTime: "21:30", closeTime: "22:00", isClosed: false })
      .expect(200);
    await reschedule(extensionRequest.return).expect(409);
    const revisedReturn = {
      ...extensionRequest.return,
      opensAt: `${extensionRequest.return.date}T12:30:00.000Z`,
    };
    const rescheduled = await reschedule(revisedReturn).expect(200);
    expect(rescheduled.body).toMatchObject({
      return: revisedReturn,
      approvedReturnLimitDate: revisedReturn.date,
      needsReschedule: false,
    });
    const storedReservation = await prisma.rentalReservation.findUniqueOrThrow({
      where: { id: secondId },
    });
    expect(storedReservation.returnHourId).not.toBe(extension.newReturnHourId);
    expect(storedReservation.approvedExtensionId).toBe(extension.id);

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

  it("applies edited item limits to new bookings while retaining existing duration snapshots", async () => {
    now = new Date("2027-01-04T08:00:00Z");
    const server = app.getHttpServer();
    await request(server)
      .post("/executive/office-hours/generate")
      .set("Authorization", executive)
      .send({ from: "2027-01-04", to: "2027-01-14" })
      .expect(201);
    const created = await request(server)
      .post("/executive/rental-items")
      .set("Authorization", executive)
      .send({
        name: "기간 설정 카트",
        totalQuantity: 3,
        durationType: "DAYS",
        durationValue: 3,
        isActive: true,
      })
      .expect(201);
    const configuredItemId = created.body.id;
    const apply = (returnDate: string) =>
      request(server)
        .post("/student/rentals")
        .set("Authorization", representative)
        .send({
          clubId,
          itemId: configuredItemId,
          quantity: 1,
          pickup: slot("2027-01-04"),
          return: slot(returnDate),
          contactPhoneNumber: "010-1234-5678",
          purpose: "기간 설정 확인",
          clientRequestId: randomUUID(),
        });
    const options = () =>
      request(server)
        .get(`/rentals/items/${configuredItemId}/return-options`)
        .query({ pickupDate: "2027-01-04" })
        .expect(200);
    expect(
      (await options()).body.options.map(({ date }: { date: string }) => date),
    ).toEqual(["2027-01-05", "2027-01-06", "2027-01-07"]);
    const original = await apply("2027-01-07").expect(201);
    expect(original.body).toMatchObject({
      durationType: "DAYS",
      durationValue: 3,
      regularReturnLimitDate: "2027-01-07",
    });

    await request(server)
      .patch(`/executive/rental-items/${configuredItemId}`)
      .set("Authorization", executive)
      .send({ durationValue: 6 })
      .expect(200);
    const weekendCap = await apply("2027-01-07").expect(201);
    expect(weekendCap.body).toMatchObject({
      durationType: "DAYS",
      durationValue: 6,
      return: slot("2027-01-07"),
      regularReturnLimitDate: "2027-01-07",
    });
    expect(
      await prisma.rentalReservation.findUnique({
        where: { id: weekendCap.body.id },
      }),
    ).toMatchObject({
      regularReturnLimitDate: new Date("2027-01-06T15:00:00Z"),
    });
    await apply("2027-01-11").expect(400);

    await request(server)
      .patch(`/executive/rental-items/${configuredItemId}`)
      .set("Authorization", executive)
      .send({ durationType: "OFFICE_HOURS", durationValue: 4 })
      .expect(200);
    await request(server)
      .put("/executive/office-hours/2027-01-06")
      .set("Authorization", executive)
      .send({ openTime: "21:00", closeTime: "22:00", isClosed: true })
      .expect(200);
    expect(
      (await options()).body.options.map(({ date }: { date: string }) => date),
    ).toEqual(["2027-01-05", "2027-01-07", "2027-01-11", "2027-01-12"]);
    await apply("2027-01-13").expect(400);
    const next = await apply("2027-01-12").expect(201);
    expect(next.body).toMatchObject({
      durationType: "OFFICE_HOURS",
      durationValue: 4,
      regularReturnLimitDate: "2027-01-12",
    });
    expect(
      await prisma.rentalReservation.findUnique({
        where: { id: original.body.id },
      }),
    ).toMatchObject({ durationType: "DAYS", durationValue: 3 });
    const reschedule = (returned: string) =>
      request(server)
        .patch(`/executive/rentals/${original.body.id}/schedule`)
        .set("Authorization", executive)
        .send({ pickup: slot("2027-01-05"), return: slot(returned) });
    await reschedule("2027-01-11").expect(400);
    expect((await reschedule("2027-01-07").expect(200)).body).toMatchObject({
      durationType: "DAYS",
      durationValue: 3,
      regularReturnLimitDate: "2027-01-07",
    });
  });

  it("allows partial published schedules and authorized club-wide reads while keeping cancellation applicant-only", async () => {
    now = new Date("2027-03-04T08:00:00Z");
    const server = app.getHttpServer();
    await Promise.all(
      ["2027-03-04", "2027-03-05", "2027-03-08"].map(date =>
        request(server)
          .put(`/executive/office-hours/${date}`)
          .set("Authorization", executive)
          .send({ openTime: "21:00", closeTime: "22:00", isClosed: false })
          .expect(200),
      ),
    );
    await request(server)
      .put("/executive/office-hours/2027-03-06")
      .set("Authorization", executive)
      .send({ openTime: "21:00", closeTime: "22:00", isClosed: true })
      .expect(200);
    const created = await request(server)
      .post("/executive/rental-items")
      .set("Authorization", executive)
      .send({
        name: "일부 상근 공개 카트",
        totalQuantity: 3,
        durationType: "OFFICE_HOURS",
        durationValue: 5,
        isActive: true,
      })
      .expect(201);
    const partialItemId = created.body.id;
    const options = await request(server)
      .get(`/rentals/items/${partialItemId}/return-options`)
      .query({ pickupDate: "2027-03-04" })
      .expect(200);
    expect(
      options.body.options.map(({ date }: { date: string }) => date),
    ).toEqual(["2027-03-05", "2027-03-08"]);
    const apply = (token: string, requestedClubId = clubId) =>
      request(server)
        .post("/student/rentals")
        .set("Authorization", token)
        .send({
          clubId: requestedClubId,
          itemId: partialItemId,
          quantity: 1,
          pickup: slot("2027-03-04"),
          return: slot("2027-03-08"),
          contactPhoneNumber: "010-1234-5678",
          purpose: "일부 공개 일정 신청",
          clientRequestId: randomUUID(),
        });
    const original = await apply(representative).expect(201);
    expect(original.body).toMatchObject({
      durationType: "OFFICE_HOURS",
      durationValue: 5,
      regularReturnLimitDate: "2027-03-08",
      canCancel: true,
    });
    const fellowRequest = await apply(fellowDelegate).expect(201);
    const club = await prisma.club.findUniqueOrThrow({ where: { id: clubId } });
    const unrelatedClub = await prisma.club.create({
      data: {
        nameKr: "다른 대여 동아리",
        foundingYear: 2020,
        divisionId: club.divisionId,
      },
    });
    const outsiderStudent = await prisma.student.findFirstOrThrow({
      where: { number: 20260082 },
    });
    await prisma.clubDelegateD.create({
      data: {
        clubId: unrelatedClub.id,
        studentId: outsiderStudent.id,
        clubDelegateEnum: 1,
        startTerm: new Date("2026-09-01T00:00:00Z"),
      },
    });
    const unrelated = await apply(outsider, unrelatedClub.id).expect(201);
    const clubListUrl = `/student/rentals?clubId=${clubId}`;
    await request(server).get(clubListUrl).expect(401);
    await request(server)
      .get(clubListUrl)
      .set("Authorization", outsider)
      .expect(403);
    await request(server)
      .get(`/student/rentals?clubId=${unrelatedClub.id}`)
      .set("Authorization", fellowDelegate)
      .expect(403);
    const clubList = await request(server)
      .get(clubListUrl)
      .set("Authorization", fellowDelegate)
      .expect(200);
    expect(clubList.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: original.body.id, canCancel: false }),
        expect.objectContaining({ id: fellowRequest.body.id, canCancel: true }),
      ]),
    );
    expect(
      clubList.body.items.every(
        ({ clubId: resultClubId }: { clubId: number }) =>
          resultClubId === clubId,
      ),
    ).toBe(true);
    expect(
      clubList.body.items.map(({ id }: { id: number }) => id),
    ).not.toContain(unrelated.body.id);
    const personal = await request(server)
      .get("/student/rentals")
      .set("Authorization", fellowDelegate)
      .expect(200);
    expect(personal.body.items.map(({ id }: { id: number }) => id)).toEqual([
      fellowRequest.body.id,
    ]);
    const detailUrl = `/student/rentals/${original.body.id}`;
    const detail = await request(server)
      .get(detailUrl)
      .set("Authorization", fellowDelegate)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: original.body.id,
      canCancel: false,
    });
    expect(detail.body).not.toHaveProperty("contactPhoneNumber");
    expect(detail.body).not.toHaveProperty("purpose");
    await request(server)
      .get(detailUrl)
      .set("Authorization", outsider)
      .expect(404);
    await request(server)
      .post(`${detailUrl}/cancel`)
      .set("Authorization", fellowDelegate)
      .expect(404);
    expect(
      await prisma.rentalReservation.findUnique({
        where: { id: original.body.id },
      }),
    ).toMatchObject({ status: "REQUESTED" });
    const cancelled = await request(server)
      .post(`/student/rentals/${fellowRequest.body.id}/cancel`)
      .set("Authorization", fellowDelegate)
      .expect(200);
    expect(cancelled.body).toMatchObject({
      status: "CANCELLED",
      canCancel: false,
    });
  });

  it("checks out outside office hours while protecting earlier confirmed inventory and retaining legacy approvals", async () => {
    now = new Date("2027-05-03T08:00:00Z");
    const server = app.getHttpServer();
    await request(server)
      .post("/executive/office-hours/generate")
      .set("Authorization", executive)
      .send({ from: "2027-05-03", to: "2027-05-13" })
      .expect(201);
    const item = await request(server)
      .post("/executive/rental-items")
      .set("Authorization", executive)
      .send({
        name: "이른 수령 카트",
        totalQuantity: 1,
        durationType: "DAYS",
        durationValue: 14,
        isActive: true,
      })
      .expect(201);
    const apply = (pickup: string, returned: string) =>
      request(server)
        .post("/student/rentals")
        .set("Authorization", representative)
        .send({
          clubId,
          itemId: item.body.id,
          quantity: 1,
          pickup: slot(pickup),
          return: slot(returned),
          contactPhoneNumber: "010-1234-5678",
          purpose: "시간 외 수령 확인",
          clientRequestId: randomUUID(),
        });
    const act = (id: number, action: string) =>
      request(server)
        .post(`/executive/rentals/${id}/${action}`)
        .set("Authorization", executive)
        .send({});
    const earlier = await apply("2027-05-03", "2027-05-06").expect(201);
    const future = await apply("2027-05-10", "2027-05-13").expect(201);
    await act(earlier.body.id, "approve").expect(200);
    await act(future.body.id, "approve").expect(200);
    const blocked = await act(future.body.id, "checkout").expect(409);
    expect(blocked.body.message).toMatchObject({ message: "OUT_OF_STOCK" });
    await act(earlier.body.id, "checkout").expect(200);
    await act(earlier.body.id, "return").expect(200);
    await request(server)
      .put("/executive/office-hours/2027-05-10")
      .set("Authorization", executive)
      .send({ openTime: "21:00", closeTime: "22:00", isClosed: true })
      .expect(200);
    const checkedOut = await act(future.body.id, "checkout").expect(200);
    expect(checkedOut.body).toMatchObject({
      status: "CHECKED_OUT",
      checkedOutAt: now.toISOString(),
      pickup: slot("2027-05-10"),
    });
    const stock = await request(server)
      .get(`/rentals/items/${item.body.id}/return-options`)
      .query({ pickupDate: "2027-05-04" })
      .expect(200);
    expect(stock.body.options[0]).toMatchObject({
      date: "2027-05-05",
      availableQuantity: 0,
    });
    await apply("2027-05-04", "2027-05-05").expect(409);
    now = new Date("2027-05-20T08:00:00Z");
    await act(future.body.id, "return").expect(200);
    const prior = await prisma.rentalReservation.findUniqueOrThrow({
      where: { id: future.body.id },
    });
    const legacy = await prisma.rentalReservation.create({
      data: {
        ...prior,
        id: undefined,
        status: "RESERVED",
        approvedAt: null,
        approvedByExecutiveId: null,
        checkedOutAt: null,
        checkedOutByExecutiveId: null,
        returnedAt: null,
        returnedByExecutiveId: null,
        clientRequestId: randomUUID(),
      },
    });
    const stillApproved = await act(legacy.id, "approve").expect(200);
    expect(stillApproved.body).toMatchObject({
      status: "RESERVED",
      approvedAt: null,
      approvedByExecutiveId: null,
    });
    const late = await act(legacy.id, "checkout").expect(200);
    expect(late.body).toMatchObject({
      status: "CHECKED_OUT",
      checkedOutAt: now.toISOString(),
      approvedAt: null,
    });
    await act(legacy.id, "return").expect(200);
    const lateRequest = await prisma.rentalReservation.create({
      data: {
        ...prior,
        id: undefined,
        status: "REQUESTED",
        approvedAt: null,
        approvedByExecutiveId: null,
        checkedOutAt: null,
        checkedOutByExecutiveId: null,
        returnedAt: null,
        returnedByExecutiveId: null,
        clientRequestId: randomUUID(),
      },
    });
    const closedApproval = await act(lateRequest.id, "approve").expect(409);
    expect(closedApproval.body.message).toMatchObject({
      message: "OFFICE_HOURS_CHANGED",
    });
    await request(server)
      .put("/executive/office-hours/2027-05-10")
      .set("Authorization", executive)
      .send({ openTime: "21:00", closeTime: "22:00", isClosed: false })
      .expect(200);
    expect(
      (await act(lateRequest.id, "approve").expect(200)).body,
    ).toMatchObject({
      status: "RESERVED",
      approvedAt: now.toISOString(),
      approvedByExecutiveId: executiveId,
    });
    await act(lateRequest.id, "checkout").expect(200);
  });
});
