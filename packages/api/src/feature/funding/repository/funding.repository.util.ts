import type { Prisma } from "@prisma/client";

export const buildFundingTransportationPassengerWhere = (fundingId: number) =>
  ({
    fundingId,
    deletedAt: null,
    funding: {
      deletedAt: null,
    },
    student: {
      deletedAt: null,
    },
  }) satisfies Prisma.FundingTransportationPassengerWhereInput;
