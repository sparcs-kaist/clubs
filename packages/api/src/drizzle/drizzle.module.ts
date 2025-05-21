import { Module } from "@nestjs/common";

import { drizzleProvider } from "./drizzle.provider";
import { TransactionManagerService } from "./drizzle.transaction-manager";

@Module({
  providers: [...drizzleProvider, TransactionManagerService],
  exports: [...drizzleProvider, TransactionManagerService],
})
export class DrizzleModule {}
