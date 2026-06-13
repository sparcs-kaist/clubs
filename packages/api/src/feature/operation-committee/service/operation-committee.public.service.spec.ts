import { OperationCommitteePublicService } from "./operation-committee.public.service";

describe("OperationCommitteePublicService", () => {
  it("finds operation committee secret keys through the internal service", async () => {
    const activeKeys = [{ id: 1, secretKey: "abcde" }];
    const operationCommitteeService = {
      findOperationCommitteeSecretKey: jest.fn().mockResolvedValue(activeKeys),
    };
    const service = new OperationCommitteePublicService(
      operationCommitteeService as never,
    );

    await expect(service.findOperationCommitteeSecretKey()).resolves.toBe(
      activeKeys,
    );
    expect(
      operationCommitteeService.findOperationCommitteeSecretKey,
    ).toHaveBeenCalledTimes(1);
  });
});
