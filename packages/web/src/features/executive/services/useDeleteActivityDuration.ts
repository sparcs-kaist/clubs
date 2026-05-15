import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiSem012 } from "@clubs/interface/api/semester/apiSem012";
import {
  apiSem014,
  ApiSem014RequestParam,
  ApiSem014ResponseOk,
} from "@clubs/interface/api/semester/apiSem014";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import getApiErrorMessage from "./getApiErrorMessage";

const useDeleteActivityDuration = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem014ResponseOk, Error, ApiSem014RequestParam>({
    mutationFn: async (params): Promise<ApiSem014ResponseOk> => {
      const { data } = await axiosClientWithAuth.delete(
        apiSem014.url(params.activityDurationId),
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem012.url()] });
    },
    onError: error => {
      errorHandler(
        getApiErrorMessage(error, "활동기간 삭제에 실패하였습니다."),
      );
    },
  });
};

export default useDeleteActivityDuration;

defineAxiosMock(mock => {
  mock.onDelete(apiSem014.url(1)).reply(() => [200, {}]);
});
