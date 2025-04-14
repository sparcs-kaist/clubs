import { useQuery } from "@tanstack/react-query";

import apiFnd010, {
  ApiFnd010ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd010";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

interface UseGetChargedFundingsProps {
  executiveId: number;
}

const useGetChargedFundings = ({ executiveId }: UseGetChargedFundingsProps) =>
  useQuery<ApiFnd010ResponseOk, Error>({
    queryKey: [apiFnd010.url(executiveId)],
    queryFn: async (): Promise<ApiFnd010ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiFnd010.url(executiveId),
        {},
      );

      return data;
    },
  });

export default useGetChargedFundings;
