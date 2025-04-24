import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import { MeetingEnum } from "@clubs/interface/common/enum/meeting.enum";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Select from "@sparcs-clubs/web/common/components/Select";
import FormSelect from "@sparcs-clubs/web/common/components/Select/Form";
import {
  MeetingAnnouncementModel,
  meetingEnumToText,
} from "@sparcs-clubs/web/features/meeting/types/meeting";

interface MeetingInformationFrameProps {
  onCreateTemplate?: VoidFunction;
}

const RowFlexWrapper = styled.div`
  display: flex;
  direction: row;
  gap: 24px;

  & > * {
    flex: 1;
  }
`;

const GridView = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 24px;
`;
const AlignEnd = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const MeetingInformationFrame: React.FC<MeetingInformationFrameProps> = ({
  onCreateTemplate = undefined,
}) => {
  const {
    watch,
    control,
    setValue,
    formState: { isValid },
  } = useFormContext<MeetingAnnouncementModel>();

  const isRegular = watch("isRegular");
  const meetingEnumId = watch("meetingEnumId");
  const startDate = watch("startDate");

  const hasValue = meetingEnumId != null && isRegular != null;
  const isDivisionMeeting = meetingEnumId === MeetingEnum.divisionMeeting;

  useEffect(() => {
    if (isDivisionMeeting) {
      setValue("isRegular", "true", { shouldValidate: true });
    }
  }, [isDivisionMeeting, setValue]);

  return (
    <FlexWrapper direction="column" gap={40}>
      <SectionTitle>회의 정보</SectionTitle>
      <Card outline gap={24} style={{ marginLeft: 24 }}>
        <FlexWrapper direction="row" gap={24}>
          <FormController
            name="meetingEnumId"
            required
            control={control}
            renderItem={props => (
              <Select
                {...props}
                label="회의체 종류"
                placeholder="회의체 종류를 선택해주세요"
                items={Object.keys(MeetingEnum)
                  .slice(0, 4)
                  .map(value => ({
                    label: meetingEnumToText(value),
                    value: +value,
                  }))}
                disabled={onCreateTemplate == null}
              />
            )}
          />
          <FormController
            name="isRegular"
            control={control}
            required
            renderItem={props => (
              <FormSelect
                {...props}
                label="정기회의 여부"
                placeholder="정기회의 여부를 선택해주세요"
                items={[
                  { label: "정기회의", value: "true" },
                  { label: "비정기회의", value: "false" },
                ]}
                disabled={isDivisionMeeting}
              />
            )}
          />
        </FlexWrapper>
        {hasValue &&
          (!isDivisionMeeting ? (
            <GridView>
              <FormController
                name="location"
                required={!isDivisionMeeting}
                control={control}
                renderItem={props => (
                  <TextInput
                    {...props}
                    label="장소 (국문)"
                    placeholder="장소를 입력해주세요"
                  />
                )}
              />
              <FormController
                name="locationEn"
                required={!isDivisionMeeting}
                control={control}
                renderItem={props => (
                  <TextInput
                    {...props}
                    label="장소 (영문)"
                    placeholder="장소를 입력해주세요"
                  />
                )}
              />
              <FormController
                name="startDate"
                required={!isDivisionMeeting}
                control={control}
                renderItem={({ value, onChange }) => (
                  <DateInput
                    label="일자"
                    showTimeInput
                    selected={value}
                    onChange={(data: Date | null) => {
                      onChange(data);
                    }}
                    minDate={new Date()}
                  />
                )}
              />
            </GridView>
          ) : (
            <RowFlexWrapper>
              <FormController
                name="startDate"
                required={isDivisionMeeting}
                control={control}
                renderItem={({ value, onChange }) => (
                  <DateInput
                    label="시작일"
                    selected={value}
                    onChange={(data: Date | null) => onChange(data)}
                    minDate={new Date()}
                  />
                )}
              />
              <FormController
                name="endTerm"
                required={isDivisionMeeting}
                control={control}
                rules={{
                  validate: value =>
                    (value != null &&
                      startDate != null &&
                      startDate <= value!) ||
                    "종료일은 시작일과 같거나 그 이후여야 합니다",
                }}
                renderItem={({ value, onChange, errorMessage }) => (
                  <DateInput
                    label="종료일"
                    selected={value}
                    onChange={(data: Date | null) => onChange(data)}
                    minDate={new Date()}
                    errorMessage={errorMessage}
                  />
                )}
              />
            </RowFlexWrapper>
          ))}
        {onCreateTemplate && (
          <AlignEnd>
            <TextButton
              text="공고 템플릿 생성"
              disabled={!isValid}
              onClick={onCreateTemplate}
            />
          </AlignEnd>
        )}
      </Card>
    </FlexWrapper>
  );
};
export default MeetingInformationFrame;
