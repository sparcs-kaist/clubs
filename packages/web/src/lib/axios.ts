import axios, { AxiosError } from "axios";
import MockAdapter from "axios-mock-adapter";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import qs from "qs";

import { env } from "@sparcs-clubs/web/env";

import tokenInterceptor from "./_axios/axiosAuthTokenInterceptor";
import errorInterceptor from "./_axios/axiosErrorInterceptor";
import mockInterceptor, {
  mockResponseInterceptor,
} from "./_axios/axiosMockInterceptor";

// Timezone 설정
const TIMEZONE = "Asia/Seoul";

function parseKST(data: unknown): unknown {
  if (typeof data !== "string") return data;

  try {
    return JSON.parse(data, (key, value) => {
      if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
      ) {
        const parsedDate = new Date(value);
        const toZoneTime = toZonedTime(parsedDate, TIMEZONE);
        return toZoneTime;
      }
      return value;
    });
  } catch (_err) {
    return data;
  }
}

/**
 * 주어진 객체의 Date 프로퍼티들을 모두 DB에 넣을 수 있도록 KST 기준으로 변환
 * Query 객체에 사용
 * @param obj
 */
export const makeObjectPropsToKST = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Date) {
    return fromZonedTime(obj, TIMEZONE);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => makeObjectPropsToKST(item));
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = makeObjectPropsToKST(value);
    });
    return result;
  }

  return obj;
};

/**
 * @name axiosClient
 * @author Jiho Park (night@sparcs.org)
 * @description Axios Client used for backend API requests that require NO authentication
 */
export const axiosClient = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  transformRequest: [data => JSON.stringify(makeObjectPropsToKST(data))],
  transformResponse: [data => parseKST(data)],
  paramsSerializer: {
    serialize: params =>
      qs.stringify(makeObjectPropsToKST(params), {
        arrayFormat: "repeat", // TODO: 나중에 arrayFormat:bracket으로 변경 (len(1) 인 배열 넘기는 경우 해결)
      }),
  },
});

// Defines middleware for axiosClient
axiosClient.interceptors.request.use(
  mockInterceptor.onFulfilled,
  mockInterceptor.onRejected,
);

axiosClient.interceptors.response.use(
  mockResponseInterceptor.onFulfilled,
  mockResponseInterceptor.onRejected,
);

axiosClient.interceptors.response.use(
  errorInterceptor.onFulfilled,
  errorInterceptor.onRejected,
);

/**
 * @name.axiosClientWithCredentials
 * @author Jiho Park
 * @description Axios Client used for backend API requests that REQUIRE authentication
 */

export const axiosClientWithAuth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  transformRequest: [data => JSON.stringify(makeObjectPropsToKST(data))],
  transformResponse: [data => parseKST(data)],
  paramsSerializer: {
    serialize: params => {
      const changedParam = makeObjectPropsToKST(params);
      const res = qs.stringify(changedParam, {
        arrayFormat: "repeat", // TODO: 나중에 arrayFormat:bracket으로 변경 (len(1) 인 배열 넘기는 경우 해결)
      });
      return res;
    },
  },
});

axiosClientWithAuth.interceptors.request.use(
  mockInterceptor.onFulfilled,
  mockInterceptor.onRejected,
);

axiosClientWithAuth.interceptors.request.use(
  tokenInterceptor.onFulfilled,
  tokenInterceptor.onRejected,
);

axiosClientWithAuth.interceptors.response.use(
  mockResponseInterceptor.onFulfilled,
  mockResponseInterceptor.onRejected,
);

axiosClientWithAuth.interceptors.response.use(
  errorInterceptor.onFulfilled,
  errorInterceptor.onRejected,
);

/**
 * @name defineAxiosMock
 * @author Jiho Park (night@sparcs.org)
 * @description Defines the mock mode for axiosClient
 */
export const defineAxiosMock = (() => {
  if (env.NEXT_PUBLIC_API_MOCK_MODE) {
    const mockAxiosClient = new MockAdapter(axiosClient, {
      onNoMatch: "passthrough",
      delayResponse: 1500,
    });

    const mockAxiosClientWithAuth = new MockAdapter(axiosClientWithAuth, {
      onNoMatch: "passthrough",
      delayResponse: 1500,
    });

    return (_builder: (mock: MockAdapter) => void) => {
      _builder(mockAxiosClient);
      _builder(mockAxiosClientWithAuth);
    };
  }

  return (_builder: (mock: MockAdapter) => void) => {};
})();

export type LibAxiosErrorType = AxiosError;
export const LibAxiosError = AxiosError;

export class UnexpectedAPIResponseError extends Error {
  constructor(response: unknown = "Unexpected API response.") {
    super(`Unexpected API response: ${response}`);
  }
}
