import { OperationCommitteeRepository } from "./operation-committee.repository";

jest.mock("@sparcs-clubs/api/env", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

describe("OperationCommitteeRepository", () => {
  it("creates a new secret key through TransactionHost tx", async () => {
    const txHost = {
      tx: {
        operationCommittee: {
          create: jest.fn().mockResolvedValue({ id: 2, secretKey: "new-key" }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      },
    };
    const repository = new OperationCommitteeRepository(txHost as never);

    const result =
      await repository.createOperationCommitteeSecretKey("new-key");

    expect(txHost.tx.operationCommittee.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
    expect(txHost.tx.operationCommittee.create).toHaveBeenCalledWith({
      data: { secretKey: "new-key" },
    });
    expect(result).toEqual({ id: 2, secretKey: "new-key" });
  });

  it("finds active secret keys through TransactionHost tx", async () => {
    const activeKeys = [{ id: 1, secretKey: "active" }];
    const txHost = {
      tx: {
        operationCommittee: {
          findMany: jest.fn().mockResolvedValue(activeKeys),
        },
      },
    };
    const repository = new OperationCommitteeRepository(txHost as never);

    await expect(repository.findOperationCommitteeSecretKey()).resolves.toEqual(
      activeKeys,
    );

    expect(txHost.tx.operationCommittee.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });
});
