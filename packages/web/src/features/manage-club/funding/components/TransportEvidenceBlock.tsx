import React from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import { TransportationEnum as E } from "@clubs/interface/common/enum/funding.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import SelectParticipant from "@sparcs-clubs/web/features/activity-report/components/SelectParticipant";
import useGetActivityParticipants from "@sparcs-clubs/web/features/activity-report/services/useGetActivityParticipants";
import {
  isParticipantsRequired,
  isPurposeInfoRequired,
} from "@sparcs-clubs/web/utils/isTransportation";

import { AddEvidence } from "../types/funding";
import EvidenceBlockTitle from "./EvidenceBlockTitle";

interface TransportEvidenceBlockProps {
  activityId: number;
  required?: boolean;
}
const FixedWidthWrapper = styled.div`
  min-width: 200px;
`;

const TransportationList = [
  { label: "시내/마을버스", value: E.CityBus },
  { label: "고속/시외버스", value: E.IntercityBus },
  { label: "철도", value: E.Rail },
  { label: "택시", value: E.Taxi },
  { label: "전세버스", value: E.CharterBus },
  { label: "화물 운반", value: E.Cargo },
  { label: "콜밴", value: E.CallVan },
  { label: "비행기", value: E.Airplane },
  { label: "선박", value: E.Ship },
  { label: "기타", value: E.Others },
];

const purposeInfo = (type: E | undefined) => {
  switch (type) {
    case E.Cargo:
      return "* 운반한 화물 목록을 함께 작성해주세요";
    case E.CallVan:
      return "* 운반한 화물 목록을 함께 작성해주세요";
    case E.Airplane:
      return "* 행사 장소의 타당성을 함께 작성해주세요";
    case E.Ship:
      return "* 행사 장소의 타당성을 함께 작성해주세요";
    case E.Others:
      return "* 운반한 화물 목록과 행사 장소의 타당성을 함께 작성해주세요";
    default:
      return "";
  }
};

const TransportEvidenceBlock: React.FC<TransportEvidenceBlockProps> = ({
  activityId,
  required = false,
}) => {
  const formCtx = useFormContext<AddEvidence>();
  const { control, watch, setValue } = formCtx;

  const transportationEnum = watch("transportationEnum");
  const participants = watch("transportationPassengers");

  const { data, isLoading, isError } = useGetActivityParticipants(activityId);

  return (
    <FlexWrapper direction="column" gap={8}>
      <EvidenceBlockTitle title="교통비 증빙">
        <Card outline gap={32}>
          <FlexWrapper direction="row" gap={32}>
            <FixedWidthWrapper>
              <FormController
                name="transportationEnum"
                required={required}
                control={control}
                renderItem={props => (
                  <Select
                    {...props}
                    items={TransportationList}
                    label="교통수단"
                    placeholder="교통수단을 선택해주세요"
                  />
                )}
              />
            </FixedWidthWrapper>
            <FormController
              name="origin"
              required={required}
              control={control}
              renderItem={props => (
                <TextInput
                  {...props}
                  placeholder="출발지를 입력해주세요"
                  label="출발지"
                />
              )}
            />
            <FormController
              name="destination"
              required={required}
              control={control}
              renderItem={props => (
                <TextInput
                  {...props}
                  placeholder="도착지를 입력해주세요"
                  label="도착지"
                />
              )}
            />
          </FlexWrapper>
          <AsyncBoundary isLoading={isLoading} isError={isError}>
            {isParticipantsRequired(transportationEnum) && (
              <FlexWrapper direction="column" gap={4}>
                <Typography fs={16} fw="MEDIUM" lh={20}>
                  탑승자 명단
                </Typography>
                <SelectParticipant
                  data={data?.participants ?? []}
                  value={participants}
                  onChange={_participants => {
                    setValue("transportationPassengers", _participants, {
                      shouldValidate: true,
                    });
                  }}
                />
              </FlexWrapper>
            )}
          </AsyncBoundary>
          <FlexWrapper direction="column" gap={4}>
            <Typography
              fw="MEDIUM"
              fs={16}
              lh={20}
              style={{ paddingLeft: 2, paddingRight: 2 }}
            >
              이용 목적
            </Typography>
            {isPurposeInfoRequired(transportationEnum) && (
              <Typography
                fw="REGULAR"
                fs={14}
                lh={20}
                color="GRAY.600"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {purposeInfo(transportationEnum)}
              </Typography>
            )}
            <FormController
              name="purposeOfTransportation"
              required={required}
              control={control}
              renderItem={props => (
                <TextInput
                  {...props}
                  area
                  placeholder="이용 목적을 입력하세요"
                />
              )}
            />
          </FlexWrapper>
        </Card>
      </EvidenceBlockTitle>
    </FlexWrapper>
  );
};

export default TransportEvidenceBlock;
