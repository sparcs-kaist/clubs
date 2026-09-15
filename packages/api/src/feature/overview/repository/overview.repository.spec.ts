import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { Clock } from "@sparcs-clubs/api/common/clock/clock";
import { withDeleted } from "@sparcs-clubs/api/common/util/soft-delete";
import { ClubOverviewRoomRepository } from "@sparcs-clubs/api/feature/club/repository/overview-room/club-overview-room.repository";
import { UserOverviewRepository } from "@sparcs-clubs/api/feature/user/repository/sso-login/user-overview.repository";

import { OverviewRepository } from "./overview.repository";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

const createFixture = () => {
  const now = new Date("2026-06-11T00:00:00Z");
  const clock: Clock = { now: () => now, endOfToday: jest.fn() };
  const semester = {
    id: 19,
    startTerm: new Date("2026-03-01T00:00:00Z"),
    endTerm: new Date("2026-08-31T14:59:59Z"),
  };
  const club = {
    id: 5,
    nameKr: "칼디",
    nameEn: "Kaldea",
    description: "커피 동아리",
    foundingYear: 2011,
  };
  const term = {
    clubId: 5,
    professorId: 7,
    clubStatusEnumId: 1,
    characteristicKr: "커피",
    characteristicEn: "Coffee",
  };
  const fundamental = {
    clubStatusEnumId: 1,
    club: {
      ...club,
      divisionId: 11,
      clubDivisionHistories: [
        {
          division: { name: "생활문화", district: { name: "문화" } },
        },
      ],
    },
  };
  const student = {
    id: 11,
    number: 20261234,
    name: "학생 이름",
    email: "representative@kaist.ac.kr",
    user: { name: "대표자", phoneNumber: "010-1234-5678" },
    studentTs: [{ department: 42 }],
  };
  const professor = {
    id: 7,
    name: "교수 이름",
    deletedAt: null as Date | null,
    user: { name: "지도교수" },
  };
  const room = {
    clubId: 5,
    clubBuildingEnum: 1,
    roomLocation: "N11",
    roomPassword: "1234",
  };
  const prisma = {
    semesterD: { findFirst: jest.fn().mockResolvedValue(semester) },
    clubT: { findMany: jest.fn().mockResolvedValue([fundamental]) },
    division: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { id: 11, name: "식생활", district: { name: "생활문화" } },
        ]),
    },
    department: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ departmentId: 42, name: "전산학부" }]),
    },
  };
  const clubs = { find: jest.fn().mockResolvedValue([club]) };
  const terms = { selectBySemesterId: jest.fn().mockResolvedValue([term]) };
  const delegates = {
    find: jest.fn().mockResolvedValue([
      {
        club: { id: 5 },
        student: { id: 11 },
        clubDelegateEnum: ClubDelegateEnum.Representative,
      },
    ]),
  };
  const rooms = { findBySemester: jest.fn().mockResolvedValue([room]) };
  const users = {
    findStudents: jest.fn().mockResolvedValue([student]),
    findProfessors: jest.fn().mockResolvedValue([professor]),
  };
  const members = {
    find: jest.fn().mockResolvedValue([
      { club: { id: 5 }, student: { id: 11 } },
      { club: { id: 5 }, student: { id: 12 } },
      { club: { id: 5 }, student: { id: 12 } },
    ]),
  };
  const registrations = {
    find: jest.fn().mockResolvedValue([
      { club: { id: 5 }, student: { id: 11 } },
      { club: { id: 5 }, student: { id: 11 } },
      { club: { id: 5 }, student: { id: 99 } },
    ]),
  };
  const repository = new OverviewRepository(
    prisma as never,
    clock,
    clubs as never,
    terms as never,
    delegates as never,
    rooms as never,
    users as never,
    members as never,
    registrations as never,
  );
  return {
    repository,
    prisma,
    clubs,
    terms,
    delegates,
    rooms,
    users,
    members,
    registrations,
    semester,
    fundamental,
    student,
    professor,
    room,
    now,
  };
};

