import { FundingDeadlineSqlRepository } from "./funding.sql.repository";

const NOW = new Date("2026-06-03T12:00:00.000Z");

const injectTestClock = <T extends object>(target: T): T =>
  Object.assign(target, {
    clock: {
      now: () => NOW,
    },
  });

const createRepository = () => {
  const tx = {
    fundingDeadlineD: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const txHost = { tx };
  const repository = injectTestClock(
    new FundingDeadlineSqlRepository(txHost as never),
  );

  return { repository, tx };
};

describe("FundingDeadlineSqlRepository", () => {
  it("checks existing deadlines through TransactionHost tx", async () => {
    const { repository, tx } = createRepository();
    const startTerm = new Date("2026-03-01T00:00:00.000Z");
    const endTerm = new Date("2026-03-02T00:00:00.000Z");

    await expect(
      repository.checkExistingFundingDeadline(19, startTerm, endTerm),
    ).resolves.toBe(false);

    expect(tx.fundingDeadlineD.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        semesterId: 19,
        deletedAt: null,
      }),
      select: { id: true },
    });

    tx.fundingDeadlineD.findFirst.mockResolvedValueOnce({ id: 99 });
    await expect(
      repository.checkExistingFundingDeadline(19, startTerm, endTerm),
    ).resolves.toBe(true);
  });

  it("creates funding deadlines through TransactionHost tx", async () => {
    const { repository, tx } = createRepository();
    const startTerm = new Date("2026-03-01T00:00:00.000Z");
    const endTerm = new Date("2026-03-02T00:00:00.000Z");

    await expect(
      repository.createFundingDeadline(startTerm, endTerm, 1, 19),
    ).resolves.toBe(true);

    expect(tx.fundingDeadlineD.create).toHaveBeenCalledWith({
      data: {
        startTerm,
        endTerm,
        deadlineEnum: 1,
        semesterId: 19,
      },
    });
  });

  it("lists funding deadlines through TransactionHost tx", async () => {
    const { repository, tx } = createRepository();

    await repository.getFundingDeadlines(19);

    expect(tx.fundingDeadlineD.findMany).toHaveBeenCalledWith({
      where: {
        semesterId: 19,
        deletedAt: null,
      },
    });
  });

  it("soft-deletes funding deadlines through TransactionHost tx", async () => {
    const { repository, tx } = createRepository();

    await expect(repository.deleteFundingDeadline(25)).resolves.toBe(true);

    expect(tx.fundingDeadlineD.updateMany).toHaveBeenCalledWith({
      where: {
        id: 25,
        deletedAt: null,
      },
      data: { deletedAt: NOW },
    });
  });
});
