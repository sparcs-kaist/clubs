import axios, { AxiosResponse } from "axios";
import * as crypto from "crypto";
import * as querystring from "querystring";

import { Clock } from "@sparcs-clubs/api/common/clock/clock";
import { RandomGenerator } from "@sparcs-clubs/api/common/random/random-generator";

import { SSOUser } from "../dto/sparcs-sso.dto";
import { captureSsoProfile, SsoLoginDiagnostic } from "./sso-login-diagnostic";

// CONVERT SPARCS SSO V2 Client Version 1.1 TO TYPESCRIPT
// VALID ONLY AFTER ----(NOT VALID) ----
// Made by SPARCS SSO Team

interface Urls {
  [key: string]: string;
}
interface Params {
  [key: string]: string;
}

function captureErrorFrames(error: unknown) {
  const stack = error instanceof Error ? error.stack : "";
  const frames = (stack ?? "").split("\n").filter(line => /^\s+at /.test(line));
  return { frames: frames.slice(0, 12), truncated: frames.length > 12 };
}

/* eslint-disable camelcase */
export class Client {
  private readonly SERVER_DOMAIN: string = "https://sparcssso.kaist.ac.kr/";

  private readonly BETA_DOMAIN: string = "https://ssobeta.sparcs.org/";

  private DOMAIN: string = "";

  private readonly API_PREFIX: string = "api/";

  private readonly VERSION_PREFIX: string = "v2/";

  private readonly TIMEOUT: number = 60;

  private URLS: Urls = {
    token_require: "token/require/",
    token_info: "token/info/",
    logout: "logout/",
    unregister: "unregister/",
    point: "point/",
    notice: "notice/",
  };

  private client_id: string;

  private secret_key: string;

  constructor(
    client_id: string,
    secret_key: string,
    private readonly clock: Clock,
    private readonly randomGenerator: RandomGenerator,
    private is_beta: boolean = false,
    private server_addr: string = "",
  ) {
    /* Initialize SPARCS SSO Client
    :param client_id: your client id
    :param secret_key: your secret key
    :param is_beta: true iff you want to use SPARCS SSO beta server
    :param server_addr: SPARCS SSO server addr (only for testing) */
    this.DOMAIN = is_beta ? this.BETA_DOMAIN : this.SERVER_DOMAIN;
    this.DOMAIN = server_addr || this.DOMAIN;

    const base_url = `${this.DOMAIN}${this.API_PREFIX}${this.VERSION_PREFIX}`;
    this.URLS = Object.entries(this.URLS).reduce((acc, [key, value]) => {
      acc[key] = `${base_url}${value}`;
      return acc;
    }, {} as Urls);
    this.client_id = client_id;
    this.secret_key = secret_key;
  }

  // eslint-disable-next-line no-underscore-dangle
  private _sign_payload(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Array<any>,
    append_timestamp: boolean = true,
  ): [string, number] {
    const timestamp: number = Math.floor(this.clock.now().getTime() / 1000);
    if (append_timestamp) {
      payload.push(timestamp.toString());
    }
    const msg: string = payload.join("");
    const sign: string = crypto
      .createHmac("md5", this.secret_key)
      .update(msg, "utf-8")
      .digest("hex");
    return [sign, timestamp];
  }

  // eslint-disable-next-line no-underscore-dangle
  private _validate_sign(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any[],
    timestamp: string,
    sign: string,
  ): boolean {
    // eslint-disable-next-line no-underscore-dangle
    const [sign_client, time_client]: [string, number] = this._sign_payload(
      payload,
      false,
    );
    if (Math.abs(Number(time_client) - Number(timestamp)) > 10) {
      return false;
    }
    if (
      !crypto.timingSafeEqual(
        new Uint8Array(Buffer.from(sign_client, "utf-8")),
        new Uint8Array(Buffer.from(sign, "utf-8")),
      )
    ) {
      return false;
    }
    return true;
  }

