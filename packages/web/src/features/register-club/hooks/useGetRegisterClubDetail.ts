import { useQuery } from "@tanstack/react-query";

import {
  ApiReg011RequestParam,
  ApiReg011ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg011";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

import { registerClubDetailGet } from "../services/_atomic/registerClubApiList";

const useRegisterClubDetail = (
  profile: string,
  requestParam: ApiReg011RequestParam,
) =>
  useQuery<ApiReg011ResponseOk, Error>({
    queryKey: [
      registerClubDetailGet(profile, requestParam.applyId.toString()),
      requestParam.applyId,
    ],
    queryFn: async (): Promise<ApiReg011ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        registerClubDetailGet(profile, requestParam.applyId.toString()),
        {},
      );

      return data;
    },
  });

export default useRegisterClubDetail;
