import type { IFundingRequest } from "@clubs/interface/api/funding/type/funding.type";
import { ActivityDurationTypeEnum } from "@clubs/interface/common/enum/activity.enum";
import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import FundingRepository from "@sparcs-clubs/api/feature/funding/repository/funding.repository";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const now = new Date("2026-11-23T09:00:00Z");
const expenditureDate = new Date("2026-11-01T07:00:00Z");
const categories = {
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
};

describe("Funding change history with MySQL", () => {
  const prisma = new PrismaService();

  beforeAll(clearDatabase);

  afterAll(async () => {
    await prisma.$disconnect();
    await closeDatabase();
  });

  it("stores adjacent snapshots in newest-first order and rolls back an aborted edit", async () => {
    const names = { year: 2026, name: "Fall" };
    const termDates = {
      startTerm: new Date("2026-09-01T00:00:00Z"),
      endTerm: new Date("2027-01-01T00:00:00Z"),
    };
    const semester = await prisma.semesterD.create({
      data: { ...names, ...termDates },
    });
    const term = await prisma.activityD.create({
      data: {
        ...names,
        ...termDates,
        semesterId: semester.id,
        activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
      },
    });
    const district = await prisma.district.create({ data: { name: "Test" } });
    const division = await prisma.division.create({
      data: { name: "Test", districtId: district.id },
    });
    const club = await prisma.club.create({
      data: {
        nameKr: "지원금 이력 테스트",
        divisionId: division.id,
        foundingYear: 2020,
      },
    });
    const funding = await prisma.funding.create({
      data: {
        ...categories,
        clubId: club.id,
        activityDId: term.id,
        name: "최초 제출",
        expenditureDate,
        expenditureAmount: 10000,
        tradeDetailExplanation: "최초 구매 내역",
      },
    });
    await prisma.fundingTradeEvidenceFile.create({
      data: { fundingId: funding.id, fileId: "receipt-original" },
    });

    const putAndRecord = (name: string, evidence: string, abort = false) =>
      prisma.$transaction(async tx => {
        const repository = Object.assign(
          new FundingRepository({ tx } as never, prisma),
          { clock: { now: () => now } },
        );
        const before = await repository.fetchForUpdate(funding.id);
        const request: IFundingRequest = {
          ...categories,
          club: { id: club.id },
          purposeActivity: { id: null },
          name,
          expenditureDate,
          expenditureAmount: 10000,
          tradeDetailExplanation: name,
          tradeEvidenceFiles: [{ id: evidence }],
          tradeDetailFiles: [],
        };
        await repository.put(funding.id, request, {
          activityD: { id: term.id },
          fundingStatusEnum: FundingStatusEnum.Applied,
          approvedAmount: 0,
        });
        await repository.recordChangeHistory(before, 42, now);
        if (abort) throw new Error("Abort funding edit");
      });

    await putAndRecord("첫 번째 수정", "receipt-first");
    await putAndRecord("두 번째 수정", "receipt-second");
    await expect(
      putAndRecord("저장 실패", "receipt-aborted", true),
    ).rejects.toThrow("Abort funding edit");

    const repository = new FundingRepository({ tx: prisma } as never, prisma);
    const history = await repository.findChangeHistory(funding.id);
    expect(history).toMatchObject([
      {
        createdAt: now,
        before: {
          name: "첫 번째 수정",
          tradeEvidenceFiles: [{ id: "receipt-first" }],
        },
        after: {
          name: "두 번째 수정",
          tradeEvidenceFiles: [{ id: "receipt-second" }],
          expenditureDate: expenditureDate.toISOString(),
        },
      },
      {
        createdAt: now,
        before: {
          name: "최초 제출",
          tradeEvidenceFiles: [{ id: "receipt-original" }],
        },
        after: {
          name: "첫 번째 수정",
          tradeEvidenceFiles: [{ id: "receipt-first" }],
        },
      },
    ]);
    expect(history[0].before).toEqual(history[1].after);
    await expect(repository.fetch(funding.id)).resolves.toMatchObject({
      name: "두 번째 수정",
      tradeEvidenceFiles: [{ id: "receipt-second" }],
    });
  });
});
