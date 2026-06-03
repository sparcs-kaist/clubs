import { HttpException, HttpStatus } from "@nestjs/common";

import PrivacyPolicyRepository from "./privacy-policy.repository";

jest.mock("@sparcs-clubs/api/env", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

describe("PrivacyPolicyRepository", () => {
  const createRepository = () => {
    const txHost = {
      tx: {
        userPrivacyPolicyAgreement: {
          findMany: jest.fn(),
          create: jest.fn(),
        },
      },
    };

    return {
      repository: new PrivacyPolicyRepository(txHost as never),
      txHost,
    };
  };

  it("inserts a privacy policy agreement through TransactionHost tx", async () => {
    const { repository, txHost } = createRepository();
    txHost.tx.userPrivacyPolicyAgreement.findMany.mockResolvedValue([]);
    txHost.tx.userPrivacyPolicyAgreement.create.mockResolvedValue({ id: 1 });

    await expect(
      repository.insertAgreementByUserId({ userId: 24 }),
    ).resolves.toBe(true);

    expect(txHost.tx.userPrivacyPolicyAgreement.findMany).toHaveBeenCalledWith({
      where: {
        userId: 24,
        deletedAt: null,
      },
    });
    expect(txHost.tx.userPrivacyPolicyAgreement.create).toHaveBeenCalledWith({
      data: { userId: 24 },
    });
  });

  it("rejects duplicate privacy policy agreements before writing", async () => {
    const { repository, txHost } = createRepository();
    txHost.tx.userPrivacyPolicyAgreement.findMany.mockResolvedValue([
      { id: 1, userId: 24 },
    ]);

    try {
      await repository.insertAgreementByUserId({ userId: 24 });
      throw new Error("Expected insertAgreementByUserId to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).message).toBe(
        "You already agreed to privacy-policy",
      );
      expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }
    expect(txHost.tx.userPrivacyPolicyAgreement.create).not.toHaveBeenCalled();
  });
});
