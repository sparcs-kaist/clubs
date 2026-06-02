import { Global, Module } from "@nestjs/common";
import { ClsPluginTransactional } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { ClsModule } from "nestjs-cls";

import { PrismaModule } from "@sparcs-clubs/api/prisma/prisma.module";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          imports: [PrismaModule],
          adapter: new TransactionalAdapterPrisma<PrismaService>({
            prismaInjectionToken: PrismaService,
          }),
        }),
      ],
    }),
  ],
})
export class TransactionModule {}
