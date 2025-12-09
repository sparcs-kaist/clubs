import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback } from "react";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import apiAct011 from "@clubs/interface/api/activity/endpoint/apiAct011";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CommentToast from "@sparcs-clubs/web/common/components/Toast/CommentToast";
import {
  activityReportDetailQueryKey,
  useGetActivityReport,
} from "@sparcs-clubs/web/features/activity-report/services/useGetActivityReport";
import { ActivityReportFormData } from "@sparcs-clubs/web/features/activity-report/types/form";
import { filterActivityComments } from "@sparcs-clubs/web/features/activity-report/utils/filterComment";
import usePutActivityReportForNewClub from "@sparcs-clubs/web/features/register-club/services/usePutActivityReportForNewClub";

import ActivityReportForm from "./_atomic/ActivityReportForm";

interface EditActivityReportModalProps {
  activityId: number;
  profile: string;
  isOpen: boolean;
  close: () => void;
}

// TODO. 활동기간 리스트 추가, 파일업로드 추가
const EditActivityReportModal: React.FC<EditActivityReportModalProps> = ({
  activityId,
  profile,
  isOpen,
  close,
}) => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useGetActivityReport(
    profile,
    activityId,
  );

  const { mutate } = usePutActivityReportForNewClub();

  const submitHandler = useCallback(
    (_data: ActivityReportFormData) => {
      mutate(
        {
          params: { activityId },
          body: {
            ..._data,
            durations: _data.durations.map(({ startTerm, endTerm }) => ({
              startTerm: startTerm!,
              endTerm: endTerm!,
            })),
            participants: _data.participants.map(({ id }) => ({
              studentId: id,
            })),
            evidenceFiles: _data.evidenceFiles.map(file => ({
              fileId: file.id,
            })),
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: activityReportDetailQueryKey(profile, activityId),
              exact: false,
            });
            queryClient.invalidateQueries({ queryKey: [apiAct011.url()] });
            close();
          },
        },
      );
    },
    [activityId, close, mutate],
  );

  const handleCancel = () => {
    close();
  };

  if (!data) return null;

  return (
    <Modal isOpen={isOpen} width="full">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper gap={20} direction="column">
          {data.activityStatusEnumId === ActivityStatusEnum.Rejected &&
            data.comments.length > 0 && (
              <CommentToast
                title="반려 사유"
                reasons={filterActivityComments(data.comments).map(comment => ({
                  datetime: comment.createdAt,
                  reason: comment.content,
                }))}
                color="red"
              />
            )}

          <ActivityReportForm
            clubId={data.clubId}
            initialData={{
              ...data,
              durations: data.durations.map(({ startTerm, endTerm }) => ({
                startTerm,
                endTerm,
              })),
              evidenceFiles: data.evidenceFiles.map(file => ({
                id: file.fileId,
                name: file.name,
                url: file.url,
              })),
              participants: data.participants.map(participant => ({
                id: participant.studentId,
                name: participant.name,
                studentNumber: participant.studentNumber.toString(),
              })),
            }}
            onCancel={handleCancel}
            onSubmit={submitHandler}
          />
        </FlexWrapper>
      </AsyncBoundary>
    </Modal>
  );
};

export default EditActivityReportModal;
