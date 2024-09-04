import React, { useMemo } from "react";

import { ActivityTypeEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";
import { queryOptions, useSuspenseQueries } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";

import Button from "@sparcs-clubs/web/common/components/Button";
import { getFileFromUrl } from "@sparcs-clubs/web/common/components/File/attachment";
import FileUpload from "@sparcs-clubs/web/common/components/FileUpload";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { Duration } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import { formatDotDate } from "@sparcs-clubs/web/utils/Date/formatDate";

import SelectActivityTerm from "../SelectActivityTerm";

import ParticipantSection from "./ParticipantSection";

interface ActivityReportFormProps {
  clubId: number;
  formCtx: ReturnType<typeof useForm>;
  onCancel: () => void;
  onSubmit: (e: React.BaseSyntheticEvent) => void;
}

type File = { id: string; name: string; url: string };
const fileQuery = (file: File) =>
  queryOptions({
    queryKey: ["file", file.id],
    queryFn: async () => ({
      fileId: file.id,
      file: await getFileFromUrl(file.url, file.name),
    }),
  });

const ActivityReportForm: React.FC<ActivityReportFormProps> = ({
  clubId,
  formCtx,
  onCancel,
  onSubmit,
}) => {
  const {
    control,
    watch,
    setValue,
    formState: { isValid },
  } = formCtx;

  const durations: Duration[] = watch("durations");
  const participants = watch("participants");
  const evidenceFiles: { id: string; name: string; url: string }[] =
    watch("evidenceFiles");

  const initialDurations = useMemo(
    () =>
      durations
        ? durations.map(d => ({
            startDate: formatDotDate(d.startTerm),
            endDate: formatDotDate(d.endTerm),
          }))
        : [],
    [durations],
  );

  const data = useSuspenseQueries({
    queries: evidenceFiles?.map(file => fileQuery(file)),
  });

  /* TODO: (@dora) refactor !!!!! */
  type FileIdType = "evidenceFiles";
  const updateMultipleFile = (
    fileId: FileIdType,
    _data: { fileId: string }[],
  ) => {
    formCtx.setValue(fileId, _data, { shouldValidate: true });
    formCtx.trigger(fileId);
  };

  const validInput = useMemo(
    () => isValid && durations && participants && evidenceFiles,
    [durations, participants, evidenceFiles, isValid],
  );

  return (
    <FormProvider {...formCtx}>
      <form onSubmit={onSubmit}>
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
              initialData={initialDurations}
              onChange={terms => {
                const processedTerms = terms.map(term => ({
                  startTerm: new Date(`${term.startDate.replace(".", "-")}`),
                  endTerm: new Date(`${term.endDate.replace(".", "-")}`),
                }));
                setValue("durations", processedTerms, {
                  shouldValidate: true,
                });
                formCtx.trigger("durations");
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
              <ParticipantSection clubId={clubId} formCtx={formCtx} />
            </FlexWrapper>
          )}
          <FlexWrapper direction="column" gap={4}>
            <Typography fs={16} lh={20} fw="MEDIUM" color="BLACK">
              활동 증빙
            </Typography>
            <FormController
              name="evidence"
              control={control}
              renderItem={props => (
                <TextInput
                  {...props}
                  area
                  placeholder="(선택) 활동 증빙에 대해서 작성하고 싶은 것이 있다면 입력해주세요"
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
                  initialFiles={data?.map(_data => _data.data)}
                  onChange={_data => {
                    updateMultipleFile(
                      "evidenceFiles",
                      _data.map(d => ({
                        fileId: d,
                      })),
                    );
                  }}
                />
              )}
            />
          </FlexWrapper>
          <FlexWrapper
            direction="row"
            gap={0}
            style={{ justifyContent: "space-between" }}
          >
            <Button type="outlined" onClick={onCancel}>
              취소
            </Button>
            <Button
              buttonType="submit"
              type={validInput ? "default" : "disabled"}
            >
              저장
            </Button>
          </FlexWrapper>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default ActivityReportForm;
