import { SemesterRepository } from "./semester.repository";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("SemesterRepository login query", () => {
  it("keeps the inclusive end boundary and the original single-row semantics", async () => {
    const date = new Date("2026-09-01T00:00:00.000Z");
    const semester = { id: 19, startTerm: date, endTerm: date };
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([semester])
      .mockResolvedValueOnce([]);
    const repository = new SemesterRepository({
      tx: { semesterD: { findMany } },
    } as never);

    await expect(repository.findForLogin(date)).resolves.toEqual(semester);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        startTerm: { lte: date },
        endTerm: { gte: date },
        deletedAt: null,
      },
    });
    await expect(repository.findForLogin(date)).resolves.toBeNull();
  });
});
