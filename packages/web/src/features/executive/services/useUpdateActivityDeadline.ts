import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  apiSem009,
  ApiSem009RequestBody,
  ApiSem009RequestParam,
  ApiSem009ResponseOk,
} from "@clubs/interface/api/semester/apiSem009";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

type UpdateActivityDeadlineParams = ApiSem009RequestParam & {
  body: ApiSem009RequestBody;
};

const useUpdateActivityDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem009ResponseOk, Error, UpdateActivityDeadlineParams>({
    mutationFn: async ({ deadlineId, body }): Promise<ApiSem009ResponseOk> => {
      const { data } = await axiosClientWithAuth.put(
        apiSem009.url(deadlineId),
        body,
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityDeadlines"] });
    },
    onError: () => {
      errorHandler("활동보고서 제출 기간 수정에 실패하였습니다");
    },
  });
};

export default useUpdateActivityDeadline;

defineAxiosMock(mock => {
  mock.onPut(apiSem009.url(1)).reply(() => [200, { id: 1 }]);
});
