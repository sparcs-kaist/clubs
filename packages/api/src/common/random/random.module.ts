import { Global, Module } from "@nestjs/common";

import { RANDOM_GENERATOR } from "./random-generator";
import { SystemRandomGenerator } from "./system-random-generator";

@Global()
@Module({
  providers: [{ provide: RANDOM_GENERATOR, useClass: SystemRandomGenerator }],
  exports: [RANDOM_GENERATOR],
})
export class RandomModule {}
