import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";
import { catchError, concatMap } from "rxjs";
import { ZodError } from "zod";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import {
  RANDOM_GENERATOR,
  RandomGenerator,
} from "@sparcs-clubs/api/common/random/random-generator";
import logger from "@sparcs-clubs/api/common/util/logger";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import { Request } from "../dto/auth.dto";
import { SsoLoginFailureRepository } from "../repository/sso-login-failure/sso-login-failure.repository";
import {
  boundDiagnosticJson,
  redactDiagnosticText,
  SsoLoginDiagnostic,
} from "../util/sso-login-diagnostic";

@Injectable()
export class SsoLoginDiagnosticInterceptor implements NestInterceptor {
  constructor(
    private readonly repository: SsoLoginFailureRepository,
    private readonly config: AppConfigService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(RANDOM_GENERATOR) private readonly random: RandomGenerator,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const traceId = this.random.uuid();
    const diagnostic: SsoLoginDiagnostic = {
      stage: "request_validation",
      secrets: [],
    };
    req.ssoLoginDiagnostic = diagnostic;
    // Server-generated: a caller cannot overwrite or inject the stored identifier.
    res.setHeader("X-SSO-Login-Trace-Id", traceId);
    let recorded = false;
    const record = async (error: unknown) => {
      if (recorded) return;
      recorded = true;
      let httpStatus = 500;
      if (error instanceof HttpException) httpStatus = error.getStatus();
      if (error instanceof ZodError) httpStatus = 400;
      if (diagnostic.failure) httpStatus = diagnostic.failure.httpStatus;
      try {
        const secrets = [
          req.query.code,
          req.query.state,
          req.session?.ssoState,
          req.headers.authorization,
          req.headers.cookie,
          ...Object.values(req.cookies ?? {}),
          this.config.ssoSecretKey,
          this.config.secretKey,
          this.config.jwtSecret,
          this.config.accessTokenSecretKey,
          this.config.refreshTokenSecretKey,
          ...diagnostic.secrets,
        ]
          .flat()
          .filter((value): value is string => typeof value === "string");
        const clean = (value: string, limit: number) => {
          const safe = redactDiagnosticText(value, secrets);
          return safe.length > limit
            ? `${safe.slice(0, limit - 11)}[TRUNCATED]`
            : safe;
        };
        let errorName = "UnknownError";
        let errorMessage = "Non-Error thrown (value omitted)";
        let errorStack: string | null = null;
        if (error instanceof Error) {
          errorName = error.name;
          errorMessage = error.message;
          errorStack = clean(error.stack ?? "", 8192);
        }
        if (diagnostic.failure) {
          errorName = diagnostic.failure.name;
          errorMessage = diagnostic.failure.message;
          errorStack = clean(diagnostic.failure.stack ?? "", 8192);
        }
        const diagnostics = boundDiagnosticJson(
          {
            request: {
              userAgent: req.headers["user-agent"],
              ip: req.ip,
              hasSession: !!req.session,
              hasSessionState: !!req.session?.ssoState,
              hasCode: Object.prototype.hasOwnProperty.call(req.query, "code"),
              hasState: Object.prototype.hasOwnProperty.call(
                req.query,
                "state",
              ),
              responseStatus: res.headersSent ? res.statusCode : httpStatus,
            },
            sso: diagnostic.sso,
            db: diagnostic.db,
          },
          secrets,
        );
        await this.repository.create({
          occurredAt: this.clock.now(),
          traceId,
          stage: diagnostic.stage,
          httpStatus,
          errorName: clean(errorName, 128),
          errorMessage: clean(errorMessage, 4096),
          errorStack,
          method: req.method.slice(0, 16),
          // Fixed route pattern excludes callback query strings, code and state.
          path: req.route.path,
          userId: diagnostic.userId,
          studentId: diagnostic.studentId,
          diagnostics: diagnostics as Prisma.InputJsonObject,
        });
      } catch {
        // Never include DB errors: Prisma can print query values and credentials.
        logger.error(
          `SSO failure log unavailable ${JSON.stringify({ traceId, stage: diagnostic.stage, httpStatus })}`,
        );
      }
    };
    return next.handle().pipe(
      concatMap(async value => {
        if (diagnostic.failure) await record(undefined);
        return value;
      }),
      catchError(async error => {
        await record(error);
        throw error;
      }),
    );
  }
}
