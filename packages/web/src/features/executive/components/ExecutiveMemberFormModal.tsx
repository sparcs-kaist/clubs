import { useEffect, useState } from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  getLocalDateLastTime,
  getLocalDateOnly,
} from "@sparcs-clubs/web/utils/Date/getKSTDate";

interface ExecutiveMemberData {
  id: number;
  executiveTId: number;
  studentNumber: string;
  name: string;
  startTerm: Date;
  endTerm: Date | null;
}

interface ExecutiveMemberFormData {
  executiveTId?: number;
  studentNumber: string;
  name: string;
  startTerm: Date;
  endTerm?: Date | null;
}

interface ExecutiveMemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExecutiveMemberFormData) => void;
  initialData?: ExecutiveMemberData;
}

const ExecutiveMemberFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ExecutiveMemberFormModalProps) => {
  const [studentNumber, setStudentNumber] = useState(
    initialData?.studentNumber ?? "",
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [startTerm, setStartTerm] = useState<Date | null>(
    initialData?.startTerm ?? null,
  );
  const [endTerm, setEndTerm] = useState<Date | null>(
    initialData?.endTerm ?? null,
  );
  const isEditing = initialData != null;

  useEffect(() => {
    if (!isOpen) return;

    setStudentNumber(initialData?.studentNumber ?? "");
    setName(initialData?.name ?? "");
    setStartTerm(initialData?.startTerm ?? null);
    setEndTerm(initialData?.endTerm ?? null);
  }, [initialData, isOpen]);

  const isTermRangeInvalid =
    startTerm !== null && endTerm !== null && startTerm > endTerm;

  const handleSave = () => {
    if (studentNumber && name && startTerm && !isTermRangeInvalid) {
      const baseData = {
        studentNumber,
        name,
        startTerm: getLocalDateOnly(startTerm),
      };

      onSave(
        isEditing
          ? {
              ...baseData,
              executiveTId: initialData.executiveTId,
              endTerm: endTerm === null ? null : getLocalDateLastTime(endTerm),
            }
          : baseData,
      );
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
          !studentNumber.trim() ||
          !name.trim() ||
          !startTerm ||
          isTermRangeInvalid
        }
      >
        <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
          <Typography fs={18} lh={24} fw="MEDIUM">
            {isEditing ? "집행부원 임기 수정" : "새 집행부원 추가"}
          </Typography>

          <TextInput
            label="학번"
            placeholder="학번을 입력해주세요"
            value={studentNumber}
            onChange={e => setStudentNumber(e.target.value)}
            disabled={isEditing}
          />

          <TextInput
            label="이름"
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isEditing}
          />

          <DateInput
            label="시작일"
            selected={startTerm}
            onChange={(date: Date | null) => setStartTerm(date)}
          />

          {isEditing && (
            <DateInput
              label="종료일"
              selected={endTerm}
              onChange={(date: Date | null) => setEndTerm(date)}
              isClearable
            />
          )}
        </FlexWrapper>
      </CancellableModalContent>
    </Modal>
  );
};

export type {
  ExecutiveMemberData,
  ExecutiveMemberFormData,
  ExecutiveMemberFormModalProps,
};
export default ExecutiveMemberFormModal;
