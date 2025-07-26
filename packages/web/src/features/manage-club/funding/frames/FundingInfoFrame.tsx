import { addDays, subDays } from "date-fns";
import React, { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import DateInput from "@sparcs-clubs/web/common/components/Forms/DateInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import UnitInput from "@sparcs-clubs/web/common/components/Forms/UnitInput";
import Select from "@sparcs-clubs/web/common/components/Select";
import useGetActivityAvailable from "@sparcs-clubs/web/features/activity-report/services/useGetActivityAvailable";
import { FundingInfo } from "@sparcs-clubs/web/features/manage-club/funding/types/funding";
import {
  getLocalDateLastTime,
  getLocalDateOnly,
} from "@sparcs-clubs/web/utils/Date/getKSTDate";

import { NO_ACTIVITY_REPORT_FUNDING } from "../constants";
import useGetFundingDeadline from "../services/useGetFundingDeadline";

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 32px;

  > div {
    flex: 1;
  }
`;
const FundingInfoFrame: React.FC<{ clubId: number }> = ({ clubId }) => {
  const formCtx = useFormContext<FundingInfo>();
  const { control } = formCtx;

  const {
    data: purposeActivity,
    isLoading,
    isError,
  } = useGetActivityAvailable({ clubId });
  const {
    data: fundingDeadline,
    isLoading: isLoadingFundingDeadline,
    isError: isErrorFundingDeadline,
  } = useGetFundingDeadline();

  const purposeItems = [
    ...(purposeActivity?.activities.map(activity => ({
      value: activity.id,
      label: activity.name,
    })) ?? []),
    { value: Infinity, label: NO_ACTIVITY_REPORT_FUNDING },
  ];

  const isValidDateRange = useCallback(
    (targeDate: Date) => {
      if (!fundingDeadline) {
        return false;
      }
      const localTargetDate = getLocalDateOnly(targeDate);
      return (
        getLocalDateOnly(fundingDeadline.targetDuration.startTerm) <=
          localTargetDate &&
        localTargetDate <=
          getLocalDateLastTime(fundingDeadline.targetDuration.endTerm)
      );
    },
    [fundingDeadline],
  );

  if (!fundingDeadline) {
    return (
      <AsyncBoundary
        isLoading={isLoadingFundingDeadline}
        isError={isErrorFundingDeadline}
      />
    );
  }

  return (
    <FoldableSectionTitle title="지원금 정보">
      <AsyncBoundary
        isLoading={isLoading || isLoadingFundingDeadline}
        isError={isError || isErrorFundingDeadline}
      >
        <Card outline gap={32}>
          <FormController
            name="name"
            required
            control={control}
            renderItem={props => (
              <TextInput
                {...props}
                label="항목명"
                placeholder="항목명을 입력하세요"
              />
            )}
          />
          <RowWrapper>
            <FormController
              name="purposeActivity.id"
              required
              control={control}
              renderItem={props => (
                <Select
                  {...props}
                  items={purposeItems}
                  label="지출 목적"
                  placeholder="지출 목적을 선택해주세요"
                />
              )}
            />
            <FormController
              name="expenditureDate"
              required
              control={control}
              rules={{
                validate: value =>
                  (value != null && isValidDateRange(value)) ||
                  "활동 기간에 포함되도록 입력해주세요",
              }}
              renderItem={({ value, onChange, errorMessage }) => (
                <DateInput
                  label="지출 일자"
                  placeholder="20XX.XX.XX"
                  minDate={
                    addDays(fundingDeadline.targetDuration.startTerm, 1) ??
                    undefined
                  }
                  maxDate={
                    subDays(fundingDeadline.targetDuration.endTerm, 1) ??
                    undefined
                  }
                  // TODO: mindate 와 maxdate 활동 기간 안에 포함되는 지 확인
                  selected={value}
                  onChange={(data: Date | null) => {
                    onChange(data);
                  }}
                  errorMessage={errorMessage}
                  showIcon
                />
              )}
            />
            <FormController
              name="expenditureAmount"
              required
              control={control}
              renderItem={({ value, onChange, errorMessage }) => (
                <UnitInput
                  label="지출 금액"
                  placeholder="금액을 입력해주세요"
                  unit="원"
                  value={value?.toString()}
                  handleChange={onChange}
                  errorMessage={errorMessage}
                />
              )}
            />
          </RowWrapper>
        </Card>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};
export default FundingInfoFrame;
