import { Global, Module } from "@nestjs/common";

import { CLOCK } from "./clock";
import { SystemClock } from "./system-clock";

@Global()
@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class ClockModule {}
