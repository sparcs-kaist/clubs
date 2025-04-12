"use client";

import { useQuery } from "@tanstack/react-query";

import apiReg021, {
  ApiReg021ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg021";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockProfClubRegister } from "./_mock/mockMyRegister";

const useProfClubRegisterList = () =>
  useQuery<ApiReg021ResponseOk, Error>({
    queryKey: [apiReg021.url()],
    queryFn: async (): Promise<ApiReg021ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg021.url(), {});

      return data;
    },
  });

export default useProfClubRegisterList;

defineAxiosMock(mock => {
  mock.onGet(apiReg021.url()).reply(() => [200, mockProfClubRegister]);
});
