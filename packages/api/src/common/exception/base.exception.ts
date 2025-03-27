import { HttpException, HttpStatus } from "@nestjs/common";

import logger from "../util/logger";

export interface BaseExceptionResponse {
  message: string;
  errorCode: string;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}

export class BaseException extends HttpException {
  protected constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode: string,
    details?: Record<string, unknown>,
    path?: string,
  ) {
    const response: BaseExceptionResponse = {
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path,
      details: process.env.NODE_ENV === "development" ? details : undefined,
    };

    super(response, statusCode);

    // 에러 발생 시 자동으로 로깅
    this.logError();
  }

  private logError(): void {
    const response = this.getResponse() as BaseExceptionResponse;
    const status = this.getStatus();

    logger.error(
      `[${response.errorCode}] ${response.message} (Status: ${status})`,
      {
        ...response,
        stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
      },
    );
  }
}
