import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { overlay } from "overlay-kit";
import { useState } from "react";

import {
  deleteReviewInternalMemo,
  getReviewInternalMemo,
  putReviewInternalMemo,
  REVIEW_INTERNAL_MEMO_MAX_LENGTH,
  ReviewInternalMemoKind,
} from "@clubs/interface/api/review/endpoint/internalMemo";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";
import { formatDotDetailDate } from "@sparcs-clubs/web/utils/Date/formatDate";

interface ReviewInternalMemoCardProps {
  kind: ReviewInternalMemoKind;
  id: number;
}

const ReviewInternalMemoCard = ({ kind, id }: ReviewInternalMemoCardProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const url = getReviewInternalMemo.url(kind, id);
  const queryKey = [url];
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await axiosClientWithAuth.get(url, {
        signal,
        transformResponse: axios.defaults.transformResponse,
      });
      return getReviewInternalMemo.responseBodyMap[200].parse(response.data);
    },
  });

  const mutation = useMutation({
    mutationFn: async (content: string | null) => {
      if (content === null) {
        await axiosClientWithAuth.delete(
          deleteReviewInternalMemo.url(kind, id),
        );
        return { memo: null };
      }
      const response = await axiosClientWithAuth.put(
        putReviewInternalMemo.url(kind, id),
        { content },
        { transformResponse: axios.defaults.transformResponse },
      );
      return putReviewInternalMemo.responseBodyMap[200].parse(response.data);
    },
    onSuccess: async response => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, response);
      setDraft(null);
    },
  });

  const memo = data?.memo;
  const canSave = !!draft?.trim() && !mutation.isPending;

  const confirmDelete = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen} onClose={close}>
        <CancellableModalContent
          onClose={close}
          onConfirm={() => {
            close();
            mutation.mutate(null);
          }}
          confirmButtonText="삭제"
          confirmButtonType="danger"
        >
          집행부 내부 메모를 삭제하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  };

  return (
    <Card outline gap={16}>
      <Typography fw="SEMIBOLD" fs={18} lh={24}>
        집행부 내부 메모
      </Typography>
      <AsyncBoundary
        isLoading={isLoading}
        isError={isError && !data}
        renderIfError={
          <FlexWrapper gap={12} style={{ alignItems: "center" }}>
            <Typography role="alert">메모를 불러오지 못했습니다.</Typography>
            <Button type="outlined" onClick={() => refetch()}>
              다시 시도
            </Button>
          </FlexWrapper>
        }
      >
        {draft !== null ? (
          <>
            <TextInput
              aria-label="집행부 내부 메모 내용"
              placeholder="집행부만 볼 수 있는 메모를 입력하세요."
              maxLength={REVIEW_INTERNAL_MEMO_MAX_LENGTH}
              value={draft}
              handleChange={setDraft}
              disabled={mutation.isPending}
              area
            />
            <FlexWrapper gap={8} justify="flex-end">
              <Button
                type={mutation.isPending ? "disabled" : "outlined"}
                onClick={() => {
                  mutation.reset();
                  setDraft(null);
                }}
              >
                취소
              </Button>
              <Button
                type={canSave ? "default" : "disabled"}
                onClick={() => mutation.mutate(draft.trim())}
              >
                저장
              </Button>
            </FlexWrapper>
          </>
        ) : (
          <>
            {memo ? (
              <>
                <Typography
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {memo.content}
                </Typography>
                <Typography fs={14} color="GRAY.600">
                  {memo.updatedBy} · {formatDotDetailDate(memo.updatedAt)}
                </Typography>
              </>
            ) : (
              <Typography color="GRAY.600">작성된 메모가 없습니다.</Typography>
            )}
            <FlexWrapper gap={8} justify="flex-end">
              {memo && (
                <Button
                  type={mutation.isPending ? "disabled" : "outlined"}
                  onClick={confirmDelete}
                >
                  삭제
                </Button>
              )}
              <Button
                type={mutation.isPending ? "disabled" : "default"}
                onClick={() => {
                  mutation.reset();
                  setDraft(memo?.content ?? "");
                }}
              >
                {memo ? "수정" : "메모 작성"}
              </Button>
            </FlexWrapper>
          </>
        )}
        {mutation.isError && (
          <Typography color="RED.600" role="alert">
            {mutation.variables === null
              ? "메모를 삭제하지 못했습니다."
              : "메모를 저장하지 못했습니다."}
          </Typography>
        )}
      </AsyncBoundary>
    </Card>
  );
};

export default ReviewInternalMemoCard;