  // eslint-disable-next-line no-underscore-dangle
  private async _post_data(
    url: string,
    data: querystring.ParsedUrlQueryInput,
    context?: SsoLoginDiagnostic,
  ): Promise<SSOUser> {
    /**
     *@SSO
     *querystring.stringify(data)인지 .toString('utf8')붙여야 하는지 확인 필요
     */
    const diagnostic: SsoLoginDiagnostic = context ?? { stage: "sso_request" };
    diagnostic.stage = "sso_request";
    diagnostic.sso = { profileState: "not_received" };
    try {
      const r: AxiosResponse = await axios.post(
        url,
        querystring.stringify(data),
      );
      diagnostic.stage = "sso_response";
      diagnostic.sso.httpStatus = r.status;
      if (r.status !== 200) {
        diagnostic.sso.profileState = "http_error";
      }
      if (r.status === 400) {
        throw new Error("INVALID_REQUEST");
      } else if (r.status === 403) {
        throw new Error("NO_PERMISSION");
      } else if (r.status !== 200) {
        throw new Error("UNKNOWN_ERROR");
      }

      const result = r.data;
      diagnostic.sso.profile = captureSsoProfile(result);
      diagnostic.sso.profileState = "invalid_shape";
      if (result === null) {
        diagnostic.sso.profileState = "missing";
        throw new Error("INVALID_OBJECT");
      }
      if (typeof result !== "object") {
        throw new Error("INVALID_OBJECT");
      }
      if (!Array.isArray(result)) {
        diagnostic.sso.profileState = result.kaist_v2_info
          ? "available"
          : "missing";
      }

      // V1 kaist_info 파싱 (하위 호환성 유지용, 실제로는 사용 안 함)
      diagnostic.stage = "sso_parse";
      try {
        result.kaist_info = result.kaist_info
          ? JSON.parse(result.kaist_info)
          : {};
      } catch (error) {
        diagnostic.sso.profileState = "v1_parse_failed";
        diagnostic.sso.parseErrors = [
          {
            target: "kaist_info",
            name: error instanceof SyntaxError ? "SyntaxError" : "Error",
            message: "Failed to parse kaist_info",
            stack: captureErrorFrames(error),
          },
        ];
        throw error;
      }

      // V2 kaist_v2_info 파싱 추가
      const hasV2Info = Boolean(result.kaist_v2_info);
      const isV2String = typeof result.kaist_v2_info === "string";
      if (hasV2Info && isV2String) {
        try {
          result.kaist_v2_info = JSON.parse(result.kaist_v2_info);
        } catch (error) {
          diagnostic.sso.profileState = "v2_parse_failed";
          diagnostic.sso.parseErrors = [
            {
              target: "kaist_v2_info",
              name: error instanceof SyntaxError ? "SyntaxError" : "Error",
              message: "Failed to parse kaist_v2_info",
              stack: captureErrorFrames(error),
            },
          ];
          result.kaist_v2_info = null;
        }
      }
      if (diagnostic.sso.profileState === "available") {
        const v2Info = result.kaist_v2_info;
        if (!v2Info) {
          diagnostic.sso.profileState = "missing";
        } else if (typeof v2Info !== "object") {
          diagnostic.sso.profileState = "invalid_shape";
        } else if (Array.isArray(v2Info)) {
          diagnostic.sso.profileState = "invalid_shape";
        }
      }

      return result as SSOUser;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        diagnostic.sso.profileState = "http_error";
        diagnostic.sso.transportErrorName = "AxiosError";
        diagnostic.sso.transportErrorMessage = "SSO HTTP request failed";
        diagnostic.sso.transportErrorStack = captureErrorFrames(error);
        const httpStatus = error.response?.status;
        if (Number.isInteger(httpStatus)) {
          diagnostic.sso.httpStatus = httpStatus;
        }
        // Error messages/config/body can contain the signed request or tokens.
        const allowedCodes = [
          "ERR_BAD_REQUEST",
          "ERR_BAD_RESPONSE",
          "ERR_NETWORK",
          "ERR_CANCELED",
          "ECONNABORTED",
          "ECONNRESET",
          "ECONNREFUSED",
          "ETIMEDOUT",
          "ENOTFOUND",
          "EAI_AGAIN",
          "ERR_FR_TOO_MANY_REDIRECTS",
        ];
        diagnostic.sso.upstreamErrorCode = allowedCodes.includes(error.code)
          ? error.code
          : "UNRECOGNIZED";
      }
      throw new Error("INVALID_OBJECT");
    }
  }

  public get_login_params(): { url: string; state: string } {
    /*
    Get login parameters for SPARCS SSO login
    :returns: [url, state] where url is a url to redirect user,
        and state is random string to prevent CSRF
    */
    /**
     * @SSO
     * randomBytes에 10? 5? 둘중 어떤걸 넘겨줄지. gpt는 5라고 하고 파이썬은 token_hex(10) 10 같긴 한데....혹시나 해서
     */
    const state: string = this.randomGenerator.hex(10);
    const params: Params = { client_id: this.client_id, state };
    // console.log(this.client_id);
    // console.log(state);
    // console.log(this.URLS.token_require);
    const url: string = `${this.URLS.token_require}?${querystring.stringify(
      params,
    )}`;
    // console.log("url", url);
    return { url, state };
  }

  public async get_user_info(
    code: string,
    diagnostic?: SsoLoginDiagnostic,
  ): Promise<SSOUser> {
    /*
    Exchange a code to user information
    :param code: the code that given by SPARCS SSO server
    :returns: a dictionary that contains user information
    */
    // eslint-disable-next-line no-underscore-dangle
    const [sign, timestamp]: [string, number] = this._sign_payload([code]);
    if (diagnostic) {
      const secrets = diagnostic.secrets ?? [];
      secrets.push(code, this.secret_key, sign);
      Object.assign(diagnostic, { secrets });
    }
    const params = {
      client_id: this.client_id,
      code,
      timestamp,
      sign,
    };
    // eslint-disable-next-line no-underscore-dangle
    return this._post_data(this.URLS.token_info, params, diagnostic);
  }

  public get_logout_url(sid: string, redirect_uri: string): string {
    /*
    Get a logout url to sign out a user
    :param sid: the user's service id
    :param redirect_uri: a redirect uri after the user sign out
    :returns: the final url to sign out a user
    */
    // eslint-disable-next-line no-underscore-dangle
    const [sign, timestamp]: [string, number] = this._sign_payload([
      sid,
      redirect_uri,
    ]);
    const params = {
      client_id: this.client_id,
      sid,
      timestamp,
      redirect_uri,
      sign,
    };
    return `${this.URLS.logout}?${querystring.stringify(params)}`;
  }

  public async get_notice(
    offset: number = 0,
    limit: number = 3,
    date_after: number = 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    /*
    Get some notices from SPARCS SSO
    :param offset: a offset to fetch from
    :param limit: a number of notices to fetch
    :param date_after: an oldest date; YYYYMMDD formated string
    :returns: a server response; check the full docs
    */
    const params = { offset, limit, date_after };
    const r = await axios.get(this.URLS.notice, { params });
    return r.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public parse_unregister_request(data_dict: any): string {
    /*
    Parse unregister request from SPARCS SSO server
    :param data_dict: a data dictionary that the server sent
    :returns: the user's service id
    :raises RuntimeError: raise iff the request is invalid
    */

    const client_id: string = data_dict.clietn_id || "";
    const sid: string = data_dict.sid || "";
    const timestamp: string = data_dict.timestamp || "";
    const sign: string = data_dict.sign || "";

    if (client_id !== this.client_id) {
      throw new Error("INVALID_REQUEST");
      // eslint-disable-next-line no-underscore-dangle
    } else if (!this._validate_sign([sid], timestamp, sign)) {
      throw new Error("INVALID_REQUEST");
    }

    return sid;
  }
}
