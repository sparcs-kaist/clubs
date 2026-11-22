import { useQuery } from "@tanstack/react-query";

import {
  ApiReg011RequestParam,
  ApiReg011ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg011";
import apiReg022, {
  ApiReg022ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg022";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

import { registerClubDetailGet } from "./_atomic/registerClubApiList";

interface UseGetRegisterClubDetailOptions {
  enabled?: boolean;
}

const useGetRegisterClubDetail = (
  profile: UserTypeEnum,
  requestParam: ApiReg011RequestParam,
  options: UseGetRegisterClubDetailOptions = {},
) =>
  useQuery<ApiReg011ResponseOk, Error>({
    queryKey: [
      registerClubDetailGet(profile, requestParam.applyId.toString()),
      requestParam.applyId,
    ],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<ApiReg011ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        registerClubDetailGet(profile, requestParam.applyId.toString()),
        {},
      );

      return data;
    },
  });

export const useGetProfessorRegisterClubDetail = (
  applyId: number,
  enabled: boolean,
) => {
  const url = apiReg022.url(String(applyId));
  return useQuery<ApiReg022ResponseOk>({
    queryKey: [url, applyId],
    enabled,
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get<ApiReg022ResponseOk>(url);
      return data;
    },
  });
};

export default useGetRegisterClubDetail;
