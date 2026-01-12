import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class InvalidStateException extends BaseException {
  constructor(
    resource: string,
    currentState: string,
    attemptedAction: string,
    details?: Record<string, unknown>,
    path?: string,
  ) {
    super(
      `Cannot ${attemptedAction} ${resource} in state: ${currentState}`,
      HttpStatus.BAD_REQUEST,
      "INVALID_STATE",
      {
        resource,
        currentState,
        attemptedAction,
        ...details,
      },
      path,
    );
  }
}
