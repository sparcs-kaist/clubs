import axios from "axios";

type ApiErrorResponse = {
  message?: string | string[];
};

const getApiErrorMessage = (error: Error, fallbackMessage: string) => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage;
  }

  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join("\n");
  }

  return message || fallbackMessage;
};

export default getApiErrorMessage;
