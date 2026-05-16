import { Global, Module } from "@nestjs/common";

import { ClockService } from "./clock.service";

@Global()
@Module({
  providers: [ClockService],
  exports: [ClockService],
})
export class ClockModule {}
