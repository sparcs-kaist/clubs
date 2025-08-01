import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  ApiSem004RequestQuery,
  ApiSem004ResponseOk,
} from "@clubs/interface/api/semester/apiSem004";
import { apiSem004 } from "@clubs/interface/api/semester/apiSem004";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useDeleteSemester = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSem004ResponseOk,
    Error,
    { query: ApiSem004RequestQuery }
  >({
    mutationFn: async ({ query }): Promise<ApiSem004ResponseOk> => {
      const { data } = await axiosClientWithAuth.delete(apiSem004.url(), {
        params: query,
      });

      return apiSem004.responseBodyMap[200].parse(data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["getSemesters"] });
    },
    onError: () => {
      errorHandler("학기 삭제에 실패하였습니다");
    },
  });
};

export default useDeleteSemester;
