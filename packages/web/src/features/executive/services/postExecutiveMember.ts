import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import type {
  ApiUsr006RequestBody,
  ApiUsr006ResponseCreated,
} from "@clubs/interface/api/user/endpoint/apiUsr006";
import { apiUsr006 } from "@clubs/interface/api/user/endpoint/apiUsr006";
import { apiUsr007 } from "@clubs/interface/api/user/endpoint/apiUsr007";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const usePostExecutiveMember = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiUsr006ResponseCreated,
    Error,
    { body: ApiUsr006RequestBody }
  >({
    mutationFn: async ({ body }): Promise<ApiUsr006ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiUsr006.url(), body);

      return apiUsr006.responseBodyMap[201].parse(data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [apiUsr007.url()] });
    },
    onError: error => {
      if (
        error instanceof AxiosError &&
        (error.response?.status === 400 || error.response?.status === 403)
      ) {
        errorHandler(error.response?.data.message);
        return;
      }
      errorHandler("집행부원 추가에 실패하였습니다");
    },
  });
};

export default usePostExecutiveMember;
