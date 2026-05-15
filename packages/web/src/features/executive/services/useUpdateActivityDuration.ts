import { useMutation, useQueryClient } from "@tanstack/react-query";

import apiAct018 from "@clubs/interface/api/activity/endpoint/apiAct018";
import { apiSem012 } from "@clubs/interface/api/semester/apiSem012";
import {
  apiSem013,
  ApiSem013RequestBody,
  ApiSem013RequestParam,
  ApiSem013ResponseOk,
} from "@clubs/interface/api/semester/apiSem013";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import getApiErrorMessage from "./getApiErrorMessage";

type UpdateActivityDurationParams = ApiSem013RequestParam & {
  body: ApiSem013RequestBody;
};

const useUpdateActivityDuration = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem013ResponseOk, Error, UpdateActivityDurationParams>({
    mutationFn: async ({
      activityDurationId,
      body,
    }): Promise<ApiSem013ResponseOk> => {
      const { data } = await axiosClientWithAuth.put(
        apiSem013.url(activityDurationId),
        body,
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem012.url()] });
      queryClient.invalidateQueries({ queryKey: [apiAct018.url()] });
    },
    onError: error => {
      errorHandler(
        getApiErrorMessage(error, "활동기간 수정에 실패하였습니다."),
      );
    },
  });
};

export default useUpdateActivityDuration;

defineAxiosMock(mock => {
  mock.onPut(apiSem013.url(1)).reply(() => [200, { id: 1 }]);
});
