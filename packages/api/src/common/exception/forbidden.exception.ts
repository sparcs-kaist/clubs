import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class ForbiddenException extends BaseException {
  constructor(
    action: string,
    resource: string,
    details?: Record<string, unknown>,
    path?: string,
  ) {
    super(
      `Permission denied to ${action} ${resource}`,
      HttpStatus.FORBIDDEN,
      "FORBIDDEN",
      {
        action,
        resource,
        ...details,
      },
      path,
    );
  }
}
