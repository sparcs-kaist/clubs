import { useEffect, useState } from "react";

import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useUpdateActivityDuration from "@sparcs-clubs/web/features/executive/services/useUpdateActivityDuration";
import {
  getLocalDateLastTime,
  getLocalDateOnly,
} from "@sparcs-clubs/web/utils/Date/getKSTDate";

type ActivityDurationItem = ApiSem012ResponseOK["activityDurations"][number];

interface ActivityDurationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  duration: ActivityDurationItem | null;
}

const ActivityDurationEditModal = ({
  isOpen,
  onClose,
  duration,
}: ActivityDurationEditModalProps) => {
  const [startTerm, setStartTerm] = useState<Date | null>(null);
  const [endTerm, setEndTerm] = useState<Date | null>(null);
  const {
    mutate: updateActivityDuration,
    isPending: isUpdatingActivityDuration,
  } = useUpdateActivityDuration();

  useEffect(() => {
    if (!isOpen || !duration) return;

    setStartTerm(duration.startTerm);
    setEndTerm(duration.endTerm);
  }, [duration, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    if (!duration || !startTerm || !endTerm) return;

    updateActivityDuration(
      {
        activityDurationId: duration.id,
        body: {
          startTerm: getLocalDateOnly(startTerm),
          endTerm: getLocalDateLastTime(endTerm),
        },
      },
      {
        onSuccess: onClose,
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <CancellableModalContent
        onConfirm={handleSave}
        onClose={handleClose}
        confirmButtonText="저장"
        closeButtonText="취소"
        confirmDisabled={
          !duration || !startTerm || !endTerm || isUpdatingActivityDuration
        }
      >
        <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
          <Typography fs={18} lh={24} fw="MEDIUM">
            활동 반기 수정
          </Typography>
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
      </CancellableModalContent>
    </Modal>
  );
};

export default ActivityDurationEditModal;
