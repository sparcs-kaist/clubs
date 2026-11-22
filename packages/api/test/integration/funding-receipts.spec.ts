import { Test, TestingModule } from "@nestjs/testing";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import {
  IFundingExtra,
  IFundingRequest,
  IPurchaseReceipt,
} from "@clubs/interface/api/funding/type/funding.type";
import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
  FundingStatusEnum,
} from "@clubs/interface/common/enum/funding.enum";

import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import FundingRepository from "@sparcs-clubs/api/feature/funding/repository/funding.repository";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const expenditureDate = new Date("2026-07-30T15:00:00Z");
const laterThatDay = new Date("2026-07-31T05:00:00Z");

describe("Funding receipt allocations with MySQL", () => {
  let module: TestingModule;
  let repository: FundingRepository;
  let txHost: TransactionHost<PrismaTransactionalAdapter>;
  let extra: IFundingExtra;
  let clubId: number;

  const inTransaction = <T>(work: () => Promise<T>) =>
    txHost.withTransaction(
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      work,
    );

  const purchase = (
    reference: string,
    itemNumber: number,
    expenditureAmount: number,
  ): IFundingRequest & { purchaseReceipt: IPurchaseReceipt } => ({
    club: { id: clubId },
    purposeActivity: { id: null },
    name: `품목 ${itemNumber}`,
    expenditureDate,
    expenditureAmount,
    tradeEvidenceFiles: [{ id: "receipt-test-file" }],
    tradeDetailFiles: [],
    tradeDetailExplanation: "테스트 거래명세",
    isFixture: false,
    isTransportation: false,
    isNonCorporateTransaction: false,
    isFoodExpense: false,
    isLaborContract: false,
    isExternalEventParticipationFee: false,
    isPublication: false,
    isProfitMakingActivity: false,
    isJointExpense: false,
    isEtcExpense: false,
    purchaseReceipt: {
      reference,
      totalAmount: 150000,
      itemNumber,
      quantity: 1,
    },
  });

  const insert = (body: IFundingRequest) =>
    inTransaction(() => repository.insert(body, extra));

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TransactionModule, ClockModule],
      providers: [FundingRepository],
    }).compile();
    await module.init();
    repository = module.get(FundingRepository);
    txHost = module.get(TransactionHost);
    const prisma = module.get(PrismaService);
    await clearDatabase();

    const district = await prisma.district.create({ data: { name: "테스트" } });
    const division = await prisma.division.create({
      data: { name: "테스트", districtId: district.id },
    });
    const club = await prisma.club.create({
      data: {
        nameKr: "지원금 테스트",
        divisionId: division.id,
        foundingYear: 2020,
      },
    });
    clubId = club.id;
    const term = {
      year: 2026,
      name: "여름",
      startTerm: new Date("2026-07-01T00:00:00Z"),
      endTerm: new Date("2026-08-31T00:00:00Z"),
    };
    const semester = await prisma.semesterD.create({ data: term });
    const activity = await prisma.activityD.create({
      data: { ...term, semesterId: semester.id, activityDurationTypeEnum: 1 },
    });
    extra = {
      activityD: { id: activity.id },
      fundingStatusEnum: FundingStatusEnum.Applied,
      approvedAmount: 0,
    };
  });

  afterAll(async () => {
    await module?.close();
    await closeDatabase();
  });

  it("reads split purchases and makes only the unallocated amount available", async () => {
    const firstBody = purchase("상점 주문 1", 1, 110000);
    const first = await insert({
      ...firstBody,
      isFixture: true,
      fixture: {
        name: "비품",
        classEnum: FixtureClassEnum.Furniture,
        evidenceEnum: FixtureEvidenceEnum.Purchase,
        purpose: "동아리방 비품",
        imageFiles: [],
        softwareEvidenceFiles: [],
      },
      purchaseReceipt: { ...firstBody.purchaseReceipt, quantity: 2 },
    });
    const secondBody = purchase("상점 주문 1", 2, 40000);
    const second = await insert({
      ...secondBody,
      expenditureDate: laterThatDay,
    });

    expect(await repository.fetch(first.id)).toMatchObject({
      expenditureAmount: 110000,
      fixture: { number: 2, price: 55000 },
      purchaseReceipt: {
        reference: "상점 주문 1",
        totalAmount: 150000,
        itemNumber: 1,
        quantity: 2,
      },
    });
    await expect(insert(purchase("상점 주문 1", 3, 1))).rejects.toMatchObject({
      status: 409,
    });
    await expect(insert(purchase("상점 주문 1", 2, 1))).rejects.toMatchObject({
      status: 409,
    });
    await expect(
      inTransaction(() => repository.put(second.id, secondBody, extra)),
    ).resolves.toMatchObject({ id: second.id, expenditureAmount: 40000 });

    await inTransaction(() => repository.delete(second.id));
    await expect(insert(secondBody)).resolves.toMatchObject({
      expenditureAmount: 40000,
    });
  });

  it("allows a receipt total correction only for an unshared receipt", async () => {
    const body = purchase("정정 결제", 1, 90000);
    const first = await insert(body);
    body.purchaseReceipt.totalAmount = 140000;
    await expect(
      inTransaction(() => repository.put(first.id, body, extra)),
    ).resolves.toMatchObject({ purchaseReceipt: { totalAmount: 140000 } });

    const other = purchase("정정 결제", 2, 50000);
    await expect(insert(other)).rejects.toMatchObject({ status: 409 });
    other.purchaseReceipt.totalAmount = 140000;
    await expect(insert(other)).resolves.toMatchObject({
      expenditureAmount: 50000,
    });

    body.purchaseReceipt.totalAmount = 150000;
    await expect(
      inTransaction(() => repository.put(first.id, body, extra)),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("serializes concurrent claims that exceed the same receipt total", async () => {
    const outcomes = await Promise.allSettled([
      insert(purchase("동시 결제", 1, 100000)),
      insert(purchase("동시 결제", 2, 100000)),
    ]);
    expect(
      outcomes.filter(result => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(outcomes).toContainEqual(
      expect.objectContaining({
        status: "rejected",
        reason: expect.objectContaining({ status: 409 }),
      }),
    );
  });

  it("serializes concurrent claims for the same receipt item", async () => {
    const body = purchase("동일 품목", 1, 10000);
    const outcomes = await Promise.allSettled([
      insert(body),
      insert({ ...body, expenditureDate: laterThatDay }),
    ]);
    expect(
      outcomes.filter(result => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(outcomes).toContainEqual(
      expect.objectContaining({
        status: "rejected",
        reason: expect.objectContaining({ status: 409 }),
      }),
    );
  });
});
