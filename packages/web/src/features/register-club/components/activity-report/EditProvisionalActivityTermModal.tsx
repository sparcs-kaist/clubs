import React, { useCallback, useMemo } from "react";
import { Control, useFieldArray } from "react-hook-form";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ActivityReportFormData } from "@sparcs-clubs/web/features/activity-report/types/form";
import useGetProvisionalActivityDuration from "@sparcs-clubs/web/features/register-club/services/useGetProvisionalActivityDuration";
import { Duration } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import {
  getLocalDateLastTime,
  getLocalDateOnly,
} from "@sparcs-clubs/web/utils/Date/getKSTDate";

interface EditProvisionalActivityTermModalProps {
  isOpen: boolean;
  control: Control<ActivityReportFormData>;
  onClose: () => void;
  onConfirm: (terms: Duration[]) => void;
}

const EditProvisionalActivityTermModal: React.FC<
  EditProvisionalActivityTermModalProps
> = ({ isOpen, control, onClose, onConfirm }) => {
  const {
    data: activityDuration,
    isLoading,
    isError,
  } = useGetProvisionalActivityDuration();

  const { fields, append, remove, update } = useFieldArray<
    ActivityReportFormData,
    "durations"
  >({
    control,
    name: "durations",
  });

  const addRow = useCallback(() => {
    append({ startTerm: null, endTerm: null });
  }, [append]);

  const handleDelete = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  const isEmpty = useMemo(() => fields.length === 0, [fields]);
  const maxSelectableEndTerm = useMemo(() => {
    const today = getLocalDateOnly(new Date());
    const activityEndTerm = activityDuration?.activityDuration.endTerm;

    if (activityEndTerm == null) {
      return today;
    }

    const activityEndDate = getLocalDateOnly(activityEndTerm);

    return activityEndDate < today ? activityEndDate : today;
  }, [activityDuration?.activityDuration.endTerm]);

  const isSomethingEmpty = useMemo(() => {
    if (fields.length === 0) {
      return false;
    }
    return fields.some(
      field => field.startTerm == null || field.endTerm == null,
    );
  }, [fields]);

  const handleConfirm = useCallback(() => {
    if (isEmpty) return;

    onConfirm(
      fields.map(field => ({
        startTerm: getLocalDateOnly(field.startTerm!),
        endTerm: getLocalDateLastTime(field.endTerm!),
      })),
    );
  }, [fields, isEmpty, onConfirm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CancellableModalContent onClose={onClose} onConfirm={handleConfirm}>
        <AsyncBoundary isLoading={isLoading} isError={isError}>
          <FlexWrapper
            direction="column"
            gap={12}
            style={{
              width: "min(600px, 80vw)",
              height: "min(300px, 80vh)",
              overflowY: "scroll",
            }}
          >
            {fields.map((field, index) => (
              <FlexWrapper
                key={field.id}
                direction="row"
                gap={8}
                style={{
                  width: "100%",
                  alignSelf: "center",
                  justifyContent: "center",
                }}
              >
                <FormController
                  name={`durations.${index}`}
                  control={control}
                  renderItem={({ value, onChange, errorMessage }) => (
                    <DateInput
                      selectsRange
                      minDate={
                        activityDuration?.activityDuration.startTerm ??
                        undefined
                      }
                      maxDate={maxSelectableEndTerm}
                      startDate={value?.startTerm}
                      endDate={value?.endTerm}
                      onChange={(dates: [Date, Date] | null) => {
                        if (dates) {
                          onChange({
                            startTerm: dates[0],
                            endTerm: dates[1],
                          });
                          update(index, {
                            startTerm: dates[0],
                            endTerm: dates[1],
                          });
                        }
                      }}
                      selectedDates={
                        value?.startTerm && value?.endTerm
                          ? [value.startTerm, value.endTerm]
                          : null
                      }
                      placeholderText="20XX.XX.XX - 20XX.XX.XX"
                      dateFormat="yyyy.MM.dd"
                      errorMessage={errorMessage}
                    />
                  )}
                />
                <IconButton
                  icon="delete"
                  onClick={() => handleDelete(index)}
                  style={{
                    backgroundColor: "transparent",
                    color: "black",
                    alignSelf: "center",
                  }}
                />
              </FlexWrapper>
            ))}
            <IconButton
              icon="add"
              onClick={addRow}
              style={{ backgroundColor: "white", color: "black" }}
              type="outlined"
            >
              활동 기간 추가
            </IconButton>
            {isEmpty && (
              <Typography fw="MEDIUM" fs={12} lh={18} color="RED.600">
                기간을 하나 이상 추가해주세요.
              </Typography>
            )}
            {isSomethingEmpty && (
              <Typography
                fw="MEDIUM"
                fs={12}
                lh={18}
                color="RED.600"
                style={{ marginBottom: fields.length === 4 ? "60px" : "0px" }}
              >
                기간을 입력하거나 해당 항목을 삭제해주세요.
              </Typography>
            )}
          </FlexWrapper>
        </AsyncBoundary>
      </CancellableModalContent>
    </Modal>
  );
};

export default EditProvisionalActivityTermModal;
