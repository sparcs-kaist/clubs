import { ClubMemberRepository } from "./club-member.repository";

describe("ClubMemberRepository ensureMembershipForStudent", () => {
  const membership = {
    clubId: 42,
    semesterId: 20,
    studentId: 17160,
    startTerm: new Date("2026-08-28T15:00:00.000Z"),
    endTerm: new Date("2027-02-28T14:59:00.000Z"),
  };

  it("creates the applicant's membership for the approved club term", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const repository = new ClubMemberRepository({
      tx: { clubStudentT: delegate },
    } as never);

    await repository.ensureMembershipForStudent(membership);

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

  it("preserves an existing membership and its term", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue({ id: 88 }),
      create: jest.fn(),
      updateMany: jest.fn(),
    };
    const repository = new ClubMemberRepository({
      tx: { clubStudentT: delegate },
    } as never);

    await repository.ensureMembershipForStudent(membership);

    expect(delegate.create).not.toHaveBeenCalled();
    expect(delegate.updateMany).not.toHaveBeenCalled();
  });
});
