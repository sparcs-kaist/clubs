import React, { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FileUpload from "@sparcs-clubs/web/common/components/FileUpload";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import SelectParticipant from "@sparcs-clubs/web/features/activity-report/components/SelectParticipant";
import useGetParticipants from "@sparcs-clubs/web/features/activity-report/services/useGetParticipants";
import { ActivityReportFormData } from "@sparcs-clubs/web/features/activity-report/types/form";
import { isObjectEmpty } from "@sparcs-clubs/web/utils";

import SelectActivityTerm from "./SelectActivityTerm";

interface ActivityReportFormProps {
  clubId: number;
  initialData?: ActivityReportFormData;
  onCancel: () => void;
  onSubmit: (data: ActivityReportFormData) => void;
  canCancel?: boolean;
}

const ActivityReportForm: React.FC<ActivityReportFormProps> = ({
  clubId,
  initialData = undefined,
  onCancel,
  onSubmit,
  canCancel = true,
}) => {
  const formCtx = useForm<ActivityReportFormData>({
    mode: "all",
    defaultValues: initialData,
  });
  const {
    control,
    watch,
    setValue,
    formState: { isValid },
  } = formCtx;

  const formData = watch();

  const durations = watch("durations");
  const evidenceFiles = watch("evidenceFiles");
  const participants = watch("participants");

  const [startTerm, setStartTerm] = useState<Date>(
    durations
      ?.map(d => d.startTerm)
      .filter((date): date is Date => date !== null)
      .reduce((a, b) => (a < b ? a : b), new Date()),
  );
  const [endTerm, setEndTerm] = useState<Date>(
    durations
      ?.map(d => d.endTerm)
      .filter((date): date is Date => date !== null)
      .reduce((a, b) => (a > b ? a : b), new Date()),
  );

  const {
    data: participantData,
    isLoading,
    isError,
    refetch,
  } = useGetParticipants({
    clubId,
    startTerm,
    endTerm,
  });

  useEffect(() => {
    if (startTerm && endTerm) {
      refetch();
    }
  }, [startTerm, endTerm, refetch]);

  const validInput = useMemo(
    () => isValid && durations && participants.length > 0 && evidenceFiles,
    [durations, participants, evidenceFiles, isValid],
  );

  useEffect(() => {
    if (!isObjectEmpty(formData)) {
      LocalStorageUtil.save(
        LOCAL_STORAGE_KEY.REGISTER_CLUB_ACTIVITY_REPORT_MODAL,
        formData,
      );
    }
  }, [formData]);

  return (
    <FormProvider {...formCtx}>
      <FlexWrapper direction="column" gap={32}>
        <FormController
          name="name"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label="활동명"
              placeholder="활동명을 입력해주세요"
            />
          )}
        />

        <FlexWrapper direction="row" gap={32}>
          <FormController
            name="activityTypeEnumId"
            required
            control={control}
            renderItem={props => (
              <Select
                {...props}
                label="활동 분류"
                items={[
                  {
                    value: ActivityTypeEnum.matchedInternalActivity,
                    label: "동아리 성격에 합치하는 내부 활동",
                    selectable: true,
                  },
                  {
                    value: ActivityTypeEnum.matchedExternalActivity,
                    label: "동아리 성격에 합치하는 외부 활동",
                    selectable: true,
                  },
                  {
                    value: ActivityTypeEnum.notMatchedActivity,
                    label: "동아리 성격에 합치하지 않는 활동",
                    selectable: true,
                  },
                ]}
              />
            )}
          />

          <SelectActivityTerm
            onChange={terms => {
              setValue("durations", terms, {
                shouldValidate: true,
              });
              setValue("durations", terms, { shouldValidate: true });
              if (terms.length > 0) {
                const validStartTerms = terms
                  .map(d => d.startTerm)
                  .filter((date): date is Date => date !== null);
                const validEndTerms = terms
                  .map(d => d.endTerm)
                  .filter((date): date is Date => date !== null);

                if (validStartTerms.length > 0) {
                  setStartTerm(
                    validStartTerms.reduce((a, b) => (a < b ? a : b)),
                  );
                }
                if (validEndTerms.length > 0) {
                  setEndTerm(validEndTerms.reduce((a, b) => (a > b ? a : b)));
                }
              }

              setValue("participants", []);
            }}
          />
        </FlexWrapper>
        <FormController
          name="location"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label="활동 장소"
              placeholder="활동 장소를 입력해주세요"
            />
          )}
        />
        <FormController
          name="purpose"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label="활동 목적"
              placeholder="활동 목적을 입력해주세요"
            />
          )}
        />
        <FormController
          name="detail"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              area
              label="활동 내용"
              placeholder="활동 내용을 입력해주세요"
            />
          )}
        />
        {durations && (
          <FlexWrapper direction="column" gap={4}>
            <Typography fs={16} lh={20} fw="MEDIUM" color="BLACK">
              활동 인원
            </Typography>
            <AsyncBoundary isLoading={isLoading} isError={isError}>
              <SelectParticipant
                data={
                  participantData?.students.map(student => ({
                    id: student.id,
                    name: student.name,
                    studentNumber: student.studentNumber.toString(),
                  })) ?? []
                }
                value={participants}
                onChange={_participants => {
                  setValue("participants", _participants, {
                    shouldValidate: true,
                  });
                }}
              />
            </AsyncBoundary>
          </FlexWrapper>
        )}
        <FlexWrapper direction="column" gap={4}>
          <Typography fs={16} lh={20} fw="MEDIUM" color="BLACK">
            활동 증빙
          </Typography>
          <FormController
            name="evidence"
            required
            control={control}
            renderItem={props => (
              <TextInput
                {...props}
                area
                placeholder="활동 증빙에 대해서 작성하고 싶은 것이 있다면 입력해주세요"
              />
            )}
          />

          <FormController
            name="evidenceFiles"
            required
            control={control}
            renderItem={props => (
              <FileUpload
                {...props}
                multiple
                initialFiles={evidenceFiles}
                onChange={files => {
                  setValue("evidenceFiles", files, {
                    shouldValidate: true,
                  });
                }}
              />
            )}
          />
        </FlexWrapper>
        <FlexWrapper
          direction="row"
          gap={0}
          style={
            canCancel
              ? { justifyContent: "space-between" }
              : { justifyContent: "flex-end" }
          }
        >
          {canCancel && (
            <Button type="outlined" onClick={onCancel}>
              취소
            </Button>
          )}

          <Button
            buttonType="submit"
            type={validInput ? "default" : "disabled"}
            onClick={e => {
              e.preventDefault();
              onSubmit(watch());
            }}
          >
            저장
          </Button>
        </FlexWrapper>
      </FlexWrapper>
    </FormProvider>
  );
};

export default ActivityReportForm;
