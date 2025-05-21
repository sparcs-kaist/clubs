import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback } from "react";

import apiAct011 from "@clubs/interface/api/activity/endpoint/apiAct011";

import Modal from "@sparcs-clubs/web/common/components/Modal";
import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import RestoreDraftModal from "@sparcs-clubs/web/common/components/Modal/RestoreDraftModal";
import useTemporaryStorage from "@sparcs-clubs/web/common/hooks/useTemporaryStorage";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import { ActivityReportFormData } from "@sparcs-clubs/web/features/activity-report/types/form";
import usePostActivityReportForNewClub from "@sparcs-clubs/web/features/register-club/services/usePostActivityReportForNewClub";

import ActivityReportForm from "./_atomic/ActivityReportForm";

interface CreateActivityReportModalProps {
  clubId: number;
  isOpen: boolean;
  close: VoidFunction;
}

// TODO. 활동기간 리스트 추가, 파일업로드 추가
const CreateActivityReportModal: React.FC<CreateActivityReportModalProps> = ({
  clubId,
  isOpen,
  close,
}) => {
  const queryClient = useQueryClient();

  const { savedData, isModalOpen, handleConfirm, handleClose } =
    useTemporaryStorage<ActivityReportFormData>(
      LOCAL_STORAGE_KEY.REGISTER_CLUB_ACTIVITY_REPORT_MODAL,
    );

  const { mutate } = usePostActivityReportForNewClub();

  const submitHandler = useCallback(
    (data: ActivityReportFormData) => {
      mutate(
        {
          body: {
            ...data,
            durations: data.durations.map(duration => ({
              startTerm: duration.startTerm!,
              endTerm: duration.endTerm!,
            })),
            clubId,
            evidence: data.evidence ?? "", // NOTE: (@dora) evidence is optional
            evidenceFiles: data.evidenceFiles.map(({ id }) => ({
              fileId: id,
            })),
            participants: data.participants.map(({ id }) => ({
              studentId: id,
            })),
          },
        },
        {
          onSuccess: () => {
            LocalStorageUtil.remove(
              LOCAL_STORAGE_KEY.REGISTER_CLUB_ACTIVITY_REPORT_MODAL,
            );
            queryClient.invalidateQueries({ queryKey: [apiAct011.url()] });
            close();
          },
          onError: () => errorHandler("생성에 실패하였습니다"),
        },
      );
    },
    [close, mutate],
  );

  const handleCancel = () => {
    close();
  };

  if (isModalOpen) {
    return (
      <RestoreDraftModal
        isOpen={isModalOpen}
        mainText="작성하시던 활동 보고서 내역이 있습니다. 불러오시겠습니까?"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} width="full">
      <ActivityReportForm
        clubId={clubId}
        initialData={savedData}
        onCancel={handleCancel}
        onSubmit={submitHandler}
      />
    </Modal>
  );
};

export default CreateActivityReportModal;