describe("OverviewRepository", () => {
  it("retains selected-semester division history", async () => {
    const f = createFixture();
    expect(await f.repository.findClubsFundamentals(2026, "봄")).toEqual([
      {
        clubId: 5,
        division: "생활문화",
        district: "문화",
        clubNameKr: "칼디",
        clubNameEn: "Kaldea",
        clubStatus: 1,
      },
    ]);
    expect(f.prisma.clubT.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ semesterId: 19 }),
      }),
    );
  });

  it("joins batched scalar identities and deduplicates member counts", async () => {
    const f = createFixture();
    f.rooms.findBySemester.mockResolvedValue([
      f.room,
      { ...f.room, roomLocation: "later" },
    ]);
    expect(await f.repository.findClubs(2026, "봄")).toEqual([
      {
        clubId: 5,
        division: "생활문화",
        district: "문화",
        clubNameKr: "칼디",
        clubNameEn: "Kaldea",
        clubStatus: 1,
        description: "커피 동아리",
        characteristicKr: "커피",
        characteristicEn: "Coffee",
        advisor: "지도교수",
        foundingYear: 2011,
        clubBuildingEnum: 1,
        roomLocation: "N11",
        roomPassword: "1234",
        totalMemberCnt: 2n,
        regularMemberCnt: 1n,
      },
    ]);
    expect(f.clubs.find).toHaveBeenCalledWith({ id: [5] });
    expect(f.users.findProfessors).toHaveBeenCalledWith([7]);
    expect(f.rooms.findBySemester).toHaveBeenCalledWith([5], 19);
    expect(f.members.find).toHaveBeenCalledWith({
      clubId: [5],
      semesterId: 19,
    });
  });

  it.each(["missing", "deleted"])(
    "keeps clubs with %s professor and no room",
    async kind => {
      const f = createFixture();
      f.users.findProfessors.mockResolvedValue(
        kind === "missing"
          ? []
          : [
              {
                ...f.professor,
                deletedAt: f.now,
              },
            ],
      );
      f.rooms.findBySemester.mockResolvedValue([]);
      f.fundamental.club.clubDivisionHistories = [];
      expect(await f.repository.findClubs(2026, "봄")).toEqual([
        expect.objectContaining({
          division: "식생활",
          district: "생활문화",
          advisor: null,
          clubBuildingEnum: null,
          roomLocation: null,
          roomPassword: null,
        }),
      ]);
    },
  );

  it("uses historical student identity and selected-semester department", async () => {
    const f = createFixture();
    expect(await f.repository.findDelegates(2026, "봄")).toEqual([
      {
        clubId: 5,
        delegateType: ClubDelegateEnum.Representative,
        name: "대표자",
        studentNumber: 20261234,
        phoneNumber: "010-1234-5678",
        kaistEmail: "representative@kaist.ac.kr",
        department: "전산학부",
      },
    ]);
    expect(f.users.findStudents).toHaveBeenCalledWith([11], 19);
    expect(f.delegates.find).toHaveBeenCalledWith({ clubId: [5], date: f.now });
  });

  it.each([
    ["2026-09-01T00:00:00Z", "2026-12-31T14:59:59Z", "2026-09-01T00:00:00Z"],
    ["2025-09-01T00:00:00Z", "2025-12-31T14:59:59Z", "2025-12-31T14:59:59Z"],
  ])(
    "clamps the delegate date to the semester (%s)",
    async (start, end, expected) => {
      const f = createFixture();
      f.semester.startTerm = new Date(start);
      f.semester.endTerm = new Date(end);
      await f.repository.findDelegates(2026, "봄");
      expect(f.delegates.find).toHaveBeenCalledWith({
        clubId: [5],
        date: new Date(expected),
      });
    },
  );

  it("uses student names when there is no linked user or department", async () => {
    const f = createFixture();
    f.users.findStudents.mockResolvedValue([
      { ...f.student, user: null, studentTs: [] },
    ]);
    expect(await f.repository.findDelegates(2026, "봄")).toEqual([
      expect.objectContaining({
        name: "학생 이름",
        phoneNumber: null,
        department: "",
      }),
    ]);
  });

  it.each(["no-semester", "no-terms", "deleted-club"])(
    "returns no rows for %s",
    async kind => {
      const f = createFixture();
      if (kind === "no-semester")
        f.prisma.semesterD.findFirst.mockResolvedValue(null);
      if (kind === "no-terms") f.terms.selectBySemesterId.mockResolvedValue([]);
      if (kind === "deleted-club") f.clubs.find.mockResolvedValue([]);
      expect(await f.repository.findDelegates(2026, "봄")).toEqual([]);
      expect(await f.repository.findClubs(2026, "봄")).toEqual([]);
      expect(f.users.findStudents).not.toHaveBeenCalled();
      expect(f.users.findProfessors).not.toHaveBeenCalled();
    },
  );

  it("rejects a dangling delegate identity rather than attaching another student", async () => {
    const f = createFixture();
    f.users.findStudents.mockResolvedValue([]);
    await expect(f.repository.findDelegates(2026, "봄")).rejects.toThrow(
      "Overview delegate student missing",
    );
  });
});

describe("overview readers", () => {
  it("keeps historical identities while filtering student terms by semester", async () => {
    const prisma = {
      student: { findMany: jest.fn().mockResolvedValue([]) },
      professor: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const repository = new UserOverviewRepository(prisma as never);
    await repository.findStudents([11], 19);
    await repository.findProfessors([7]);
    expect(prisma.student.findMany).toHaveBeenCalledWith({
      where: withDeleted({ id: { in: [11] } }),
      select: {
        id: true,
        number: true,
        name: true,
        email: true,
        user: { select: { name: true, phoneNumber: true } },
        studentTs: {
          where: { semesterId: 19, deletedAt: null },
          select: { department: true },
          take: 1,
        },
      },
    });
    expect(prisma.professor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: withDeleted({ id: { in: [7] } }),
      }),
    );
  });

  it("loads only undeleted rooms in the requested semester and clubs", async () => {
    const prisma = { clubRoomT: { findMany: jest.fn().mockResolvedValue([]) } };
    await new ClubOverviewRoomRepository(prisma as never).findBySemester(
      [5],
      19,
    );
    expect(prisma.clubRoomT.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clubId: { in: [5] }, semesterId: 19, deletedAt: null },
      }),
    );
  });
});
