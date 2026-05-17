import { useEffect, useState } from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  getLocalDateLastTime,
  getLocalDateOnly,
} from "@sparcs-clubs/web/utils/Date/getKSTDate";

interface DeadlineEditModalProps {
  isOpen: boolean;
  title: string;
  startTerm?: Date;
  endTerm?: Date;
  isPending: boolean;
  onClose: () => void;
  onSave: (startTerm: Date, endTerm: Date) => void;
}

const DeadlineEditModal = ({
  isOpen,
  title,
  startTerm: initialStartTerm,
  endTerm: initialEndTerm,
  isPending,
  onClose,
  onSave,
}: DeadlineEditModalProps) => {
  const [startTerm, setStartTerm] = useState<Date | null>(null);
  const [endTerm, setEndTerm] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setStartTerm(initialStartTerm ?? null);
    setEndTerm(initialEndTerm ?? null);
  }, [initialEndTerm, initialStartTerm, isOpen]);

  const handleSave = () => {
    if (!startTerm || !endTerm) return;

    onSave(getLocalDateOnly(startTerm), getLocalDateLastTime(endTerm));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CancellableModalContent
        onConfirm={handleSave}
        onClose={onClose}
        confirmButtonText="저장"
        closeButtonText="취소"
        confirmDisabled={!startTerm || !endTerm || isPending}
      >
        <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
          <Typography fs={18} lh={24} fw="MEDIUM">
            {title}
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

export type { DeadlineEditModalProps };
export default DeadlineEditModal;
