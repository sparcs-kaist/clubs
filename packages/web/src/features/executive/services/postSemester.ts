import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import type {
  ApiSem002RequestBody,
  ApiSem002ResponseCreated,
} from "@clubs/interface/api/semester/apiSem002";
import { apiSem002 } from "@clubs/interface/api/semester/apiSem002";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const usePostSemester = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSem002ResponseCreated,
    Error,
    { body: ApiSem002RequestBody }
  >({
    mutationFn: async ({ body }): Promise<ApiSem002ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiSem002.url(), body);

      return apiSem002.responseBodyMap[201].parse(data);
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
      errorHandler("학기 추가에 실패하였습니다");
    },
  });
};

export default usePostSemester;
