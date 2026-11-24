import {
  ClubDelegateChangeRequestStatusEnum as Status,
  ClubDelegateEnum as Role,
} from "@clubs/interface/common/enum/club.enum";

import ClubDelegateService from "./delegate.service";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));
jest.mock("@nestjs-cls/transactional", () => ({
  ...jest.requireActual("@nestjs-cls/transactional"),
  Transactional: () => () => undefined,
}));

const now = new Date("2026-11-23T03:00:00Z");
const clubId = 42;
const semesterId = 20;
const formerId = 10;
const incomingId = 20;
const phoneNumber = "010-1234-5678";

function fixture(sourceRole?: Role) {
  const representative = {
    studentId: formerId,
    clubId,
    clubDelegateEnum: Role.Representative,
  };
  const sourceTerms =
    sourceRole === undefined
      ? []
      : [{ studentId: incomingId, clubId, clubDelegateEnum: sourceRole }];
  const repo = {
    findRequestById: jest.fn().mockResolvedValue({
      id: 1,
      clubId,
      studentId: incomingId,
      prevStudentId: formerId,
      clubDelegateEnumId: Role.Representative,
    }),
    lockChanges: jest.fn(),
    finishRequest: jest.fn().mockResolvedValue({ count: 1 }),
    findDelegateByClubId: jest
      .fn()
      .mockResolvedValue([representative, ...sourceTerms]),
    findCandidateMembership: jest.fn().mockResolvedValue({ id: 1 }),
    findDelegateByStudentId: jest
      .fn()
      .mockImplementation(async (studentId: number) =>
        studentId === incomingId ? sourceTerms : [],
      ),
    updateDelegate: jest.fn(),
    cancelPendingRequests: jest.fn(),
  };
  const users = {
    findStudentContacts: jest
      .fn()
      .mockImplementation(async (studentIds: number[]) =>
        studentIds.map(id => ({ id, user: { id: id * 10 } })),
      ),
    updatePhoneNumber: jest.fn(),
  };
  const service = new ClubDelegateService(
    repo as never,
    users as never,
    {} as never,
    { loadId: async () => semesterId } as never,
  );
  Object.assign(service, { clock: { now: () => now } });
  const accept = () =>
    service.patchStudentClubsDelegatesRequest({
      studentId: incomingId,
      userId: incomingId * 10,
      param: { requestId: 1 },
      body: {
        clubDelegateChangeRequestStatusEnum: Status.Approved,
        phoneNumber,
      },
    });
  return { service, repo, users, accept };
}

describe("representative role swaps", () => {
  it.each([Role.Delegate1, Role.Delegate2])(
    "swaps the former representative into the incoming representative's deputy role %s",
    async sourceRole => {
      const { repo, users, accept } = fixture(sourceRole);

      await accept();

      expect(repo.lockChanges).toHaveBeenCalledWith(
        clubId,
        incomingId,
        formerId,
      );
      expect(repo.updateDelegate.mock.calls).toEqual([
        [
          {
            clubId,
            clubDelegateEnumId: Role.Representative,
            studentId: incomingId,
            now,
            semesterId,
          },
        ],
        [
          {
            clubId,
            clubDelegateEnumId: sourceRole,
            studentId: formerId,
            now,
            semesterId,
          },
        ],
      ]);
      expect(repo.findCandidateMembership).toHaveBeenNthCalledWith(
        2,
        formerId,
        clubId,
        semesterId,
      );
      expect(repo.cancelPendingRequests).toHaveBeenCalledWith(
        { clubId, clubDelegateEnumId: sourceRole },
        now,
      );
      expect(users.updatePhoneNumber.mock.calls).toEqual([
        [incomingId * 10, phoneNumber],
      ]);
    },
  );

  it("replaces the representative without assigning the former representative a role when the incoming student was not a deputy", async () => {
    const { repo, accept } = fixture();

    await accept();

    expect(repo.updateDelegate).toHaveBeenCalledTimes(1);
    expect(repo.cancelPendingRequests).not.toHaveBeenCalled();
  });

  it("rejects duplicate source-slot terms before writing phone or role changes", async () => {
    const { repo, users, accept } = fixture(Role.Delegate1);
    repo.findDelegateByClubId.mockResolvedValue([
      { studentId: formerId, clubId, clubDelegateEnum: Role.Representative },
      { studentId: incomingId, clubId, clubDelegateEnum: Role.Delegate1 },
      { studentId: 30, clubId, clubDelegateEnum: Role.Delegate1 },
    ]);

    await expect(accept()).rejects.toThrow(
      "동아리 직책 임기 정보가 중복되어 있습니다.",
    );

    expect(users.updatePhoneNumber).not.toHaveBeenCalled();
    expect(repo.updateDelegate).not.toHaveBeenCalled();
  });

  it("does not assign a deputy role to a former representative without current membership", async () => {
    const { repo, accept } = fixture(Role.Delegate1);
    repo.findCandidateMembership
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(null);

    await expect(accept()).rejects.toThrow(
      "현재 동아리에서 직책을 맡을 수 없는 학생입니다.",
    );

    expect(repo.updateDelegate).toHaveBeenCalledTimes(1);
    expect(repo.cancelPendingRequests).not.toHaveBeenCalled();
  });
});
