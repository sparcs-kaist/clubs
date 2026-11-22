import { ClubDelegateEnum } from "@clubs/domain/club/club-delegate";

import { ClubDelegateRepository } from "./club-delegate-repository";

describe("ClubDelegateRepository replaceForRegistration", () => {
  it("ends the previous role and the student's old role at the effective time", async () => {
    const effectiveAt = new Date("2026-08-27T14:59:00.000Z");
    const changedAt = new Date("2026-09-01T04:00:00.000Z");
    const delegate = {
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      findMany: jest
        .fn()
        .mockResolvedValueOnce([{ studentId: 10 }])
        .mockResolvedValueOnce([
          { clubDelegateEnum: ClubDelegateEnum.Delegate1 },
        ]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const requests = { updateMany: jest.fn() };
    const repository = new ClubDelegateRepository({
      tx: { clubDelegateD: delegate, clubDelegateChangeRequest: requests },
    } as never);

    await repository.replaceForRegistration({
      clubId: 42,
      studentId: 17160,
      clubDelegateEnumId: 1,
      effectiveAt,
      changedAt,
    });

    expect(delegate.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          clubId: 42,
          clubDelegateEnum: 1,
        }),
        data: { endTerm: effectiveAt },
      }),
    );
    expect(delegate.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ clubId: 42, studentId: 17160 }),
        data: { endTerm: effectiveAt },
      }),
    );
    expect(delegate.create).toHaveBeenCalledWith({
      data: {
        clubId: 42,
        studentId: 17160,
        clubDelegateEnum: 1,
        startTerm: effectiveAt,
      },
    });
    expect(requests.updateMany).toHaveBeenCalledWith({
      where: {
        clubId: 42,
        clubDelegateEnumId: { in: [1, ClubDelegateEnum.Delegate1] },
        clubDelegateChangeRequestStatusEnumId: 1,
        deletedAt: null,
      },
      data: { deletedAt: changedAt },
    });
  });

  it("preserves later delegate history", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue({ id: 99 }),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    };
    const repository = new ClubDelegateRepository({
      tx: { clubDelegateD: delegate },
    } as never);

    await expect(
      repository.replaceForRegistration({
        clubId: 42,
        studentId: 17160,
        clubDelegateEnumId: 1,
        effectiveAt: new Date("2026-08-27T14:59:00.000Z"),
        changedAt: new Date("2026-09-01T04:00:00.000Z"),
      }),
    ).rejects.toThrow("Delegate history already exists after effectiveAt");
    expect(delegate.updateMany).not.toHaveBeenCalled();
    expect(delegate.create).not.toHaveBeenCalled();
  });
});

describe("ClubDelegateRepository cancelForRegistration", () => {
  const effectiveAt = new Date("2026-08-27T14:59:00.000Z");
  const changedAt = new Date("2026-09-01T04:00:00.000Z");

  it("ends the requested delegate role at the effective time", async () => {
    const delegate = {
      findMany: jest.fn().mockResolvedValue([{ id: 50 }]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    const requests = { updateMany: jest.fn() };
    const repository = new ClubDelegateRepository({
      tx: { clubDelegateD: delegate, clubDelegateChangeRequest: requests },
    } as never);

    await repository.cancelForRegistration({
      clubId: 42,
      studentId: 17160,
      clubDelegateEnumId: ClubDelegateEnum.Delegate1,
      effectiveAt,
      changedAt,
    });

    expect(delegate.findMany).toHaveBeenCalledWith({
      where: {
        clubId: 42,
        studentId: 17160,
        clubDelegateEnum: ClubDelegateEnum.Delegate1,
        startTerm: { lte: effectiveAt },
        OR: [{ endTerm: { gt: effectiveAt } }, { endTerm: null }],
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(delegate.updateMany).toHaveBeenCalledWith({
      where: { id: 50, deletedAt: null },
      data: { endTerm: effectiveAt },
    });
    expect(requests.updateMany).toHaveBeenCalledWith({
      where: {
        clubId: 42,
        clubDelegateEnumId: ClubDelegateEnum.Delegate1,
        clubDelegateChangeRequestStatusEnumId: 1,
        deletedAt: null,
      },
      data: { deletedAt: changedAt },
    });
  });

  it("does not cancel the representative role", async () => {
    const delegate = { findMany: jest.fn(), updateMany: jest.fn() };
    const repository = new ClubDelegateRepository({
      tx: { clubDelegateD: delegate },
    } as never);

    await expect(
      repository.cancelForRegistration({
        clubId: 42,
        studentId: 17160,
        clubDelegateEnumId: ClubDelegateEnum.Representative,
        effectiveAt,
        changedAt,
      }),
    ).rejects.toThrow("Representative role cannot be canceled");
    expect(delegate.findMany).not.toHaveBeenCalled();
    expect(delegate.updateMany).not.toHaveBeenCalled();
  });
});
