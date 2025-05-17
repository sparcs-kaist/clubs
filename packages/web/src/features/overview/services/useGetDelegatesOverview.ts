import { useQuery } from "@tanstack/react-query";

import apiOvv001, {
  ApiOvv001RequestQuery,
  ApiOvv001ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv001";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetDelegatesOverview = (requestQuery: ApiOvv001RequestQuery) =>
  useQuery<ApiOvv001ResponseOK, Error>({
    queryKey: [apiOvv001.url(), requestQuery],
    queryFn: async (): Promise<ApiOvv001ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiOvv001.url(), {
        params: requestQuery,
      });

      return data;
    },
  });

export default useGetDelegatesOverview;

defineAxiosMock(mock => {
  mock.onGet(apiOvv001.url()).reply(() => [
    200,
    [
      {
        clubId: 8,
        district: "생활문화",
        divisionName: "생활문화",
        clubTypeEnum: 1,
        clubNameKr: "OPTeamus",
        clubNameEn: "OPTeamus",
        representative: {
          clubId: 8,
          delegateType: 1,
          name: "홍길동",
          studentNumber: 20240000,
          phoneNumber: null,
          kaistEmail: "kaist@kaist.ac.kr",
          department: null,
        },
        delegate1: {
          clubId: 8,
          delegateType: 2,
          name: "홍길동",
          studentNumber: 20240000,
          phoneNumber: null,
          kaistEmail: "kaist@kaist.ac.kr",
          department: null,
        },
        delegate2: {
          clubId: 8,
          delegateType: 3,
          name: "홍길동",
          studentNumber: 20240000,
          phoneNumber: null,
          kaistEmail: "kaist@kaist.ac.kr",
          department: null,
        },
      },
      {
        clubId: 10,
        district: "예술",
        divisionName: "연행예술",
        clubTypeEnum: 1,
        clubNameKr: "이박터",
        clubNameEn: "ibagutor",
        representative: {
          clubId: 10,
          delegateType: 1,
          name: "홍길동",
          studentNumber: 20240000,
          phoneNumber: "1577-1577",
          kaistEmail: "kaist@kaist.ac.kr",
          department: null,
        },
        delegate1: {
          clubId: 10,
          delegateType: 2,
          name: "홍길동",
          studentNumber: 20240000,
          phoneNumber: null,
          kaistEmail: "kaist@kaist.ac.kr",
          department: null,
        },
      },
    ],
  ]);
});
