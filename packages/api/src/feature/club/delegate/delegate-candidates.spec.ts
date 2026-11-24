import apiClb008 from "@clubs/interface/api/club/endpoint/apiClb008";
import { ClubDelegateEnum as Role } from "@clubs/interface/common/enum/club.enum";

import UserRepository from "@sparcs-clubs/api/feature/user/repository/user.repository";

import { ClubDelegateDRepository } from "./club.club-delegate-d.repository";
import ClubDelegateService from "./delegate.service";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const now = new Date("2026-11-23T03:00:00Z");
const clubId = 42;
const semesterId = 20;

function fixture() {
  const phoneNumbers = [
    "010-1234-5678",
    null,
    "042-123-4567",
    "010-1234-5678",
    "010-1234-5678",
  ];
  const memberships = jest
    .fn()
    .mockResolvedValue([1, 2, 3, 4, 5, 6, 7].map(studentId => ({ studentId })));
  const roles = jest.fn().mockResolvedValue([
    {
      studentId: 1,
      clubId,
      clubDelegateEnum: Role.Representative,
      club: { nameKr: "현재 동아리", nameEn: null },
    },
    {
      studentId: 2,
      clubId,
      clubDelegateEnum: Role.Delegate1,
      club: { nameKr: "현재 동아리", nameEn: null },
    },
    {
      studentId: 3,
      clubId: 43,
      clubDelegateEnum: Role.Representative,
      club: { nameKr: null, nameEn: "Khartes" },
    },
    {
      studentId: 4,
      clubId: 44,
      clubDelegateEnum: Role.Delegate2,
      club: { nameKr: "  ", nameEn: null },
    },
    {
      studentId: 4,
      clubId: 45,
      clubDelegateEnum: Role.Delegate1,
      club: { nameKr: null, nameEn: null },
    },
  ]);
  const contacts = jest.fn().mockResolvedValue([
    ...[1, 2, 3, 4, 5].map(id => ({
      id,
      number: 20260000 + id,
      name: `학생${id}`,
      user: {
        id,
        phoneNumber: phoneNumbers[id - 1],
        deletedAt: null,
      },
    })),
    { id: 6, number: 20260006, name: "연결 없는 학생", user: null },
    {
      id: 7,
      number: 20260007,
      name: "삭제된 사용자",
      user: { id: 7, phoneNumber: null, deletedAt: now },
    },
  ]);
  const txHost = {
    tx: {
      clubStudentT: { findMany: memberships },
      clubDelegateD: { findMany: roles },
      student: { findMany: contacts },
    },
  };
  const repository = new ClubDelegateDRepository({} as never, txHost as never);
  Object.assign(repository, { clock: { now: () => now } });
  const users = new UserRepository({} as never);
  Object.assign(users, { txHost });
  const clubPermissions = {
    isStudentPresident: jest.fn().mockResolvedValue(true),
    isStudentDelegate: jest.fn().mockResolvedValue(true),
  };
  const service = new ClubDelegateService(
    repository,
    { findStudentContacts: users.findStudentContacts.bind(users) } as never,
    clubPermissions as never,
    { loadId: async () => semesterId } as never,
  );
  return { repository, service, memberships, roles, contacts, clubPermissions };
}

describe("CLB008 delegate candidates", () => {
  it("loads current-semester members and only current, non-deleted role terms", async () => {
    const { repository, memberships, roles } = fixture();

    await repository.findDelegateCandidates({ clubId, semesterId });

    expect(memberships).toHaveBeenCalledWith({
      where: { clubId, semesterId, deletedAt: null, club: { deletedAt: null } },
      distinct: ["studentId"],
      select: { studentId: true },
    });
    expect(roles).toHaveBeenCalledWith({
      where: {
        studentId: { in: [1, 2, 3, 4, 5, 6, 7] },
        startTerm: { lte: now },
        deletedAt: null,
        OR: [{ endTerm: { gt: now } }, { endTerm: null }],
      },
      select: {
        studentId: true,
        clubId: true,
        clubDelegateEnum: true,
        club: { select: { nameKr: true, nameEn: true } },
      },
    });
  });

  it.each([Role.Representative, Role.Delegate1, Role.Delegate2])(
    "returns all members with current roles and nullable contacts for target role %s",
    async delegateEnumId => {
      const { service, clubPermissions } = fixture();
      const response = await service.getStudentClubDelegateCandidates({
        studentId: 1,
        param: { clubId, delegateEnumId },
      });
      const parsed = apiClb008.responseBodyMap[200].parse(
        JSON.parse(JSON.stringify(response)),
      );

      expect(parsed.students.map(student => student.id)).toEqual([
        1, 2, 3, 4, 5,
      ]);
      expect(parsed.students.map(student => student.currentRoles)).toEqual([
        [
          {
            clubId,
            clubName: "현재 동아리",
            delegateEnumId: Role.Representative,
          },
        ],
        [{ clubId, clubName: "현재 동아리", delegateEnumId: Role.Delegate1 }],
        [
          {
            clubId: 43,
            clubName: "Khartes",
            delegateEnumId: Role.Representative,
          },
        ],
        [
          {
            clubId: 44,
            clubName: "동아리 #44",
            delegateEnumId: Role.Delegate2,
          },
          {
            clubId: 45,
            clubName: "동아리 #45",
            delegateEnumId: Role.Delegate1,
          },
        ],
        [],
      ]);
      expect(parsed.students[1].phoneNumber).toBeNull();
      expect(parsed.students[2].phoneNumber).toBe("042-123-4567");
      if (delegateEnumId === Role.Representative) {
        expect(clubPermissions.isStudentPresident).toHaveBeenCalledWith(
          1,
          clubId,
        );
        expect(clubPermissions.isStudentDelegate).not.toHaveBeenCalled();
      } else {
        expect(clubPermissions.isStudentDelegate).toHaveBeenCalledWith(
          1,
          clubId,
        );
        expect(clubPermissions.isStudentPresident).not.toHaveBeenCalled();
      }
    },
  );
});
