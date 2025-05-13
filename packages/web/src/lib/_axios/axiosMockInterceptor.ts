import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import log from "loglevel";

import { env } from "@sparcs-clubs/web/env";
import logger from "@sparcs-clubs/web/utils/logger";

export const BASE_URL = env.NEXT_PUBLIC_API_URL ?? "";

const mockInterceptor = {
  async onFulfilled(config: InternalAxiosRequestConfig) {
    const responseConfig = { ...config };

    try {
      const parsedUrl = new URL(config.url ?? "", BASE_URL);

      if (parsedUrl.host == null) {
        return responseConfig;
      }
    } catch (error) {
      logger.error("Mock interceptor error", error);
    }

    if (env.NEXT_PUBLIC_API_MOCK_MODE) {
      const method = config?.method;
      const url = config?.url;
      const requestBody = config?.data || {};
      const queryParams = config?.params || {};
      log.debug(config);
      log.debug(
        `${method} ${url}\nbody: ${JSON.stringify(
          requestBody,
        )}\nqueryParams: ${JSON.stringify(queryParams)}`,
      );
      return responseConfig;
    }

    responseConfig.baseURL = BASE_URL;

    return responseConfig;
  },
  onRejected(error: AxiosError) {
    return Promise.reject(error);
  },
};

export const mockResponseInterceptor = {
  onFulfilled(response: AxiosResponse) {
    if (env.NEXT_PUBLIC_API_MOCK_MODE) {
      log.debug(
        `Response from ${response.config.method} ${response.config.url}:\n${JSON.stringify(
          response.data,
          null,
          2,
        )}`,
      );
    }
    return response;
  },
  onRejected(error: AxiosError) {
    return Promise.reject(error);
  },
};

export default mockInterceptor;
