import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class InternalErrorException extends BaseException {
  constructor(
    operation: string,
    error?: Error,
    details?: Record<string, unknown>,
    path?: string,
  ) {
    super(
      `Internal error occurred during ${operation}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      "INTERNAL_ERROR",
      {
        operation,
        originalError: error?.message,
        ...details,
      },
      path,
    );
  }
}
