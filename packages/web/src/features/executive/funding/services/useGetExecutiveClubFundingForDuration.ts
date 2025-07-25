import { useQuery } from "@tanstack/react-query";

import apiFnd009, {
  ApiFnd009RequestQuery,
  ApiFnd009ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd009";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const executiveClubFundingForDurationQueryFn = async (
  clubId: number,
  query: ApiFnd009RequestQuery,
): Promise<ApiFnd009ResponseOk> => {
  try {
    const { data } = await axiosClientWithAuth.get(apiFnd009.url(clubId), {
      params: query,
    });

    return data;
  } catch (error) {
    return Promise.reject(error);
  }
};

const useGetExecutiveClubFundingForDuration = (
  clubId: number,
  query: ApiFnd009RequestQuery,
) =>
  useQuery<ApiFnd009ResponseOk, Error>({
    queryKey: [apiFnd009.url(clubId), query.activityDurationId],
    queryFn: () => executiveClubFundingForDurationQueryFn(clubId, query),
  });

export default useGetExecutiveClubFundingForDuration;

defineAxiosMock(mock => {
  mock.onGet(apiFnd009.url(1)).reply(() => [200, {}]);
});
