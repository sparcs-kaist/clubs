import { AxiosError, AxiosResponse, HttpStatusCode } from "axios";

import {
  removeLocalStorageItem,
  setLoginTokens,
} from "@sparcs-clubs/web/utils/localStorage";
import logger from "@sparcs-clubs/web/utils/logger";

import postRefresh from "./postRefresh";

const errorInterceptor = {
  onFulfilled(values: AxiosResponse) {
    return values;
  },
  async onRejected(error: AxiosError) {
    switch (error.response?.status) {
      case HttpStatusCode.Unauthorized: {
        try {
          const response = await postRefresh();
          if (response.accessToken) {
            setLoginTokens(response.accessToken);
            logger.log("Logged in successfully.");
          }
        } catch (refreshError) {
          logger.error("Login failed", refreshError);
          removeLocalStorageItem("accessToken");
          removeLocalStorageItem("responseToken");
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
      case HttpStatusCode.Forbidden: {
        const previousPage = document.referrer;

        if (previousPage.startsWith(window.location.origin)) {
          window.history.back();
        } else {
          window.location.href = "/";
        }

        return Promise.reject(error);
      }
      default: {
        return Promise.reject(error);
      }
    }
  },
};

export default errorInterceptor;
