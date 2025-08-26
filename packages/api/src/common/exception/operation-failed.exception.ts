import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class OperationFailedException extends BaseException {
  constructor(
    operation: string,
    reason?: string,
    details?: Record<string, unknown>,
    path?: string,
  ) {
    const message = reason
      ? `Failed to ${operation}: ${reason}`
      : `Failed to ${operation}`;

    super(
      message,
      HttpStatus.BAD_REQUEST,
      "OPERATION_FAILED",
      {
        operation,
        reason,
        ...details,
      },
      path,
    );
  }
}
