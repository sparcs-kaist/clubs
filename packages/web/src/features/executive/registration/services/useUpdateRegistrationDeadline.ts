import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiSem019 } from "@clubs/interface/api/semester/apiSem019";
import {
  apiSem022,
  ApiSem022RequestBody,
  ApiSem022RequestParam,
  ApiSem022ResponseOk,
} from "@clubs/interface/api/semester/apiSem022";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

type UpdateRegistrationDeadlineParams = ApiSem022RequestParam & {
  body: ApiSem022RequestBody;
};

const useUpdateRegistrationDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSem022ResponseOk,
    Error,
    UpdateRegistrationDeadlineParams
  >({
    mutationFn: async ({
      registrationDeadlineId,
      body,
    }): Promise<ApiSem022ResponseOk> => {
      const { data } = await axiosClientWithAuth.put(
        apiSem022.url(registrationDeadlineId),
        body,
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiSem019.url] });
    },
    onError: () => {
      errorHandler("등록 제출 기간 수정에 실패하였습니다");
    },
  });
};

export default useUpdateRegistrationDeadline;

defineAxiosMock(mock => {
  mock.onPut(apiSem022.url(1)).reply(() => [200, { id: 1 }]);
});
