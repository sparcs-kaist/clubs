import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  apiSem018,
  ApiSem018RequestBody,
  ApiSem018ResponseCreated,
} from "@clubs/interface/api/semester/apiSem018";
import { apiSem019 } from "@clubs/interface/api/semester/apiSem019";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useCreateRegistrationDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem018ResponseCreated, Error, ApiSem018RequestBody>({
    mutationFn: async (body): Promise<ApiSem018ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiSem018.url, body);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem019.url] });
    },
  });
};

export default useCreateRegistrationDeadline;

defineAxiosMock(mock => {
  mock.onPost(apiSem018.url).reply(() => [201, {}]);
});
