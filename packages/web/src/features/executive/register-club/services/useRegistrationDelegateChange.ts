import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import apiClb019 from "@clubs/interface/api/club/endpoint/apiClb019";
import apiClb020 from "@clubs/interface/api/club/endpoint/apiClb020";
import apiClb021, {
  ApiClb021RequestBody,
} from "@clubs/interface/api/club/endpoint/apiClb021";
import apiClb022, {
  ApiClb022RequestBody,
} from "@clubs/interface/api/club/endpoint/apiClb022";

import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const useGetRegistrationDelegateChangeClubs = () =>
  useQuery({
    queryKey: [apiClb019.url()],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(apiClb019.url());
      return apiClb019.responseBodyMap[200].parse(data);
    },
  });

export const useGetRegistrationDelegateChangeDetail = (clubId: number) =>
  useQuery({
    queryKey: [apiClb020.url(clubId)],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(apiClb020.url(clubId));
      return apiClb020.responseBodyMap[200].parse(data);
    },
    enabled: clubId > 0,
  });

export const useChangeRegistrationDelegate = (clubId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ApiClb021RequestBody) => {
      const { data } = await axiosClientWithAuth.patch(
        apiClb021.url(clubId),
        body,
      );
      return apiClb021.responseBodyMap[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiClb020.url(clubId)] });
      queryClient.invalidateQueries({ queryKey: [apiClb019.url()] });
    },
    onError: () => {
      errorHandler(
        "대표자·대의원 변경에 실패했습니다. 등록 기간과 등록 서류 제출 여부를 확인해주세요.",
      );
    },
  });
};

export const useCancelRegistrationDelegate = (clubId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ApiClb022RequestBody) => {
      const { data } = await axiosClientWithAuth.patch(
        apiClb022.url(clubId),
        body,
      );
      return apiClb022.responseBodyMap[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiClb020.url(clubId)] });
    },
    onError: () => {
      errorHandler(
        "대의원 직책 취소에 실패했습니다. 등록 기간과 등록 서류 제출 여부를 확인해주세요.",
      );
    },
  });
};
