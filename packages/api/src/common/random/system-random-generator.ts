import { Injectable } from "@nestjs/common";
import { randomBytes, randomUUID } from "crypto";

import { RandomGenerator } from "./random-generator";

@Injectable()
export class SystemRandomGenerator implements RandomGenerator {
  uuid(): string {
    return randomUUID();
  }

  hex(bytes: number): string {
    return randomBytes(bytes).toString("hex");
  }
}
