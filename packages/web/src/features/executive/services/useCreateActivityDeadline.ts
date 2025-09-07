import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  apiSem006,
  ApiSem006RequestBody,
  ApiSem006ResponseCreated,
} from "@clubs/interface/api/semester/apiSem006";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
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
    onError: () => {
      errorHandler("활동보고서 제출 기한 생성에 실패하였습니다");
    },
  });
};

export default useCreateActivityDeadline;
