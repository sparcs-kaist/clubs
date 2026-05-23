import axios, { AxiosError } from "axios";
import MockAdapter from "axios-mock-adapter";
import qs from "qs";

import { CLUBS_APP } from "@sparcs-clubs/web/constants/appInfo";
import { env } from "@sparcs-clubs/web/env";

import tokenInterceptor from "./_axios/axiosAuthTokenInterceptor";
import errorInterceptor from "./_axios/axiosErrorInterceptor";
import mockInterceptor, {
  mockResponseInterceptor,
} from "./_axios/axiosMockInterceptor";

// ============================================================================
// Timezone handling is now managed server-side by Prisma middleware.
// The API returns proper UTC dates (ISO 8601 with Z suffix).
// No client-side KST conversion is needed.
// ============================================================================

/**
 * Parse JSON response, converting ISO date strings to Date objects.
 */
function parseDates(data: unknown): unknown {
  if (typeof data !== "string") return data;

  try {
    return JSON.parse(data, (_key, value) => {
      if (typeof value === "string") {
        // ISO date format (ending in Z or with timezone offset)
        if (
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value) ||
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}$/.test(
            value,
          )
        ) {
          return new Date(value);
        }
      }
      return value;
    });
  } catch (_err) {
    return data;
  }
}

/**
 * Serialize Date objects in request data to ISO strings for JSON transport.
 */
const serializeDates = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeDates(item));
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = serializeDates(value);
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
    "x-clubs-client-version": CLUBS_APP.version,
  },
  transformRequest: [data => JSON.stringify(serializeDates(data))],
  transformResponse: [data => parseDates(data)],
  paramsSerializer: {
    serialize: params =>
      qs.stringify(serializeDates(params), {
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
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "x-clubs-client-version": CLUBS_APP.version,
  },
  transformRequest: [data => JSON.stringify(serializeDates(data))],
  transformResponse: [data => parseDates(data)],
  paramsSerializer: {
    serialize: params => {
      const changedParam = serializeDates(params);
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
