import { useQuery } from "@tanstack/react-query";

import apiReg028, {
  ApiReg028ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg028";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetMemberRegistrationDeadline = () =>
  useQuery<ApiReg028ResponseOk, Error>({
    queryKey: [apiReg028.url()],
    queryFn: async (): Promise<ApiReg028ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg028.url(), {});

      return data;
    },
  });

export default useGetMemberRegistrationDeadline;

defineAxiosMock(mock => {
  mock.onGet(apiReg028.url()).reply(() => [
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
