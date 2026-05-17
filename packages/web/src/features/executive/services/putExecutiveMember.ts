import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { apiUsr007 } from "@clubs/interface/api/user/endpoint/apiUsr007";
import type {
  ApiUsr009RequestBody,
  ApiUsr009RequestParam,
  ApiUsr009ResponseOk,
} from "@clubs/interface/api/user/endpoint/apiUsr009";
import { apiUsr009 } from "@clubs/interface/api/user/endpoint/apiUsr009";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const usePutExecutiveMember = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiUsr009ResponseOk,
    Error,
    { param: ApiUsr009RequestParam; body: ApiUsr009RequestBody }
  >({
    mutationFn: async ({ param, body }): Promise<ApiUsr009ResponseOk> => {
      const { data } = await axiosClientWithAuth.put(
        apiUsr009.url(param.executiveTId),
        body,
      );

      return apiUsr009.responseBodyMap[200].parse(data);
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
      errorHandler("집행부원 임기 수정에 실패하였습니다");
    },
  });
};

export default usePutExecutiveMember;
