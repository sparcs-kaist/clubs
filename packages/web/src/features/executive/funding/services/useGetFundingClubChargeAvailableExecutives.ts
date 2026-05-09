import { useQuery } from "@tanstack/react-query";

import apiFnd016, {
  ApiFnd016ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd016";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

interface UseGetFundingClubChargeAvailableExecutivesProps {
  clubIds: number[];
}

const useGetFundingClubChargeAvailableExecutives = ({
  clubIds,
}: UseGetFundingClubChargeAvailableExecutivesProps) =>
  useQuery<ApiFnd016ResponseOk, Error>({
    queryKey: [apiFnd016.url(), clubIds],
    queryFn: async (): Promise<ApiFnd016ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiFnd016.url(), {
        params: { clubIds },
      });

      return data;
    },
  });

export default useGetFundingClubChargeAvailableExecutives;
