import { useQuery } from "@tanstack/react-query";

import apiFnd010, {
  ApiFnd010ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd010";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

interface UseGetChargedFundingsProps {
  executiveId: number;
}

interface UseGetChargedFundingsOptions {
  enabled?: boolean;
}

const useGetChargedFundings = (
  { executiveId }: UseGetChargedFundingsProps,
  options: UseGetChargedFundingsOptions = {},
) =>
  useQuery<ApiFnd010ResponseOk, Error>({
    queryKey: [apiFnd010.url(executiveId)],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<ApiFnd010ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiFnd010.url(executiveId),
        {},
      );

      return data;
    },
  });

export default useGetChargedFundings;
