import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import type {
  ApiSem003RequestBody,
  ApiSem003RequestQuery,
  ApiSem003ResponseOk,
} from "@clubs/interface/api/semester/apiSem003";
import { apiSem003 } from "@clubs/interface/api/semester/apiSem003";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const usePutSemester = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSem003ResponseOk,
    Error,
    { query: ApiSem003RequestQuery; body: ApiSem003RequestBody }
  >({
    mutationFn: async ({ query, body }): Promise<ApiSem003ResponseOk> => {
      const { data } = await axiosClientWithAuth.put(apiSem003.url(), body, {
        params: query,
      });

      return apiSem003.responseBodyMap[200].parse(data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["getSemesters"] });
    },
    onError: error => {
      if (
        error instanceof AxiosError &&
        error.response?.data.message.startsWith(
          "There are overlapping semesters",
        )
      ) {
        errorHandler("각 학기의 기간은 겹칠 수 없습니다");
        return;
      }
      errorHandler("학기 수정에 실패하였습니다");
    },
  });
};

export default usePutSemester;
