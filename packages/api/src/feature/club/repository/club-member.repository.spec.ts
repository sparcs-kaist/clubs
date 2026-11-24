import { ClubMemberRepository } from "./club-member.repository";

describe("ClubMemberRepository initializeMembershipForRegistration", () => {
  const membership = {
    clubId: 42,
    semesterId: 20,
    studentId: 17160,
    startTerm: new Date("2026-08-28T15:00:00.000Z"),
    endTerm: new Date("2027-02-28T14:59:00.000Z"),
  };

  const approvedAt = new Date("2026-09-01T02:00:00.000Z");

  it("creates the applicant's membership for the approved club term", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateMany: jest.fn(),
    };
    const repository = new ClubMemberRepository({
      tx: { clubStudentT: delegate },
    } as never);

    await repository.initializeMembershipForRegistration(
      membership,
      approvedAt,
    );

    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: {
        clubId: 42,
        semesterId: 20,
        studentId: 17160,
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(delegate.create).toHaveBeenCalledWith({ data: membership });
  });

  it("keeps the applicant's membership and soft-deletes only the other memberships for that club and semester", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue({ id: 88 }),
      create: jest.fn(),
      updateMany: jest.fn(),
    };
    const repository = new ClubMemberRepository({
      tx: { clubStudentT: delegate },
    } as never);

    await repository.initializeMembershipForRegistration(
      membership,
      approvedAt,
    );

    expect(delegate.create).not.toHaveBeenCalled();
    expect(delegate.updateMany).toHaveBeenCalledTimes(1);
    expect(delegate.updateMany).toHaveBeenCalledWith({
      where: {
        clubId: membership.clubId,
        semesterId: membership.semesterId,
        studentId: { not: membership.studentId },
        deletedAt: null,
      },
      data: { deletedAt: approvedAt },
    });
  });
});
