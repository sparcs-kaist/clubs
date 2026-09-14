import { useMutation } from "@tanstack/react-query";
import { Cookies } from "react-cookie";

import apiAut005, {
  ApiAut005RequestQuery,
  ApiAut005ResponseOk,
} from "@clubs/interface/api/auth/endpoint/apiAut005";
import apiAut006, {
  ApiAut006RequestBody,
  ApiAut006ResponseCreated,
} from "@clubs/interface/api/auth/endpoint/apiAut006";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";
import { setLoginTokens } from "@sparcs-clubs/web/utils/localStorage";

export const useExchangeLoginUsers = () =>
  useMutation<ApiAut005ResponseOk, Error, ApiAut005RequestQuery>({
    mutationFn: async query => {
      const { data } = await axiosClientWithAuth.get(apiAut005.url(), {
        params: query,
      });
      return apiAut005.responseBodyMap[200].parse(data);
    },
  });

export const useExchangeLogin = () =>
  useMutation<ApiAut006ResponseCreated, Error, ApiAut006RequestBody>({
    mutationFn: async body => {
      const { data } = await axiosClientWithAuth.post(apiAut006.url(), body);
      return apiAut006.responseBodyMap[201].parse(data);
    },
    onSuccess: data => {
      new Cookies().remove("accessToken", { path: "/" });
      setLoginTokens(data.accessToken);
      window.location.replace("/my");
    },
  });
