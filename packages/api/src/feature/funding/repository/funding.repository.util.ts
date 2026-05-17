import type { Prisma } from "@prisma/client";

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
