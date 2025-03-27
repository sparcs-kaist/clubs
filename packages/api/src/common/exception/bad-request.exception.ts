import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class BadRequestException extends BaseException {
  constructor(
    reason: string,
    field?: string,
    details?: Record<string, unknown>,
    path?: string,
  ) {
    const message = field ? `Invalid ${field}: ${reason}` : reason;

    super(
      message,
      HttpStatus.BAD_REQUEST,
      "BAD_REQUEST",
      {
        field,
        reason,
        ...details,
      },
      path,
    );
  }
}
