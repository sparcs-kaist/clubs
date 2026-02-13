import { useState } from "react";

import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import useCreateActivityDuration from "@sparcs-clubs/web/features/executive/services/useCreateActivityDuration";

import { activityDurationTypeEnumToString } from "./ActivityDurationTable";

interface ActivityDurationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityDurationFormModal = ({
  isOpen,
  onClose,
}: ActivityDurationFormModalProps) => {
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [typeEnum, setTypeEnum] = useState<ActivityDurationTypeEnum | null>(
    null,
  );
  const [year, setYear] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [startTerm, setStartTerm] = useState<Date | null>(null);
  const [endTerm, setEndTerm] = useState<Date | null>(null);

  const { mutate: createActivityDuration } = useCreateActivityDuration();
  const {
    data: semestersData,
    isLoading,
    isError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });

  const handleSave = () => {
    if (semesterId && typeEnum && year && name && startTerm && endTerm) {
      createActivityDuration({
        semesterId,
        activityDurationTypeEnum: typeEnum,
        year: Number(year),
        name,
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
            !semesterId || !typeEnum || !year || !name || !startTerm || !endTerm
          }
        >
          {semestersData == null ? (
            <AsyncBoundary isLoading={false} isError />
          ) : (
            <FlexWrapper direction="column" gap={20} style={{ width: "400px" }}>
              <Typography fs={18} lh={24} fw="MEDIUM">
                새 활동기간 추가
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
                label="활동반기 분류"
                placeholder="분류를 선택해주세요"
                value={typeEnum}
                onChange={e => setTypeEnum(e as ActivityDurationTypeEnum)}
                items={(
                  Object.values(ActivityDurationTypeEnum).filter(
                    value => typeof value === "number",
                  ) as Array<ActivityDurationTypeEnum>
                ).map((value: ActivityDurationTypeEnum) => ({
                  label: activityDurationTypeEnumToString(value),
                  value,
                }))}
              />

              <TextInput
                label="년도"
                placeholder="예: 2026"
                value={year}
                handleChange={setYear}
              />

              <TextInput
                label="활동반기명"
                placeholder="예: 겨울-봄"
                value={name}
                handleChange={setName}
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

export default ActivityDurationFormModal;
