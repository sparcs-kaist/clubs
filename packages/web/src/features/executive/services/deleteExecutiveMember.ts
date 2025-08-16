import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { apiUsr007 } from "@clubs/interface/api/user/endpoint/apiUsr007";
import type {
  ApiUsr008RequestParam,
  ApiUsr008ResponseOk,
} from "@clubs/interface/api/user/endpoint/apiUsr008";
import { apiUsr008 } from "@clubs/interface/api/user/endpoint/apiUsr008";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useDeleteExecutiveMember = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiUsr008ResponseOk,
    Error,
    { param: ApiUsr008RequestParam }
  >({
    mutationFn: async ({ param }): Promise<ApiUsr008ResponseOk> => {
      const { data } = await axiosClientWithAuth.delete(
        apiUsr008.url(param.executiveId),
      );

      return apiUsr008.responseBodyMap[200].parse(data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [apiUsr007.url()] });
    },
    onError: error => {
      if (
        error instanceof AxiosError &&
        (error.response?.status === 400 ||
          error.response?.status === 403 ||
          error.response?.status === 404)
      ) {
        errorHandler(error.response?.data.message);
        return;
      }
      errorHandler("집행부원 삭제에 실패하였습니다");
    },
  });
};

export default useDeleteExecutiveMember;
