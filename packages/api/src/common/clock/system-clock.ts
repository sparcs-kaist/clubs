import { Injectable } from "@nestjs/common";

import { Clock } from "./clock";

const UTC_RUNTIME_TO_SERVICE_TIME_OFFSET_MS = 9 * 60 * 60 * 1000;

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  endOfToday(): Date {
    const serviceNow = new Date(
      this.now().getTime() + UTC_RUNTIME_TO_SERVICE_TIME_OFFSET_MS,
    );

    return new Date(
      Date.UTC(
        serviceNow.getUTCFullYear(),
        serviceNow.getUTCMonth(),
        serviceNow.getUTCDate(),
        14,
        59,
        59,
        999,
      ),
    );
  }
}
