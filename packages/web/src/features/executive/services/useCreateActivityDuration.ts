import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  apiSem011,
  ApiSem011RequestBody,
  ApiSem011ResponseCreated,
} from "@clubs/interface/api/semester/apiSem011";
import { apiSem012 } from "@clubs/interface/api/semester/apiSem012";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useCreateActivityDuration = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem011ResponseCreated, Error, ApiSem011RequestBody>({
    mutationFn: async (body): Promise<ApiSem011ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiSem011.url(), body);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem012.url()] });
    },
  });
};

export default useCreateActivityDuration;

defineAxiosMock(mock => {
  mock.onPost(apiSem011.url()).reply(() => [201, {}]);
});
