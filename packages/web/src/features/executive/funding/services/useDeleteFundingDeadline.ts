import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiSem016 } from "@clubs/interface/api/semester/apiSem016";
import {
  apiSem017,
  ApiSem017RequestParam,
  ApiSem017ResponseOk,
} from "@clubs/interface/api/semester/apiSem017";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useDeleteFundingDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem017ResponseOk, Error, ApiSem017RequestParam>({
    mutationFn: async (params): Promise<ApiSem017ResponseOk> => {
      const { data } = await axiosClientWithAuth.delete(
        apiSem017.url(params.fundingDeadlineId),
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem016.url] });
    },
  });
};

export default useDeleteFundingDeadline;

defineAxiosMock(mock => {
  mock.onDelete(apiSem017.url(1)).reply(() => [200, {}]);
});
