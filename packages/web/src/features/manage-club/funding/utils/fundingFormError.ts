import { isAxiosError } from "axios";

const getFundingFormError = (error: Error) => {
  if (!isAxiosError(error)) return error.message;

  const { response } = error;
  if (response?.status !== 400 && response?.status !== 409)
    return error.message;

  const message = response.data?.message;
  const description = typeof message === "string" ? message : message?.message;
  if (typeof description === "string") return description;

  return "지원금 정보와 영수증 입력값을 확인해 주세요.";
};

export default getFundingFormError;
