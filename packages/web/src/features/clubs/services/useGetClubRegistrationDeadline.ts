import { useQuery } from "@tanstack/react-query";

import apiReg027, {
  ApiReg027ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg027";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetClubRegistrationDeadline = () =>
  useQuery<ApiReg027ResponseOk, Error>({
    queryKey: [apiReg027.url()],
    queryFn: async (): Promise<ApiReg027ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg027.url(), {});

      return data;
    },
  });

export default useGetClubRegistrationDeadline;

defineAxiosMock(mock => {
  mock.onGet(apiReg027.url()).reply(() => [
    200,
    {
      semester: {
        id: 1,
        year: 2025,
        name: "봄",
        startTerm: new Date(),
        endTerm: new Date(),
      },
      deadline: {
        startDate: new Date(),
        endDate: new Date(),
      },
    },
  ]);
});
