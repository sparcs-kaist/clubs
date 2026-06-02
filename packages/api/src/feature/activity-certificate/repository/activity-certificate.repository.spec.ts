import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";

import { ActivityCertificateRepository } from "./activity-certificate.repository";

jest.mock("@sparcs-clubs/api/env", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

describe("ActivityCertificateRepository", () => {
  it("creates a certificate and its items through TransactionHost tx", async () => {
    const txHost = {
      tx: {
        activityCertificate: {
          create: jest.fn().mockResolvedValue({ id: 42 }),
        },
        activityCertificateItem: {
          create: jest.fn().mockResolvedValue({}),
        },
      },
    };
    const repository = new ActivityCertificateRepository(txHost as never);
    const firstMonth = new Date("2026-01-01T00:00:00.000Z");
    const secondMonth = new Date("2026-02-01T00:00:00.000Z");

    await repository.postActivityCertificate({
      clubId: 7,
      studentId: 605,
      studentPhoneNumber: "010-0000-0000",
      issuedNumber: 3,
      items: [
        {
          startMonth: firstMonth,
          endMonth: firstMonth,
          detail: "first",
        },
        {
          startMonth: secondMonth,
          endMonth: secondMonth,
          detail: "second",
        },
      ],
    });

    expect(txHost.tx.activityCertificate.create).toHaveBeenCalledWith({
      data: {
        clubId: 7,
        studentId: 605,
        studentPhoneNumber: "010-0000-0000",
        issueNumber: 3,
        activityCertificateStatusEnum:
          ActivityCertificateOrderStatusEnum.Applied,
      },
    });
    expect(txHost.tx.activityCertificateItem.create).toHaveBeenCalledTimes(2);
    expect(txHost.tx.activityCertificateItem.create).toHaveBeenNthCalledWith(
      1,
      {
        data: {
          activityCertificateId: 42,
          order: 0,
          startMonth: firstMonth,
          endMonth: firstMonth,
          detail: "first",
        },
      },
    );
    expect(txHost.tx.activityCertificateItem.create).toHaveBeenNthCalledWith(
      2,
      {
        data: {
          activityCertificateId: 42,
          order: 1,
          startMonth: secondMonth,
          endMonth: secondMonth,
          detail: "second",
        },
      },
    );
  });
});
