import { Test, TestingModule } from "@nestjs/testing";

import {
  ClubDelegateChangeRequestStatusEnum as Status,
  ClubDelegateEnum as Role,
} from "@clubs/interface/common/enum/club.enum";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { ClubDelegateDRepository } from "@sparcs-clubs/api/feature/club/delegate/club.club-delegate-d.repository";
import ClubDelegateService from "@sparcs-clubs/api/feature/club/delegate/delegate.service";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserRepository from "@sparcs-clubs/api/feature/user/repository/user.repository";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";
import { PrismaModule } from "@sparcs-clubs/api/prisma/prisma.module";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

jest.setTimeout(30_000);

const oldPhone = "010-1234-5678";
const newPhone = "010-9876-5432";
const now = new Date("2026-11-21T06:00:00Z");
const startTerm = new Date("2026-09-01T00:00:00Z");
const endTerm = new Date("2026-12-31T00:00:00Z");

describe("club delegate requests with MySQL", () => {
  let fixture: TestingModule;
  let service: ClubDelegateService;
  let repo: ClubDelegateDRepository;
  let prisma: PrismaService;
  let semesterId: number;
  let clubId: number;
  let representative: number;
  let target: { studentId: number; userId: number };
  let other: { studentId: number; userId: number };

  beforeAll(async () => {
    fixture = await Test.createTestingModule({
      imports: [ClockModule, PrismaModule, TransactionModule],
      providers: [
        ClubDelegateDRepository,
        ClubDelegateService,
        UserRepository,
        {
          provide: UserPublicService,
          inject: [UserRepository],
          useFactory: (users: UserRepository) => ({
            updatePhoneNumber: users.updatePhoneNumber.bind(users),
            findStudentContacts: users.findStudentContacts.bind(users),
          }),
        },
        { provide: ClubPublicService, useValue: {} },
        {
          provide: SemesterPublicService,
          useValue: { loadId: async () => semesterId },
        },
      ],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => now })
      .compile();
    await fixture.init();
    service = fixture.get(ClubDelegateService);
    repo = fixture.get(ClubDelegateDRepository);
    prisma = fixture.get(PrismaService);
  });

  async function seedMember(number: number) {
    const user = await prisma.user.create({
      data: { name: String(number), phoneNumber: oldPhone },
    });
    const student = await prisma.student.create({
      data: { name: user.name, number, userId: user.id },
    });
    await prisma.clubStudentT.create({
      data: { studentId: student.id, clubId, semesterId, startTerm, endTerm },
    });
    return { studentId: student.id, userId: user.id };
  }

  beforeEach(async () => {
    await clearDatabase();
    const district = await prisma.district.create({
      data: { name: "테스트 지구" },
    });
    const division = await prisma.division.create({
      data: { name: "테스트 분과", districtId: district.id },
    });
    const club = await prisma.club.create({
      data: {
        nameKr: "테스트 동아리",
        foundingYear: 2020,
        divisionId: division.id,
      },
    });
    clubId = club.id;
    const semester = await prisma.semesterD.create({
      data: { year: 2026, name: "Fall", startTerm, endTerm },
    });
    semesterId = semester.id;
    representative = (await seedMember(20260001)).studentId;
    target = await seedMember(20260002);
    other = await seedMember(20260003);
    await prisma.clubDelegateD.create({
      data: {
        clubId,
        studentId: representative,
        clubDelegateEnum: Role.Representative,
        startTerm,
      },
    });
  });

  afterAll(async () => {
    await fixture?.close();
    await closeDatabase();
  });

  function nominate(studentId = target.studentId, role: Role = Role.Delegate1) {
    return service.putStudentClubDelegate({
      studentId: representative,
      targetStudentId: studentId,
      clubId,
      clubDelegateEnumId: role,
    });
  }

  function accept(requestId: number, phoneNumber = oldPhone) {
    return service.patchStudentClubsDelegatesRequest({
      ...target,
      param: { requestId },
      body: {
        clubDelegateChangeRequestStatusEnum: Status.Approved,
        phoneNumber,
      },
    });
  }

  async function currentTargetRoles() {
    return repo.findDelegateByStudentId(target.studentId, now);
  }

  it.each([Role.Delegate1, Role.Delegate2])(
    "waits for confirmation then appoints role %s",
    async role => {
      await nominate(target.studentId, role);
      expect(await currentTargetRoles()).toHaveLength(0);
      const received = await service.getStudentClubsDelegatesRequests({
        studentId: target.studentId,
      });
      expect(received.requests).toEqual([
        expect.objectContaining({ delegateEnumId: role }),
      ]);
      const [{ id }] = received.requests;
      const responses = await Promise.allSettled([accept(id), accept(id)]);
      expect(responses.map(result => result.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      expect(await currentTargetRoles()).toEqual([
        expect.objectContaining({ clubDelegateEnum: role }),
      ]);
      expect(
        await prisma.user.findUnique({ where: { id: target.userId } }),
      ).toMatchObject({ phoneNumber: oldPhone });
    },
  );

  it.each([Role.Delegate1, Role.Delegate2])(
    "swaps the representative with deputy role %s only after the incoming representative accepts",
    async sourceRole => {
      await prisma.clubT.create({
        data: { clubId, semesterId, clubStatusEnumId: 1, startTerm, endTerm },
      });
      const sourceTerm = await prisma.clubDelegateD.create({
        data: {
          clubId,
          studentId: target.studentId,
          clubDelegateEnum: sourceRole,
          startTerm,
        },
      });
      const representativeTerm = await prisma.clubDelegateD.findFirstOrThrow({
        where: {
          clubId,
          studentId: representative,
          clubDelegateEnum: Role.Representative,
        },
      });
      const otherRole =
        sourceRole === Role.Delegate1 ? Role.Delegate2 : Role.Delegate1;
      const unaffectedTerm = await prisma.clubDelegateD.create({
        data: {
          clubId,
          studentId: other.studentId,
          clubDelegateEnum: otherRole,
          startTerm,
        },
      });
      const sibling = await seedMember(20260004);
      await nominate(sibling.studentId, sourceRole);
      const sourceRequest =
        await prisma.clubDelegateChangeRequest.findFirstOrThrow({
          where: { studentId: sibling.studentId },
        });
      await nominate(target.studentId, Role.Representative);
      const moveRequest =
        await prisma.clubDelegateChangeRequest.findFirstOrThrow({
          where: { studentId: target.studentId },
        });

      expect(await currentTargetRoles()).toEqual([
        expect.objectContaining({
          id: sourceTerm.id,
          clubDelegateEnum: sourceRole,
        }),
      ]);
      expect(await repo.findDelegateByStudentId(representative, now)).toEqual([
        expect.objectContaining({
          id: representativeTerm.id,
          clubDelegateEnum: Role.Representative,
        }),
      ]);

      await accept(moveRequest.id, newPhone);

      expect(await currentTargetRoles()).toEqual([
        expect.objectContaining({
          clubDelegateEnum: Role.Representative,
          startTerm: now,
        }),
      ]);
      expect(await repo.findDelegateByStudentId(representative, now)).toEqual([
        expect.objectContaining({
          clubDelegateEnum: sourceRole,
          startTerm: now,
        }),
      ]);
      expect(await repo.findDelegateByStudentId(other.studentId, now)).toEqual([
        expect.objectContaining({
          id: unaffectedTerm.id,
          clubDelegateEnum: otherRole,
        }),
      ]);
      const registrations =
        await prisma.registrationApplicationStudent.findMany({
          where: { clubId, semesterId, deletedAt: null },
        });
      expect(registrations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            studentId: target.studentId,
            registrationApplicationStudentEnum:
              RegistrationApplicationStudentStatusEnum.Approved,
          }),
          expect.objectContaining({
            studentId: representative,
            registrationApplicationStudentEnum:
              RegistrationApplicationStudentStatusEnum.Approved,
          }),
        ]),
      );
      expect(
        await prisma.clubDelegateD.findUnique({ where: { id: sourceTerm.id } }),
      ).toMatchObject({ endTerm: now });
      expect(
        await prisma.clubDelegateD.findUnique({
          where: { id: representativeTerm.id },
        }),
      ).toMatchObject({ endTerm: now });
      expect(
        await prisma.clubDelegateChangeRequest.findUnique({
          where: { id: sourceRequest.id },
        }),
      ).toMatchObject({ deletedAt: now });
      await expect(
        service.patchStudentClubsDelegatesRequest({
          ...sibling,
          param: { requestId: sourceRequest.id },
          body: {
            clubDelegateChangeRequestStatusEnum: Status.Approved,
            phoneNumber: oldPhone,
          },
        }),
      ).rejects.toThrow("이미 처리되었거나 만료된 요청입니다.");
    },
  );

  it("preserves the representative, deputies and source-slot requests when a swap is declined", async () => {
    await prisma.clubDelegateD.createMany({
      data: [
        {
          clubId,
          studentId: target.studentId,
          clubDelegateEnum: Role.Delegate1,
          startTerm,
        },
        {
          clubId,
          studentId: other.studentId,
          clubDelegateEnum: Role.Delegate2,
          startTerm,
        },
      ],
    });
    const sibling = await seedMember(20260004);
    await nominate(sibling.studentId, Role.Delegate1);
    await nominate(target.studentId, Role.Representative);
    const { id } = await prisma.clubDelegateChangeRequest.findFirstOrThrow({
      where: { studentId: target.studentId },
    });
    await service.patchStudentClubsDelegatesRequest({
      ...target,
      param: { requestId: id },
      body: { clubDelegateChangeRequestStatusEnum: Status.Rejected },
    });

    expect(await currentTargetRoles()).toEqual([
      expect.objectContaining({ clubDelegateEnum: Role.Delegate1 }),
    ]);
    expect(await repo.findDelegateByStudentId(other.studentId, now)).toEqual([
      expect.objectContaining({ clubDelegateEnum: Role.Delegate2 }),
    ]);
    expect(await repo.findDelegateByStudentId(representative, now)).toEqual([
      expect.objectContaining({ clubDelegateEnum: Role.Representative }),
    ]);
    expect(
      (
        await service.getStudentClubsDelegatesRequests({
          studentId: sibling.studentId,
        })
      ).requests,
    ).toHaveLength(1);
  });

  it.each([
    "invalid former membership",
    "duplicate source slot",
    "second role write failure",
  ])("rolls back a swap on %s", async failure => {
    const sourceTerm = await prisma.clubDelegateD.create({
      data: {
        clubId,
        studentId: target.studentId,
        clubDelegateEnum: Role.Delegate1,
        startTerm,
      },
    });
    const [representativeTerm] = await repo.findDelegateByStudentId(
      representative,
      now,
    );
    await nominate(other.studentId, Role.Delegate1);
    const sourceRequest =
      await prisma.clubDelegateChangeRequest.findFirstOrThrow({
        where: { studentId: other.studentId },
      });
    await nominate(target.studentId, Role.Representative);
    const request = await prisma.clubDelegateChangeRequest.findFirstOrThrow({
      where: { studentId: target.studentId },
    });
    let failureSpy: jest.SpyInstance | undefined;
    if (failure === "invalid former membership") {
      await prisma.clubStudentT.updateMany({
        where: { clubId, studentId: representative },
        data: { deletedAt: now },
      });
    }
    if (failure === "duplicate source slot") {
      await prisma.clubDelegateD.create({
        data: {
          clubId,
          studentId: other.studentId,
          clubDelegateEnum: Role.Delegate1,
          startTerm,
        },
      });
    }
    if (failure === "second role write failure") {
      const updateDelegate = repo.updateDelegate.bind(repo);
      failureSpy = jest
        .spyOn(repo, "updateDelegate")
        .mockImplementationOnce(updateDelegate)
        .mockRejectedValueOnce(new Error("simulated swap failure"));
    }
    try {
      await expect(accept(request.id, newPhone)).rejects.toThrow();
    } finally {
      failureSpy?.mockRestore();
    }
    expect(await currentTargetRoles()).toEqual([
      expect.objectContaining({
        id: sourceTerm.id,
        clubDelegateEnum: Role.Delegate1,
      }),
    ]);
    expect(await repo.findDelegateByStudentId(representative, now)).toEqual([
      expect.objectContaining({
        id: representativeTerm.id,
        clubDelegateEnum: Role.Representative,
      }),
    ]);
    expect(
      await prisma.user.findUnique({ where: { id: target.userId } }),
    ).toMatchObject({ phoneNumber: oldPhone });
    expect(
      await prisma.clubDelegateChangeRequest.findUnique({
        where: { id: request.id },
      }),
    ).toMatchObject({
      clubDelegateChangeRequestStatusEnumId: Status.Applied,
      deletedAt: null,
    });
    expect(
      await prisma.clubDelegateChangeRequest.findUnique({
        where: { id: sourceRequest.id },
      }),
    ).toMatchObject({ deletedAt: null });
  });

  it.each([Role.Delegate1, Role.Delegate2])(
    "rejects reappointment to the same deputy role %s",
    async role => {
      await prisma.clubDelegateD.create({
        data: {
          clubId,
          studentId: target.studentId,
          clubDelegateEnum: role,
          startTerm,
        },
      });
      await expect(nominate(target.studentId, role)).rejects.toThrow(
        "대상자가 이미 동아리 직책을 맡고 있습니다.",
      );
      expect(await prisma.clubDelegateChangeRequest.count()).toBe(0);
    },
  );

  it.each([
    [Role.Delegate1, Role.Delegate2],
    [Role.Delegate2, Role.Delegate1],
  ])(
    "rejects direct deputy moves from %s to %s",
    async (sourceRole, targetRole) => {
      await prisma.clubDelegateD.create({
        data: {
          clubId,
          studentId: target.studentId,
          clubDelegateEnum: sourceRole,
          startTerm,
        },
      });
      await expect(nominate(target.studentId, targetRole)).rejects.toThrow(
        "대상자가 이미 동아리 직책을 맡고 있습니다.",
      );
      expect(await prisma.clubDelegateChangeRequest.count()).toBe(0);
    },
  );

  it("rejects a deputy who holds a role in another club", async () => {
    const currentClub = await prisma.club.findUniqueOrThrow({
      where: { id: clubId },
    });
    const otherClub = await prisma.club.create({
      data: {
        nameKr: "다른 동아리",
        foundingYear: 2020,
        divisionId: currentClub.divisionId,
      },
    });
    await prisma.clubDelegateD.create({
      data: {
        clubId: otherClub.id,
        studentId: target.studentId,
        clubDelegateEnum: Role.Delegate1,
        startTerm,
      },
    });
    await expect(nominate(target.studentId, Role.Delegate2)).rejects.toThrow(
      "대상자가 다른 동아리에서 직책을 맡고 있습니다.",
    );
    expect(await prisma.clubDelegateChangeRequest.count()).toBe(0);
  });

  it("rejects a candidate with multiple current role terms", async () => {
    await prisma.clubDelegateD.createMany({
      data: [Role.Delegate1, Role.Delegate2].map(clubDelegateEnum => ({
        clubId,
        studentId: target.studentId,
        clubDelegateEnum,
        startTerm,
      })),
    });
    await expect(
      nominate(target.studentId, Role.Representative),
    ).rejects.toThrow("대상자의 직책 임기 정보가 중복되어 있습니다.");
    expect(await prisma.clubDelegateChangeRequest.count()).toBe(0);
  });

  it("serializes two nominations for the same vacant role", async () => {
    const responses = await Promise.allSettled([
      nominate(),
      nominate(other.studentId),
    ]);
    expect(responses.map(result => result.status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    expect(await prisma.clubDelegateChangeRequest.count()).toBe(1);
  });

  it("allows only one outcome when cancellation and acceptance race", async () => {
    await nominate();
    const { id } = await prisma.clubDelegateChangeRequest.findFirstOrThrow();
    const responses = await Promise.allSettled([
      accept(id, newPhone),
      service.deleteStudentClubDelegateRequests({
        param: { clubId },
        studentId: representative,
        requestId: id,
      }),
    ]);
    expect(responses.map(result => result.status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    const accepted = responses[0].status === "fulfilled";
    expect(await currentTargetRoles()).toHaveLength(accepted ? 1 : 0);
    expect(
      await prisma.user.findUnique({ where: { id: target.userId } }),
    ).toMatchObject({ phoneNumber: accepted ? newPhone : oldPhone });
  });

  it("rolls back contact, term and status if appointment fails after writing the term", async () => {
    await nominate();
    const { id } = await prisma.clubDelegateChangeRequest.findFirstOrThrow();
    const updateDelegate = repo.updateDelegate.bind(repo);
    const failure = jest
      .spyOn(repo, "updateDelegate")
      .mockImplementationOnce(async data => {
        await updateDelegate(data);
        throw new Error("simulated failure after term write");
      });
    try {
      await expect(accept(id, newPhone)).rejects.toThrow(
        "simulated failure after term write",
      );
    } finally {
      failure.mockRestore();
    }
    expect(await currentTargetRoles()).toHaveLength(0);
    expect(
      await prisma.user.findUnique({ where: { id: target.userId } }),
    ).toMatchObject({ phoneNumber: oldPhone });
    expect(
      await prisma.clubDelegateChangeRequest.findUnique({ where: { id } }),
    ).toMatchObject({ clubDelegateChangeRequestStatusEnumId: Status.Applied });
  });

  it("invalidates a pending request when the current delegate is removed", async () => {
    await prisma.clubDelegateD.create({
      data: {
        clubId,
        studentId: other.studentId,
        clubDelegateEnum: Role.Delegate1,
        startTerm,
      },
    });
    await nominate();
    const { id } = await prisma.clubDelegateChangeRequest.findFirstOrThrow();
    const sibling = await seedMember(20260004);
    await nominate(sibling.studentId, Role.Delegate2);
    await nominate(0);

    const remaining = await service.getStudentClubsDelegatesRequests({
      studentId: sibling.studentId,
    });
    expect(remaining.requests).toEqual([
      expect.objectContaining({ delegateEnumId: Role.Delegate2 }),
    ]);
    await expect(accept(id, newPhone)).rejects.toThrow(
      "이미 처리되었거나 만료된 요청입니다.",
    );
    expect(await currentTargetRoles()).toHaveLength(0);
    expect(
      await repo.findDelegateByStudentId(other.studentId, now),
    ).toHaveLength(0);
    expect(
      await prisma.user.findUnique({ where: { id: target.userId } }),
    ).toMatchObject({ phoneNumber: oldPhone });
  });

  it("blocks a second request for the same candidate and allows a different candidate for another role", async () => {
    await nominate();
    await expect(nominate(target.studentId, Role.Delegate2)).rejects.toThrow(
      "해당 직책 또는 대상자에게 대기 중인 요청이 있습니다.",
    );
    await expect(
      nominate(other.studentId, Role.Delegate2),
    ).resolves.toBeUndefined();
  });

  it("rejects an older representative request when the requester no longer holds the role", async () => {
    const { id } = await prisma.clubDelegateChangeRequest.create({
      data: {
        clubId,
        prevStudentId: other.studentId,
        studentId: target.studentId,
        clubDelegateChangeRequestStatusEnumId: Status.Applied,
        createdAt: now,
      },
    });
    await expect(accept(id, newPhone)).rejects.toThrow(
      "요청 이후 동아리 대표자가 변경되었습니다.",
    );
    expect(await currentTargetRoles()).toHaveLength(0);
    expect(
      await prisma.user.findUnique({ where: { id: target.userId } }),
    ).toMatchObject({ phoneNumber: oldPhone });
  });

  it("rejects a request at the three-day expiry and opens the slot for another request", async () => {
    await nominate();
    const { id } = await prisma.clubDelegateChangeRequest.findFirstOrThrow();
    await prisma.clubDelegateChangeRequest.update({
      where: { id },
      data: { createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    });
    await expect(accept(id, newPhone)).rejects.toThrow("만료된 요청입니다.");
    await expect(nominate(other.studentId)).resolves.toBeUndefined();
  });

  it("declines without writing a number or a term", async () => {
    await nominate();
    const { id } = await prisma.clubDelegateChangeRequest.findFirstOrThrow();
    await service.patchStudentClubsDelegatesRequest({
      ...target,
      param: { requestId: id },
      body: { clubDelegateChangeRequestStatusEnum: Status.Rejected },
    });
    expect(await currentTargetRoles()).toHaveLength(0);
    expect(
      await prisma.user.findUnique({ where: { id: target.userId } }),
    ).toMatchObject({ phoneNumber: oldPhone });
    expect(
      await prisma.clubDelegateChangeRequest.findUnique({ where: { id } }),
    ).toMatchObject({ clubDelegateChangeRequestStatusEnumId: Status.Rejected });
  });

  it("preserves eligible pending legacy representative requests", async () => {
    const { id } = await prisma.clubDelegateChangeRequest.create({
      data: {
        clubId,
        prevStudentId: representative,
        studentId: target.studentId,
        clubDelegateChangeRequestStatusEnumId: Status.Applied,
        createdAt: now,
      },
    });
    await accept(id, newPhone);
    expect(await currentTargetRoles()).toEqual([
      expect.objectContaining({ clubDelegateEnum: Role.Representative }),
    ]);
    expect(
      await repo.findDelegateByStudentId(representative, now),
    ).toHaveLength(0);
  });
});
