import { useState } from "react";

import {
  areSemesterTermWeekdaysValid,
  getKSTDay,
  Weekday,
} from "@clubs/domain/semester/term-weekday";

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
  const hasValidTermWeekdays =
    startTerm !== null &&
    endTerm !== null &&
    areSemesterTermWeekdaysValid(startTerm, endTerm);

  const handleSave = () => {
    if (year && name && startTerm && endTerm && hasValidTermWeekdays) {
      onSave({
        year: parseInt(year),
        name,
        startTerm: getLocalDateOnly(startTerm),
        endTerm: getLocalDateLastTime(endTerm),
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
          !year || !name || !startTerm || !endTerm || !hasValidTermWeekdays
        }
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
            label="시작일 (월요일)"
            selected={startTerm}
            onChange={(date: Date | null) => setStartTerm(date)}
            filterDate={(date: Date) => getKSTDay(date) === Weekday.Monday}
            errorMessage={
              startTerm !== null && getKSTDay(startTerm) !== Weekday.Monday
                ? "시작일은 월요일이어야 합니다."
                : ""
            }
          />

          <DateInput
            label="종료일 (일요일)"
            selected={endTerm}
            onChange={(date: Date | null) => setEndTerm(date)}
            filterDate={(date: Date) => getKSTDay(date) === Weekday.Sunday}
            errorMessage={
              endTerm !== null && getKSTDay(endTerm) !== Weekday.Sunday
                ? "종료일은 일요일이어야 합니다."
                : ""
            }
          />
        </FlexWrapper>
      </CancellableModalContent>
    </Modal>
  );
};

export type { SemesterData, SemesterFormModalProps };
export default SemesterFormModal;
