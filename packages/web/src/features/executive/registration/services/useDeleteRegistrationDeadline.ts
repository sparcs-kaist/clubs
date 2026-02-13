import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiSem019 } from "@clubs/interface/api/semester/apiSem019";
import {
  apiSem020,
  ApiSem020RequestParam,
  ApiSem020ResponseOk,
} from "@clubs/interface/api/semester/apiSem020";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useDeleteRegistrationDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem020ResponseOk, Error, ApiSem020RequestParam>({
    mutationFn: async (params): Promise<ApiSem020ResponseOk> => {
      const { data } = await axiosClientWithAuth.delete(
        apiSem020.url(params.registrationDeadlineId),
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem019.url] });
    },
  });
};

export default useDeleteRegistrationDeadline;

defineAxiosMock(mock => {
  mock.onDelete(apiSem020.url(1)).reply(() => [200, {}]);
});
