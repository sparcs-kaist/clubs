import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  apiSem015,
  ApiSem015RequestBody,
  ApiSem015ResponseCreated,
} from "@clubs/interface/api/semester/apiSem015";
import { apiSem016 } from "@clubs/interface/api/semester/apiSem016";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useCreateFundingDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem015ResponseCreated, Error, ApiSem015RequestBody>({
    mutationFn: async (body): Promise<ApiSem015ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiSem015.url, body);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem016.url] });
    },
  });
};

export default useCreateFundingDeadline;

defineAxiosMock(mock => {
  mock.onPost(apiSem015.url).reply(() => [201, {}]);
});
