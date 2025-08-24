import { useState } from "react";

import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useCreateFundingDeadline from "@sparcs-clubs/web/features/executive/funding/services/useCreateFundingDeadline";
import useGetActivityDurations from "@sparcs-clubs/web/features/executive/services/useGetActivityDurations";
import { fundingDeadlineEnumToString } from "@sparcs-clubs/web/features/manage-club/funding/constants/fundingDeadlineEnumToString";

interface FundingDeadlineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FundingDeadlineFormModal = ({
  isOpen,
  onClose,
}: FundingDeadlineFormModalProps) => {
  const [activityDId, setActivityDId] = useState<number | null>(null);
  const [deadlineEnum, setDeadlineEnum] = useState<FundingDeadlineEnum | null>(
    null,
  );
  const [startTerm, setStartTerm] = useState<Date | null>(null);
  const [endTerm, setEndTerm] = useState<Date | null>(null);

  const { mutate: createFundingDeadline } = useCreateFundingDeadline();
  const { data, isLoading, isError } = useGetActivityDurations();

  const handleSave = () => {
    if (activityDId && deadlineEnum && startTerm && endTerm) {
      createFundingDeadline({
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
            (!activityDId || !deadlineEnum || !startTerm || !endTerm)
          }
        >
          {data == null ? (
            <AsyncBoundary isLoading={false} isError />
          ) : (
            <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
              <Typography fs={18} lh={24} fw="MEDIUM">
                새 지원금 기간 추가
              </Typography>
              <Select
                label="활동기간"
                placeholder="활동기간을 선택해주세요"
                value={activityDId}
                onChange={e => setActivityDId(e)}
                items={data.activityDurations.map(activityDuration => ({
                  label: `${activityDuration.year}년 ${activityDuration.name} 활동기간`,
                  value: activityDuration.id,
                }))}
              />

              <Select
                label="지원금 기간"
                placeholder="지원금 기간을 선택해주세요"
                value={deadlineEnum}
                onChange={e => setDeadlineEnum(e as FundingDeadlineEnum)}
                items={(
                  Object.values(FundingDeadlineEnum).filter(
                    value => typeof value === "number",
                  ) as Array<FundingDeadlineEnum>
                ).map((value: FundingDeadlineEnum) => ({
                  label: fundingDeadlineEnumToString(value),
                  value,
                }))}
              />

              <FlexWrapper
                direction="column"
                gap={20}
                style={{ textAlign: "left" }}
              >
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
          )}
        </CancellableModalContent>
      </Modal>
    </AsyncBoundary>
  );
};

export type { FundingDeadlineFormModalProps };
export default FundingDeadlineFormModal;
