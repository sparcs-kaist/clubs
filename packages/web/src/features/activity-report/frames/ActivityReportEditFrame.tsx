import { overlay } from "overlay-kit";
import React from "react";

import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import ActivityReportForm from "../components/ActivityReportForm";
import useGetInitialActivityReportFormData from "../hooks/useGetInitialActivityReportFormData";
import useUpdateActivityReport from "../hooks/useUpdateActivityReport";
import useGetActivityDeadline from "../services/useGetActivityDeadline";
import { ActivityReportFormData } from "../types/form";

interface ActivityReportEditFrameProps {
  id: string;
  clubId: number;
}

const ActivityReportEditFrame: React.FC<ActivityReportEditFrameProps> = ({
  id,
  clubId,
}) => {
  const activityId = Number(id);
  const { data, isLoading, isError } =
    useGetInitialActivityReportFormData(activityId);
  const { mutateAsync: updateActivityReport } =
    useUpdateActivityReport(activityId);
  const {
    data: activityDeadline,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetActivityDeadline();
  const isNameLocked =
    activityDeadline?.deadline?.activityDeadlineEnum ===
    ActivityDeadlineEnum.Modification;

  const handleSubmit = (_data: ActivityReportFormData) => {
    updateActivityReport(_data, {
      onSuccess: () => {
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent
              onConfirm={() => {
                close();
                window.location.href = `/manage-club/activity-report/${activityId}`;
              }}
            >
              활동 보고서 수정이 완료되었습니다.
            </ConfirmModalContent>
          </Modal>
        ));
      },
      onError: error => {
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent onConfirm={close}>
              활동 보고서 수정에 실패했습니다.
              <Typography color="GRAY.300" fs={12} lh={16} fw="REGULAR">
                {error.message}
              </Typography>
            </ConfirmModalContent>
          </Modal>
        ));
      },
    });
  };

  if (!data) return null;

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          { name: "활동 보고서", path: "/manage-club/activity-report" },
        ]}
        title="활동 보고서 수정"
        enableLast
      />

      <AsyncBoundary
        isLoading={isLoading || isLoadingDeadline}
        isError={isError || isErrorDeadline}
      >
        <ActivityReportForm
          clubId={clubId}
          onSubmit={handleSubmit}
          initialData={data}
          lockedName={isNameLocked ? data.name : undefined}
        />
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default ActivityReportEditFrame;
