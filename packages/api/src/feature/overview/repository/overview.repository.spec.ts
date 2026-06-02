import { OverviewRepository } from "./overview.repository";

jest.mock("@sparcs-clubs/api/env", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

describe("OverviewRepository", () => {
  it("runs raw overview queries through TransactionHost tx", async () => {
    const rows = [
      {
        clubId: 1,
        division: "division",
        district: "district",
        clubNameKr: "club",
        clubNameEn: "club",
        clubStatus: 1,
      },
    ];
    const txHost = {
      tx: {
        $queryRaw: jest.fn().mockResolvedValue(rows),
      },
    };
    const repository = new OverviewRepository(txHost as never);

    await expect(
      repository.findClubsFundamentals(2026, "Spring"),
    ).resolves.toEqual(rows);

    expect(txHost.tx.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
