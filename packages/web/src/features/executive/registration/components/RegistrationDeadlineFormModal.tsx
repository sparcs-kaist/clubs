import { useState } from "react";

import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import {
  getLocalDateLastTime,
  getLocalDateOnly,
} from "@sparcs-clubs/web/utils/Date/getKSTDate";

import useCreateRegistrationDeadline from "../services/useCreateRegistrationDeadline";
import { registrationDeadlineEnumToString } from "./RegistrationDeadlineTable";

interface RegistrationDeadlineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegistrationDeadlineFormModal = ({
  isOpen,
  onClose,
}: RegistrationDeadlineFormModalProps) => {
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [deadlineEnum, setDeadlineEnum] =
    useState<RegistrationDeadlineEnum | null>(null);
  const [startTerm, setStartTerm] = useState<Date | null>(null);
  const [endTerm, setEndTerm] = useState<Date | null>(null);

  const { mutate: createRegistrationDeadline } =
    useCreateRegistrationDeadline();
  const {
    data: semestersData,
    isLoading,
    isError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });

  const handleSave = () => {
    if (semesterId && deadlineEnum && startTerm && endTerm) {
      createRegistrationDeadline({
        semesterId,
        deadlineEnum,
        startTerm: getLocalDateOnly(startTerm),
        endTerm: getLocalDateLastTime(endTerm),
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
            semestersData != null &&
            (!semesterId || !deadlineEnum || !startTerm || !endTerm)
          }
        >
          {semestersData == null ? (
            <AsyncBoundary isLoading={false} isError />
          ) : (
            <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
              <Typography fs={18} lh={24} fw="MEDIUM">
                새 등록 기간 추가
              </Typography>
              <Select
                label="학기"
                placeholder="학기를 선택해주세요"
                value={semesterId}
                onChange={e => setSemesterId(e)}
                items={[...semestersData.semesters]
                  .sort((a, b) => b.id - a.id)
                  .map(semester => ({
                    label: `${semester.year}년 ${semester.name}`,
                    value: semester.id,
                  }))}
              />

              <Select
                label="등록 기간 유형"
                placeholder="기간 유형을 선택해주세요"
                value={deadlineEnum}
                onChange={e => setDeadlineEnum(e as RegistrationDeadlineEnum)}
                items={(
                  Object.values(RegistrationDeadlineEnum).filter(
                    value => typeof value === "number",
                  ) as Array<RegistrationDeadlineEnum>
                ).map((value: RegistrationDeadlineEnum) => ({
                  label: registrationDeadlineEnumToString(value),
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

export type { RegistrationDeadlineFormModalProps };
export default RegistrationDeadlineFormModal;
