import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class UnauthorizedException extends BaseException {
  constructor(
    // eslint-disable-next-line default-param-last
    message: string = "Authentication required",
    details?: Record<string, unknown>,
    path?: string,
  ) {
    super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", details, path);
  }
}
