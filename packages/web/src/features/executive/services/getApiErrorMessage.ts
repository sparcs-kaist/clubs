import { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
};

const getApiErrorMessage = (error: Error, fallbackMessage: string) => {
  if (!(error instanceof AxiosError)) {
    return fallbackMessage;
  }

  const data = error.response?.data as ApiErrorResponse | undefined;
  const message = Array.isArray(data?.message)
    ? data.message.join("\n")
    : data?.message;

  return [fallbackMessage, message || data?.error].filter(Boolean).join("\n");
};

export default getApiErrorMessage;
