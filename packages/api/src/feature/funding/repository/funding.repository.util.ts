import type { Prisma } from "@prisma/client";

import { IFundingRequest } from "@clubs/interface/api/funding/type/funding.type";

export function getLegacyPurchaseAmounts({
  clubSupplies,
  fixture,
  purchaseReceipt,
  expenditureAmount,
}: IFundingRequest) {
  if (!purchaseReceipt) {
    return {
      numberOfClubSupplies: clubSupplies?.number,
      priceOfClubSupplies: clubSupplies?.price,
      numberOfFixture: fixture?.number,
      priceOfFixture: fixture?.price,
    };
  }

  const { quantity } = purchaseReceipt;
  const unitPrice = expenditureAmount / quantity;
  const exactUnitPrice = Number.isInteger(unitPrice) ? unitPrice : null;
  return {
    numberOfClubSupplies: clubSupplies ? quantity : undefined,
    priceOfClubSupplies: clubSupplies ? exactUnitPrice : undefined,
    numberOfFixture: fixture ? quantity : undefined,
    priceOfFixture: fixture ? exactUnitPrice : undefined,
  };
}

export const buildFundingTransportationPassengerFindManyArgs = (
  fundingId: number,
) =>
  ({
    distinct: ["studentId"],
    where: {
      fundingId,
      deletedAt: null,
      funding: {
        deletedAt: null,
      },
      student: {
        deletedAt: null,
      },
    },
    select: {
      studentId: true,
    },
  }) satisfies Prisma.FundingTransportationPassengerFindManyArgs;
