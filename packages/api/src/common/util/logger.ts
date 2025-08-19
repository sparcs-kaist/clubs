import * as Sentry from "@sentry/node";
import os from "os";
import { createLogger, format, transports } from "winston";
import SentryTransport from "winston-transport-sentry-node";

import { env } from "@sparcs-clubs/api/env";

const isReadyForSentryInProduction =
  env.SENTRY_DSN && env.NODE_ENV === "production";

// Sentry 초기화 (production 환경에서만)
if (isReadyForSentryInProduction) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
  Sentry.setTag("hostname", os.hostname());
}

// 콘솔 출력용 포맷
const consoleFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss(UTCZ)" }),
  format.errors({ stack: true }),
  format.printf(
    ({ level, message, timestamp, stack }) =>
      `${timestamp} [${level}]: ${message} ${
        level === "error" && stack !== undefined ? stack : ""
      }`,
  ),
);

// 개발 환경용 색상 포맷
const colorizedFormat = format.combine(
  format.colorize({ all: true }),
  consoleFormat,
);

/**
 * console.log()와 console.error() 대신 사용되는 winston Logger 객체입니다.
 *
 * - "production" 환경: 모든 로그는 콘솔에 출력되고, error 레벨만 Sentry로도 전송됩니다.
 * - 기타 환경: 모든 로그는 콘솔에만 출력됩니다 (Sentry 전송 없음).
 *
 * @method info(message: string, callback: winston.LogCallback) - 일반적인 정보(API 접근 등) 기록을 위해 사용합니다.
 * @method error(message: string, callback: winston.LogCallback)  - 오류 메시지를 기록하기 위해 사용합니다.
 */
const logger =
  env.NODE_ENV === "production"
    ? createLogger({
        level: "info", // production 환경에서는 info 레벨부터 출력
        format: consoleFormat, // production 환경에서는 색상 없는 포맷
        defaultMeta: { service: "clubs" },
        transports: [
          new transports.Console(),
          // 경고 레벨 이상만 Sentry로 전송
          new SentryTransport({
            level: "warn",
          }),
        ],
        exceptionHandlers: [new transports.Console()],
      })
    : createLogger({
        level: "debug", // 개발 환경에서는 debug 레벨까지 출력
        format: colorizedFormat, // 개발 환경에서는 색상 포맷 사용
        defaultMeta: { service: "clubs" },
        transports: [new transports.Console()],
        exceptionHandlers: [new transports.Console()],
      });

// 예외 처리가 되지 않은 오류를 Sentry로 전송 (production 환경에서만)
if (isReadyForSentryInProduction) {
  process.on("uncaughtException", error => {
    Sentry.captureException(error);
  });

  process.on("unhandledRejection", reason => {
    Sentry.captureException(reason);
  });
}

export default logger;
