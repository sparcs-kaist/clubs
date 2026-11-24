import { isAxiosError } from "axios";

const getFundingFormError = (error: Error) => {
  if (!isAxiosError(error) || error.response?.status !== 400) {
    return error.message;
  }

  const message = error.response.data?.message;
  const description = typeof message === "string" ? message : message?.message;
  return typeof description === "string"
    ? description
    : "지원금 입력값을 확인해 주세요.";
};

export default getFundingFormError;
