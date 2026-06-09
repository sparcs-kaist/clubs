import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiSem016 } from "@clubs/interface/api/semester/apiSem016";
import {
  apiSem021,
  ApiSem021RequestBody,
  ApiSem021RequestParam,
  ApiSem021ResponseOk,
} from "@clubs/interface/api/semester/apiSem021";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

type UpdateFundingDeadlineParams = ApiSem021RequestParam & {
  body: ApiSem021RequestBody;
};

const useUpdateFundingDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSem021ResponseOk, Error, UpdateFundingDeadlineParams>({
    mutationFn: async ({
      fundingDeadlineId,
      body,
    }): Promise<ApiSem021ResponseOk> => {
      const { data } = await axiosClientWithAuth.put(
        apiSem021.url(fundingDeadlineId),
        body,
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem016.url] });
    },
    onError: () => {
      errorHandler("지원금 제출 기간 수정에 실패하였습니다");
    },
  });
};

export default useUpdateFundingDeadline;

defineAxiosMock(mock => {
  mock.onPut(apiSem021.url(1)).reply(() => [200, { id: 1 }]);
});
