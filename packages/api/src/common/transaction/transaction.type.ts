import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

export type PrismaTransactionalAdapter =
  TransactionalAdapterPrisma<PrismaService>;
