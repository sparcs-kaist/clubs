import { useState } from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";

interface ExecutiveMemberData {
  id: number;
  studentNumber: string;
  name: string;
  startTerm: Date;
  endTerm: Date;
}

interface ExecutiveMemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ExecutiveMemberData, "id">) => void;
}

const ExecutiveMemberFormModal = ({
  isOpen,
  onClose,
  onSave,
}: ExecutiveMemberFormModalProps) => {
  const [studentNumber, setStudentNumber] = useState("");
  const [name, setName] = useState("");
  const [startTerm, setStartTerm] = useState<Date | null>(null);
  const [endTerm, setEndTerm] = useState<Date | null>(null);

  const handleSave = () => {
    if (studentNumber && name && startTerm && endTerm) {
      onSave({
        studentNumber,
        name,
        startTerm,
        endTerm,
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen}>
      <CancellableModalContent
        onConfirm={handleSave}
        onClose={onClose}
        confirmButtonText="저장"
        closeButtonText="취소"
        confirmDisabled={
          !studentNumber.trim() || !name.trim() || !startTerm || !endTerm
        }
      >
        <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
          <Typography fs={18} lh={24} fw="MEDIUM">
            새 집행부원 추가
          </Typography>

          <TextInput
            label="학번"
            placeholder="학번을 입력해주세요"
            value={studentNumber}
            onChange={e => setStudentNumber(e.target.value)}
          />

          <TextInput
            label="이름"
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={e => setName(e.target.value)}
          />

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

export type { ExecutiveMemberData, ExecutiveMemberFormModalProps };
export default ExecutiveMemberFormModal;
