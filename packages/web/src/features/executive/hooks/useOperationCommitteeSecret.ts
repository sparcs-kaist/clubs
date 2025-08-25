import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  deleteOperationCommitteeSecret,
  getOperationCommitteeSecret,
  postOperationCommitteeSecret,
} from "../services/operationCommitteeSecret";

export const operationCommitteeSecretQueryKey = () => [
  "operation-committee-secret",
];

export const useOperationCommitteeSecret = () => {
  const queryClient = useQueryClient();

  // 비밀키 조회
  const {
    data: secretData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: operationCommitteeSecretQueryKey(),
    queryFn: getOperationCommitteeSecret,
    retry: (failureCount, retryError: Error) => {
      // 404면 재시도 안함 (키가 없는 경우)
      if ((retryError as AxiosError)?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  // 비밀키 생성/갱신
  const { mutateAsync: createSecretKey, isPending: isCreating } = useMutation({
    mutationFn: postOperationCommitteeSecret,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: operationCommitteeSecretQueryKey(),
      });
    },
  });

  // 비밀키 삭제
  const { mutateAsync: deleteSecretKey, isPending: isDeleting } = useMutation({
    mutationFn: deleteOperationCommitteeSecret,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: operationCommitteeSecretQueryKey(),
      });
    },
  });

  // activeKey 배열에서 실제 키 추출
  const currentKey = secretData?.activeKey?.[0]?.secretKey || null;

  return {
    // 데이터
    currentKey,
    secretData,

    // 상태
    isLoading: isLoading || isCreating || isDeleting,
    error,

    // 액션
    createSecretKey,
    deleteSecretKey,
    refetch,
  };
};
