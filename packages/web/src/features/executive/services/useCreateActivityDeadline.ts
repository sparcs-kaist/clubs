import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  apiSem006,
  ApiSem006RequestBody,
  ApiSem006ResponseCreated,
} from "@clubs/interface/api/semester/apiSem006";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useCreateActivityDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem006ResponseCreated, Error, ApiSem006RequestBody>({
    mutationFn: async (body): Promise<ApiSem006ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiSem006.url(), body);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityDeadlines"] });
    },
  });
};

export default useCreateActivityDeadline;
