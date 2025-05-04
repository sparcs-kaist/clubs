import React, { useCallback, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Info from "@sparcs-clubs/web/common/components/Info";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";
import {
  ActivityCertificateInfo,
  ActivityHistory,
} from "@sparcs-clubs/web/features/activity-certificate/types/activityCertificate";

interface ActivityCertificateInfoSecondFrameProps {
  onPrev: VoidFunction;
  onNext: VoidFunction;
}

const ActivityCertificateSecondFrameInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const ActivityCertificateRow = styled.div`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  display: inline-flex;
  flex-direction: row;
`;

const IconOuterFrameInner = styled.div`
  height: 36px;
  padding-top: 2px;
  padding-bottom: 2px;
  justify-content: space-between;
  align-items: flex-start;
  display: flex;
`;

const IconInnerFrameInner = styled.div`
  padding: 8px;
  border-radius: 4px;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  gap: 4px;
  display: flex;
  cursor: pointer;
`;

const InputFrameInner = styled.div`
  flex: 1 1 0;
  align-items: flex-start;
  gap: 20px;
  display: flex;
`;

const ActivityCertificateInfoSecondFrame: React.FC<
  ActivityCertificateInfoSecondFrameProps
> = ({ onPrev, onNext }) => {
  const {
    watch,
    control,
    formState: { isValid },
  } = useFormContext<ActivityCertificateInfo>();

  const { fields, append, replace, move } = useFieldArray<
    ActivityCertificateInfo,
    "histories"
  >({
    control,
    name: "histories",
  });

  const [draggingActivityDescription, setDraggingActivityDescription] =
    useState<(ActivityHistory & { id: string }) | null>(null);

  const activityHistories = watch("histories");
  const activityDuration = watch("activityDuration");

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    activityDescription: ActivityHistory & { id: string },
  ) => {
    setDraggingActivityDescription(activityDescription);
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragEnd = () => {
    setDraggingActivityDescription(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    activityDescription: ActivityHistory & { id: string },
  ) => {
    e.preventDefault();

    if (!draggingActivityDescription) return;

    const currentIndex = fields.findIndex(
      field => field.id === draggingActivityDescription.id,
    );
    const targetIndex = fields.findIndex(
      field => field.id === activityDescription.id,
    );

    if (currentIndex !== -1 && targetIndex !== -1) {
      move(currentIndex, targetIndex);
    }

    setDraggingActivityDescription(null);
  };

  const handleAddActivityDescription = () => {
    if (fields.length === 0) {
      append({
        dateRange: [null, null],
        description: "",
      });
    } else if (fields.length < 5) {
      append({
        dateRange: [null, null],
        description: "",
      });
    }
  };

  const handleRemoveActivityDescription = (activityDescriptionId: string) => {
    if (fields.length > 1) {
      replace([
        ...fields.filter(
          activityDescription =>
            activityDescription.id !== activityDescriptionId,
        ),
      ]);
    }
  };

  const isValidDateRange = useCallback(
    (targetRange: [Date, Date]) =>
      activityDuration.some(
        ({ startMonth, endMonth }) =>
          targetRange[0] >= new Date(startMonth) &&
          targetRange[1] <= (endMonth ? new Date(endMonth) : new Date()),
      ),
    [activityDuration],
  );

  return (
    <>
      <ActivityCertificateSecondFrameInner>
        <Info text="활동 내역 최대 5개까지 입력 가능, 날짜 포함 => 워딩은 병찬이나 동연에서 고쳐주겟징~~" />
        <Card outline gap={20}>
          {fields.map((field, index) => (
            <ActivityCertificateRow
              key={field.id}
              draggable="true"
              onDragStart={e => handleDragStart(e, field)}
              onDragEnd={handleDragEnd}
              onDragOver={e => handleDragOver(e)}
              onDrop={e => handleDrop(e, field)}
            >
              <IconOuterFrameInner>
                <IconInnerFrameInner>
                  <Icon type="menu" size={16} />
                </IconInnerFrameInner>
              </IconOuterFrameInner>
              <InputFrameInner>
                <FlexWrapper
                  direction="column"
                  gap={4}
                  style={{ minWidth: 165 }}
                >
                  <FormController
                    name={`histories.${index}.dateRange`}
                    control={control}
                    rules={{
                      validate: {
                        endRequired: value =>
                          value?.[1] != null || "끝 기간을 입력하지 않았습니다",
                        invalidRange: value =>
                          (value[0] != null &&
                            value[1] != null &&
                            isValidDateRange([value[0], value[1]])) ||
                          "활동 기간에 포함되도록 입력해주세요",
                      },
                    }}
                    renderItem={({ value, onChange, errorMessage }) => (
                      <DateInput
                        selectsRange
                        showMonthYearPicker
                        startDate={value?.[0] ?? undefined}
                        endTerm={value?.[1] ?? undefined}
                        onChange={(dates: Date | null) => {
                          onChange(dates);
                        }}
                        selectedDates={
                          value
                            ? [value[0], value[1]].filter(
                                (date): date is Date => date !== undefined,
                              )
                            : undefined
                        }
                        placeholderText="20XX.XX - 20XX.XX"
                        dateFormat="yyyy.MM"
                        errorMessage={errorMessage}
                      />
                    )}
                  />
                </FlexWrapper>
                <FormController
                  name={`histories.${index}.description`}
                  control={control}
                  required
                  maxLength={100}
                  renderItem={props => (
                    <TextInput
                      {...props}
                      placeholder="활동 내역을 작성해주세요"
                    />
                  )}
                />
              </InputFrameInner>
              <IconOuterFrameInner
                onClick={_e => handleRemoveActivityDescription(field.id)}
              >
                <IconInnerFrameInner>
                  <Icon type="delete" size={16} />
                </IconInnerFrameInner>
              </IconOuterFrameInner>
            </ActivityCertificateRow>
          ))}
          <IconButton
            type={activityHistories.length < 5 ? "default" : "disabled"}
            onClick={handleAddActivityDescription}
            icon="add"
          >
            활동 내역 추가
          </IconButton>
        </Card>
      </ActivityCertificateSecondFrameInner>
      <StyledBottom>
        <Button onClick={onPrev}>이전</Button>
        <Button
          onClick={onNext}
          type={
            activityHistories.length >= 1 &&
            activityHistories.length <= 5 &&
            isValid
              ? "default"
              : "disabled"
          }
        >
          다음
        </Button>
      </StyledBottom>
    </>
  );
};
export default ActivityCertificateInfoSecondFrame;
