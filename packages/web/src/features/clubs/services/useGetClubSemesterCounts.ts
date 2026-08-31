import { useQuery } from "@tanstack/react-query";

import apiClb018, {
  ApiClb018ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb018";

import { axiosClient } from "@sparcs-clubs/web/lib/axios";

const useGetClubSemesterCounts = () =>
  useQuery<ApiClb018ResponseOk, Error>({
    queryKey: [apiClb018.url()],
    queryFn: async () => {
      const { data } = await axiosClient.get(apiClb018.url());
      return apiClb018.responseBodyMap[200].parse(data);
    },
  });

export default useGetClubSemesterCounts;
