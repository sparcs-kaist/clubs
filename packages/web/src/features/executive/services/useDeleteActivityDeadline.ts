import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  apiSem010,
  ApiSem010RequestParam,
  ApiSem010ResponseOK,
} from "@clubs/interface/api/semester/apiSem010";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useDeleteActivityDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem010ResponseOK, Error, ApiSem010RequestParam>({
    mutationFn: async ({ deadlineId }): Promise<ApiSem010ResponseOK> => {
      const { data } = await axiosClientWithAuth.delete(
        apiSem010.url(deadlineId),
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityDeadlines"] });
    },
    onError: () => {
      errorHandler("활동보고서 제출 기한 삭제에 실패하였습니다");
    },
  });
};

export default useDeleteActivityDeadline;
