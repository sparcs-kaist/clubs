import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class UnauthorizedException extends BaseException {
  constructor(
    message: string = "Authentication required",
    details?: Record<string, unknown>,
    path?: string,
  ) {
    super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", details, path);
  }
}
