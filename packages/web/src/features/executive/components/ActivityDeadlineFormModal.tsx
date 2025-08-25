import { useState } from "react";

import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { activityDeadlineEnumToString } from "@sparcs-clubs/web/features/activity-report/constants";

import useCreateActivityDeadline from "../services/useCreateActivityDeadline";
import useGetActivityDurations from "../services/useGetActivityDurations";

interface ActivityDeadlineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityDeadlineFormModal = ({
  isOpen,
  onClose,
}: ActivityDeadlineFormModalProps) => {
  const [activityDId, setActivityDId] = useState<number | null>(null);
  const [deadlineEnum, setDeadlineEnum] = useState<ActivityDeadlineEnum | null>(
    null,
  );
  const [startTerm, setStartTerm] = useState<Date | null>(null);
  const [endTerm, setEndTerm] = useState<Date | null>(null);

  const { mutate: createActivityDeadline } = useCreateActivityDeadline();
  const { data, isLoading, isError } = useGetActivityDurations();

  const handleSave = () => {
    if (activityDId && deadlineEnum !== null && startTerm && endTerm) {
      createActivityDeadline({
        activityDId,
        deadlineEnum,
        startTerm,
        endTerm,
      });
      onClose();
    }
  };

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={handleSave}
          onClose={onClose}
          confirmButtonText="저장"
          closeButtonText="취소"
          confirmDisabled={
            data != null &&
            (!activityDId || deadlineEnum === null || !startTerm || !endTerm)
          }
        >
          {data == null ? (
            <AsyncBoundary isLoading={false} isError />
          ) : (
            <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
              <Typography fs={18} lh={24} fw="MEDIUM">
                새 활동보고서 제출 기한 추가
              </Typography>
              <Select
                label="활동기간"
                placeholder="활동기간을 선택해주세요"
                value={activityDId}
                onChange={e => setActivityDId(e)}
                items={data.activityDurations
                  .sort((a, b) => b.semester.id - a.semester.id)
                  .map(activityDuration => ({
                    label: `${activityDuration.year}년 ${activityDuration.name} 활동기간`,
                    value: activityDuration.id,
                  }))}
              />

              <Select
                label="기간유형"
                placeholder="기간유형을 선택해주세요"
                value={deadlineEnum}
                onChange={e => setDeadlineEnum(e as ActivityDeadlineEnum)}
                items={(
                  Object.values(ActivityDeadlineEnum).filter(
                    value => typeof value === "number",
                  ) as Array<ActivityDeadlineEnum>
                ).map((value: ActivityDeadlineEnum) => ({
                  label: activityDeadlineEnumToString(value),
                  value,
                }))}
              />

              <FlexWrapper
                direction="column"
                gap={8}
                style={{ alignItems: "flex-start" }}
              >
                <Typography fs={16} lh={20} fw="MEDIUM">
                  기간
                </Typography>
                <FlexWrapper direction="row" gap={12}>
                  <DateInput
                    label="시작일"
                    selected={startTerm}
                    onChange={(date: Date | null) => setStartTerm(date)}
                  />
                  <DateInput
                    label="종료일"
                    selected={endTerm}
                    onChange={(date: Date | null) => setEndTerm(date)}
                  />
                </FlexWrapper>
              </FlexWrapper>
            </FlexWrapper>
          )}
        </CancellableModalContent>
      </Modal>
    </AsyncBoundary>
  );
};

export default ActivityDeadlineFormModal;
