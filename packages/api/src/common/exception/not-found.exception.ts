import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class NotFoundException extends BaseException {
  constructor(
    resource: string,
    identifier?: string,
    details?: Record<string, unknown>,
    path?: string,
  ) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(
      message,
      HttpStatus.NOT_FOUND,
      "NOT_FOUND",
      {
        resource,
        identifier,
        ...details,
      },
      path,
    );
  }
}
