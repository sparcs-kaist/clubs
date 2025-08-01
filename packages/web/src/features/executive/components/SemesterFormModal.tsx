import { useState } from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";

interface SemesterData {
  id: number;
  year: number;
  name: string;
  startTerm: Date;
  endTerm: Date;
}

interface SemesterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<SemesterData, "id">) => void;
  initialData?: SemesterData;
}

const SemesterFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}: SemesterFormModalProps) => {
  const [year, setYear] = useState(initialData?.year?.toString() || "");
  const [name, setName] = useState(initialData?.name || "");
  const [startTerm, setStartTerm] = useState<Date | null>(
    initialData?.startTerm || null,
  );
  const [endTerm, setEndTerm] = useState<Date | null>(
    initialData?.endTerm || null,
  );

  const handleSave = () => {
    if (year && name && startTerm && endTerm) {
      onSave({
        year: parseInt(year),
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
      >
        <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
          <Typography fs={18} lh={24} fw="MEDIUM">
            {initialData ? "학기 수정" : "새 학기 추가"}
          </Typography>

          <TextInput
            label="연도"
            placeholder="연도를 입력해주세요"
            value={year}
            onChange={e => setYear(e.target.value)}
          />

          <TextInput
            label="학기"
            placeholder="학기 이름을 입력해주세요"
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

export type { SemesterData, SemesterFormModalProps };
export default SemesterFormModal;
