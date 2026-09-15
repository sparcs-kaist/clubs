import { ArgumentsHost, HttpException } from "@nestjs/common";

import {
  HttpExceptionFilter,
  UnexpectedExceptionFilter,
} from "./exception.filter";
import logger from "./logger";

jest.mock("./logger", () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

describe("UnexpectedExceptionFilter SSO privacy boundary", () => {
  const now = new Date("2026-09-15T08:29:16.000Z");
  const traceId = "c9a390bf-e710-4ac7-800d-79015c1c3a54";
  const filter = new UnexpectedExceptionFilter({
    now: () => now,
    endOfToday: () => now,
  });
  const httpFilter = new HttpExceptionFilter({
    now: () => now,
    endOfToday: () => now,
  });

  beforeEach(() => jest.clearAllMocks());

  function createHost(request: object) {
    const response = {
      getHeader: jest.fn(() => traceId),
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    return { response, host };
  }

  it("logs only the SSO trace, stage and status while preserving the error response", () => {
    const request = {
      url: "/auth/sign-in/callback?code=private-code&state=private-state",
      ssoLoginDiagnostic: {
        stage: "refresh_token_store",
        secrets: ["private-token"],
      },
    };
    const { host, response } = createHost(request);
    const error = Object.assign(
      new Error("Prisma refreshToken=private-token"),
      {
        config: { authorization: "Bearer private-authorization" },
      },
    );

    filter.catch(error, host);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `SSO login failed ${JSON.stringify({
        traceId,
        stage: "refresh_token_store",
        httpStatus: 500,
      })}`,
    );
    expect(
      JSON.stringify((logger.error as jest.Mock).mock.calls),
    ).not.toContain("private");
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      timestamp: now.toISOString(),
      path: request.url,
    });
  });

  it("keeps existing logging and response behavior without SSO context", () => {
    const { host, response } = createHost({ url: "/ordinary-request" });
    const error = new Error("ordinary failure");

    filter.catch(error, host);

    expect(logger.error).toHaveBeenNthCalledWith(
      1,
      "Unexpected exception",
      error,
    );
    expect(logger.error).toHaveBeenNthCalledWith(2, error);
    expect(response.getHeader).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      timestamp: now.toISOString(),
      path: "/ordinary-request",
    });
  });

  it("omits a secret-bearing SSO HttpException from server logs without changing its response", () => {
    const { host, response } = createHost({
      url: "/auth/sign-in/callback",
      ssoLoginDiagnostic: { stage: "db.current-degree.resolve" },
    });
    const error = new HttpException(
      "code=private-code password=private-password",
      400,
    );

    httpFilter.catch(error, host);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `SSO login failed ${JSON.stringify({
        traceId,
        stage: "db.current-degree.resolve",
        httpStatus: 400,
      })}`,
    );
    expect(
      JSON.stringify((logger.error as jest.Mock).mock.calls),
    ).not.toContain("private");
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: error.getResponse(),
      statusCode: 400,
      timestamp: now.toISOString(),
      path: "/auth/sign-in/callback",
    });
  });

  it("keeps ordinary HttpException logging and responses", () => {
    const { host, response } = createHost({ url: "/ordinary-request" });
    const error = new HttpException("ordinary validation error", 422);

    httpFilter.catch(error, host);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(error.getResponse());
    expect(response.getHeader).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({
      message: error.getResponse(),
      statusCode: 422,
      timestamp: now.toISOString(),
      path: "/ordinary-request",
    });
  });
});
