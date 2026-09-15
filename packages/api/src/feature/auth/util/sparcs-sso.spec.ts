import axios, { AxiosError, AxiosResponse } from "axios";

import { Clock } from "@sparcs-clubs/api/common/clock/clock";
import { RandomGenerator } from "@sparcs-clubs/api/common/random/random-generator";
import logger from "@sparcs-clubs/api/common/util/logger";

import { Client } from "./sparcs-sso";
import {
  boundDiagnosticJson,
  SsoLoginDiagnostic,
} from "./sso-login-diagnostic";

jest.mock("@sparcs-clubs/api/common/util/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("Client", () => {
  const clock = {
    now: jest.fn(() => new Date("2026-06-03T00:00:00.000Z")),
    endOfToday: jest.fn(() => new Date("2026-06-03T14:59:59.999Z")),
  } satisfies Clock;

  const randomGenerator = {
    uuid: jest.fn(() => "fixed-uuid"),
    hex: jest.fn(() => "fixed-state"),
  } satisfies RandomGenerator;

  afterEach(() => jest.restoreAllMocks());

  function createClient() {
    return new Client("client-id", "secret-key", clock, randomGenerator);
  }

  function respond(data: unknown, status = 200) {
    jest.spyOn(axios, "post").mockResolvedValue({ data, status });
  }

  it.each([1, "1", null, undefined])(
    "preserves original academic types before parsing: %s",
    async code => {
      const info = { std_no: "20246000", std_prog_code: code, socps_cd: "S" };
      respond({ kaist_info: "{}", kaist_v2_info: JSON.stringify(info) });
      const diagnostic: SsoLoginDiagnostic = { stage: "start" };

      const profile = await createClient().get_user_info(
        "auth-code",
        diagnostic,
      );

      expect(profile.kaist_v2_info).toEqual(JSON.parse(JSON.stringify(info)));
      expect(diagnostic.sso).toMatchObject({
        httpStatus: 200,
        profileState: "available",
        profile: {
          kaist_v2_info: {
            type: "string",
            state: "available",
            fields: {
              std_prog_code:
                code === undefined
                  ? { present: false, type: "undefined", omitted: false }
                  : {
                      present: true,
                      type: code === null ? "null" : typeof code,
                      value: code,
                    },
            },
          },
        },
      });
    },
  );

  it.each([{}, "", null, undefined])(
    "keeps existing V2 non-string/empty fallback behavior: %s",
    async v2 => {
      respond({ kaist_info: "", kaist_v2_info: v2 });
      const diagnostic: SsoLoginDiagnostic = { stage: "start" };

      const profile = await createClient().get_user_info(
        "auth-code",
        diagnostic,
      );

      expect(profile.kaist_info).toEqual({});
      expect(profile.kaist_v2_info).toBe(v2);
      expect(diagnostic.sso.parseErrors).toBeUndefined();
    },
  );

  it.each([
    ["null", null, "missing"],
    ["[]", [], "invalid_shape"],
    ["1", 1, "invalid_shape"],
    [{ std_prog_code: 1 }, { std_prog_code: 1 }, "available"],
  ])(
    "describes parsed V2 shape without changing returned values: %s",
    async (raw, parsed, state) => {
      respond({ kaist_v2_info: raw });
      const diagnostic: SsoLoginDiagnostic = { stage: "start" };

      const profile = await createClient().get_user_info(
        "auth-code",
        diagnostic,
      );

      expect(profile.kaist_v2_info).toEqual(parsed);
      expect(diagnostic.sso.profileState).toBe(state);
      expect(diagnostic.sso.profile).toMatchObject({
        kaist_v2_info: { type: typeof raw },
      });
    },
  );

  it("retains V1 parse target without logging a secret-bearing parser error", async () => {
    respond({
      kaist_info: "{password=secret-password",
      kaist_v2_info: '{"std_prog_code":1}',
    });
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };

    await expect(
      createClient().get_user_info("auth-code", diagnostic),
    ).rejects.toThrow("INVALID_OBJECT");

    expect(diagnostic.stage).toBe("sso_parse");
    expect(diagnostic.sso).toMatchObject({
      profileState: "v1_parse_failed",
      parseErrors: [
        {
          target: "kaist_info",
          name: "SyntaxError",
          message: "Failed to parse kaist_info",
          stack: {
            frames: expect.arrayContaining([
              expect.stringContaining("at JSON.parse"),
            ]),
          },
        },
      ],
      profile: {
        kaist_v2_info: {
          fields: { std_prog_code: { type: "number", value: 1 } },
        },
      },
    });
    expect(JSON.stringify(diagnostic.sso)).not.toContain("secret-password");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("retains V2 parse failure while preserving the null fallback", async () => {
    respond({ kaist_v2_info: '{"access_token":"secret-token"' });
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };

    const profile = await createClient().get_user_info("auth-code", diagnostic);

    expect(profile.kaist_v2_info).toBeNull();
    expect(diagnostic.sso).toMatchObject({
      profileState: "v2_parse_failed",
      parseErrors: [
        {
          target: "kaist_v2_info",
          name: "SyntaxError",
          message: "Failed to parse kaist_v2_info",
          stack: {
            frames: expect.arrayContaining([
              expect.stringContaining("at JSON.parse"),
            ]),
          },
        },
      ],
      profile: { kaist_v2_info: { type: "string", state: "parse_failed" } },
    });
    expect(JSON.stringify(diagnostic.sso)).not.toContain("secret-token");
  });

  it.each([400, 403, 503])(
    "preserves HTTP %i and hides Axios request data",
    async status => {
      const failure = new AxiosError(
        "password=secret-password code=auth-code sign=secret-sign",
        "ERR_BAD_RESPONSE",
        {
          headers: { Authorization: "Bearer private-token" },
          data: "code=auth-code",
        } as never,
        undefined,
        { status, data: { error: "secret-upstream-body" } } as AxiosResponse,
      );
      failure.stack = [
        `AxiosError: ${failure.message}`,
        "    at sendRequest (/app/sso-client.ts:10:5)",
        "    at callback (/app/auth.service.ts:20:5)",
      ].join("\n");
      jest.spyOn(axios, "post").mockRejectedValue(failure);
      const diagnostic: SsoLoginDiagnostic = { stage: "start" };

      await expect(
        createClient().get_user_info("auth-code", diagnostic),
      ).rejects.toThrow("INVALID_OBJECT");

      expect(diagnostic.stage).toBe("sso_request");
      expect(diagnostic.sso).toEqual({
        profileState: "http_error",
        httpStatus: status,
        upstreamErrorCode: "ERR_BAD_RESPONSE",
        transportErrorName: "AxiosError",
        transportErrorMessage: "SSO HTTP request failed",
        transportErrorStack: {
          frames: [
            "    at sendRequest (/app/sso-client.ts:10:5)",
            "    at callback (/app/auth.service.ts:20:5)",
          ],
          truncated: false,
        },
      });
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it("times out SSO requests and preserves the timeout reason for failure recording", async () => {
    const post = jest
      .spyOn(axios, "post")
      .mockRejectedValue(new AxiosError("timeout", "ECONNABORTED"));
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };
    await expect(
      createClient().get_user_info("auth-code", diagnostic),
    ).rejects.toThrow("INVALID_OBJECT");
    expect(post).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      timeout: 60000,
    });
    expect(diagnostic).toMatchObject({
      stage: "sso_request",
      sso: { upstreamErrorCode: "ECONNABORTED" },
    });
  });

  it("omits arbitrary upstream error codes and missing response status", async () => {
    jest
      .spyOn(axios, "post")
      .mockRejectedValue(
        new AxiosError("Bearer private-token", "code=secret-code"),
      );
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };

    await expect(
      createClient().get_user_info("auth-code", diagnostic),
    ).rejects.toThrow("INVALID_OBJECT");

    expect(diagnostic.sso.upstreamErrorCode).toBe("UNRECOGNIZED");
    expect(diagnostic.sso.httpStatus).toBeUndefined();
    expect(JSON.stringify(diagnostic.sso)).not.toContain("secret-code");
  });

  it("retains bounded transport frames, omits the raw header, and redacts frame credentials", async () => {
    const failure = new AxiosError("raw-secret-header", "ERR_NETWORK");
    failure.stack = [
      "AxiosError: raw-secret-header",
      "upstream raw-secret-header continuation",
      "    at request (https://sso.test/?code=auth-code:1:1)",
      ...Array.from(
        { length: 15 },
        (_, index) => `    at client (/app/client.ts:${index + 1}:1)`,
      ),
    ].join("\n");
    jest.spyOn(axios, "post").mockRejectedValue(failure);
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };

    await expect(
      createClient().get_user_info("auth-code", diagnostic),
    ).rejects.toThrow("INVALID_OBJECT");

    expect(diagnostic.sso.transportErrorStack).toEqual({
      frames: expect.arrayContaining(["    at client (/app/client.ts:1:1)"]),
      truncated: true,
    });
    const stack = diagnostic.sso.transportErrorStack as { frames: string[] };
    expect(stack.frames).toHaveLength(12);
    const persisted = JSON.stringify(
      boundDiagnosticJson(diagnostic.sso, diagnostic.secrets),
    );
    expect(persisted).not.toContain("raw-secret-header");
    expect(persisted).not.toContain("auth-code");
    expect(persisted).toContain("/app/client.ts:1:1");
  });

  it.each([400, 403, 503])(
    "keeps resolved HTTP %i as a response failure",
    async status => {
      respond({ password: "secret-body" }, status);
      const diagnostic: SsoLoginDiagnostic = { stage: "start" };

      await expect(
        createClient().get_user_info("auth-code", diagnostic),
      ).rejects.toThrow("INVALID_OBJECT");

      expect(diagnostic.stage).toBe("sso_response");
      expect(diagnostic.sso).toEqual({
        httpStatus: status,
        profileState: "http_error",
      });
    },
  );

  it.each([null, "invalid-profile"])(
    "distinguishes missing/invalid profiles from JSON parse failures: %s",
    async body => {
      respond(body);
      const diagnostic: SsoLoginDiagnostic = { stage: "start" };

      await expect(
        createClient().get_user_info("auth-code", diagnostic),
      ).rejects.toThrow("INVALID_OBJECT");

      expect(diagnostic.sso.profileState).toBe(
        body === null ? "missing" : "invalid_shape",
      );
      expect(diagnostic.sso.parseErrors).toBeUndefined();
    },
  );

  it("registers signing secrets for final sanitization of allowed profile fields", async () => {
    respond({
      kaist_v2_info: { std_no: "auth-code", std_status_kor: "secret-key" },
      access_token: "secret-token",
    });
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };

    await createClient().get_user_info("auth-code", diagnostic);

    expect(diagnostic.secrets).toEqual([
      "auth-code",
      "secret-key",
      expect.stringMatching(/^[0-9a-f]{32}$/),
    ]);
    const stored = JSON.stringify(
      boundDiagnosticJson(diagnostic.sso, diagnostic.secrets),
    );
    expect(stored).not.toContain("auth-code");
    expect(stored).not.toContain("secret-key");
    expect(stored).not.toContain("secret-token");
  });

  it("uses the injected random generator for login state", () => {
    const client = new Client(
      "client-id",
      "secret-key",
      clock,
      randomGenerator,
    );

    const { state, url } = client.get_login_params();

    expect(randomGenerator.hex).toHaveBeenCalledWith(10);
    expect(state).toBe("fixed-state");
    expect(url).toContain("state=fixed-state");
  });

  it("uses the injected clock for signed URLs", () => {
    const client = new Client(
      "client-id",
      "secret-key",
      clock,
      randomGenerator,
    );

    const logoutUrl = client.get_logout_url("sid", "https://clubs.test");

    expect(logoutUrl).toContain("timestamp=1780444800");
  });
});
