import { useMutation, useQueryClient } from "@tanstack/react-query";

import apiClb001 from "@clubs/interface/api/club/endpoint/apiClb001";
import apiClb017, {
  type ApiClb017ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb017";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useCancelClubRegistration = (clubId: number) => {
  const queryClient = useQueryClient();

  return useMutation<ApiClb017ResponseOk, Error>({
    mutationFn: async () => {
      const { data } = await axiosClientWithAuth.patch(apiClb017.url(clubId));
      return apiClb017.responseBodyMap[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiClb001.url()] });
    },
    onError: () => {
      errorHandler("동아리 등록 무효 처리에 실패했습니다.");
    },
  });
};

export default useCancelClubRegistration;

defineAxiosMock(mock => {
  mock.onPatch(apiClb017.url(1)).reply(() => [200, {}]);
});
