import { useQuery } from "@tanstack/react-query";

import apiOvv002, {
  ApiOvv002RequestQuery,
  ApiOvv002ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv002";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetClubInfoKROverview = (requestQuery: ApiOvv002RequestQuery) =>
  useQuery<ApiOvv002ResponseOK, Error>({
    queryKey: [apiOvv002.url(), requestQuery],
    queryFn: async (): Promise<ApiOvv002ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiOvv002.url(), {
        params: requestQuery,
      });

      return data;
    },
  });

export default useGetClubInfoKROverview;

defineAxiosMock(mock => {
  mock.onGet(apiOvv002.url()).reply(() => [
    200,
    [
      {
        clubId: 12,
        divisionName: "연행예술",
        district: "예술",
        clubTypeEnum: 1,
        clubNameKr: "Lunatic",
        clubNameEn: "Lunatic",
        fieldsOfActivity: "스트릿댄스",
        foundingYear: 2004,
        professor: "홍길동",
        totalMemberCnt: 77,
        regularMemberCnt: 73,
        clubBuildingEnum: null,
        roomLocation: null,
        warning: null,
        caution: null,
      },
      {
        clubId: 11,
        divisionName: "연행예술",
        district: "예술",
        clubTypeEnum: 1,
        clubNameKr: "일루젼 카이스트",
        clubNameEn: "illusion KAIST",
        fieldsOfActivity: "스트릿 및 K-POP 댄스",
        foundingYear: 1997,
        professor: "홍길동",
        totalMemberCnt: 33,
        regularMemberCnt: 33,
        clubBuildingEnum: null,
        roomLocation: null,
        warning: null,
        caution: null,
      },
      {
        clubId: 14,
        divisionName: "연행예술",
        district: "예술",
        clubTypeEnum: 1,
        clubNameKr: "Number",
        clubNameEn: "Number",
        fieldsOfActivity: "창작 뮤지컬 제작",
        foundingYear: 2015,
        professor: "홍길동",
        totalMemberCnt: 30,
        regularMemberCnt: 30,
        clubBuildingEnum: null,
        roomLocation: null,
        warning: null,
        caution: null,
      },
      {
        clubId: 10,
        divisionName: "연행예술",
        district: "예술",
        clubTypeEnum: 1,
        clubNameKr: "이박터",
        clubNameEn: "ibagutor",
        fieldsOfActivity: "연극",
        foundingYear: 1986,
        professor: null,
        totalMemberCnt: 25,
        regularMemberCnt: 25,
        clubBuildingEnum: null,
        roomLocation: null,
        warning: null,
        caution: null,
      },
      {
        clubId: 13,
        divisionName: "연행예술",
        district: "예술",
        clubTypeEnum: 1,
        clubNameKr: "MindFreak",
        clubNameEn: "MindFreak",
        fieldsOfActivity: "마술 및 타로",
        foundingYear: 2006,
        professor: null,
        totalMemberCnt: 51,
        regularMemberCnt: 51,
        clubBuildingEnum: null,
        roomLocation: null,
        warning: null,
        caution: null,
      },
    ],
  ]);
});
