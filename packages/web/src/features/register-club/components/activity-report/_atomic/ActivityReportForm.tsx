import { useTranslations } from "next-intl";
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
  const t = useTranslations("my.registration.activity");

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
          requiredMessage={t("required")}
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label={t("name")}
              placeholder={t("namePlaceholder")}
            />
          )}
        />

        <FlexWrapper direction="row" gap={32}>
          <FormController
            name="activityTypeEnumId"
            required
            requiredMessage={t("required")}
            control={control}
            renderItem={props => (
              <Select
                {...props}
                label={t("type")}
                items={[
                  {
                    value: ActivityTypeEnum.matchedInternalActivity,
                    label: t(
                      `types.${ActivityTypeEnum.matchedInternalActivity}`,
                    ),
                    selectable: true,
                  },
                  {
                    value: ActivityTypeEnum.matchedExternalActivity,
                    label: t(
                      `types.${ActivityTypeEnum.matchedExternalActivity}`,
                    ),
                    selectable: true,
                  },
                  {
                    value: ActivityTypeEnum.notMatchedActivity,
                    label: t(`types.${ActivityTypeEnum.notMatchedActivity}`),
                    selectable: true,
                  },
                ]}
              />
            )}
          />

          <SelectActivityTerm
            source="provisional"
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
          requiredMessage={t("required")}
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label={t("location")}
              placeholder={t("locationPlaceholder")}
            />
          )}
        />
        <FormController
          name="purpose"
          required
          requiredMessage={t("required")}
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label={t("purpose")}
              placeholder={t("purposePlaceholder")}
            />
          )}
        />
        <FormController
          name="detail"
          required
          requiredMessage={t("required")}
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              area
              label={t("detail")}
              placeholder={t("detailPlaceholder")}
            />
          )}
        />
        {durations && (
          <FlexWrapper direction="column" gap={4}>
            <Typography fs={16} lh={20} fw="MEDIUM" color="BLACK">
              {t("participants")}
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
            {t("evidence")}
          </Typography>
          <FormController
            name="evidence"
            required
            requiredMessage={t("required")}
            control={control}
            renderItem={props => (
              <TextInput
                {...props}
                area
                placeholder={t("evidencePlaceholder")}
              />
            )}
          />

          <FormController
            name="evidenceFiles"
            required
            requiredMessage={t("required")}
            control={control}
            renderItem={props => (
              <FileUpload
                {...props}
                placeholder={t("uploadPlaceholder")}
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
              {t("cancel")}
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
            {t("save")}
          </Button>
        </FlexWrapper>
      </FlexWrapper>
    </FormProvider>
  );
};

export default ActivityReportForm;
