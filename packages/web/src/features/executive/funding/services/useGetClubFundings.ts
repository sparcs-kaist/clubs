import { useQuery } from "@tanstack/react-query";

import apiFnd009, {
  ApiFnd009ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd009";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

interface UseGetClubFundingsProps {
  clubId: number;
}

const useGetClubFundings = ({ clubId }: UseGetClubFundingsProps) =>
  useQuery<ApiFnd009ResponseOk, Error>({
    queryKey: [apiFnd009.url(clubId)],
    queryFn: async (): Promise<ApiFnd009ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiFnd009.url(clubId), {});

      return data;
    },
  });

export default useGetClubFundings;
