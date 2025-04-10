import {
  addWeeks,
  differenceInHours,
  differenceInMinutes,
  startOfWeek,
} from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import styled from "styled-components";
import { z } from "zod";

import apiCms002 from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms002";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import Info from "@sparcs-clubs/web/common/components/Info";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Select from "@sparcs-clubs/web/common/components/Select";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";
import Timetable from "@sparcs-clubs/web/common/components/Timetable";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetCommonSpaces from "@sparcs-clubs/web/features/common-space/services/getCommonSpaces";
import useGetCommonSpaceUsageOrders from "@sparcs-clubs/web/features/common-space/services/getCommonSpaceUsageOrders";
import { CommonSpaceInfoProps } from "@sparcs-clubs/web/features/common-space/types/commonSpace";
import {
  formatSimpleSlashDate,
  formatTime,
} from "@sparcs-clubs/web/utils/Date/formatDate";

const StyledCardOuter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  flex: 1 0 0;
  align-self: stretch;
`;

const StyledCardLayout = styled(Card)`
  display: flex;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.lg}) {
    flex-wrap: wrap;
  }
`;

type UsageOrder = z.infer<
  (typeof apiCms002.responseBodyMap)[200]["shape"]["usageOrders"]["element"]
>;

const CommonSpaceInfoSecondFrame: React.FC<
  Partial<CommonSpaceInfoProps> & { onPrev: () => void; onNext: () => void }
> = ({ onPrev, onNext }) => {
  const { control, watch, setValue } = useFormContext();
  const { data, isLoading, isError } = useGetCommonSpaces();
  const [date, setDate] = useState(startOfWeek(new Date()));
  const [intermediateSelectedValue, setIntermediateSelectedValue] =
    useState("");
  const [showModal, setShowModal] = useState(false);

  const startTerm = useWatch({ control, name: "body.startTerm" });
  const endTerm = useWatch({ control, name: "body.endTerm" });

  const dateTimeRange: [Date, Date] | undefined = useMemo(
    () => (startTerm && endTerm ? [startTerm, endTerm] : undefined),
    [startTerm, endTerm],
  );

  const param = watch("param") || { spaceId: 0 };

  const setDateTimeRange: React.Dispatch<
    React.SetStateAction<[Date, Date] | undefined>
  > = useCallback(
    range => {
      const newRange =
        typeof range === "function" ? range(dateTimeRange) : range;
      if (newRange === undefined) {
        setValue("body.startTerm", undefined);
        setValue("body.endTerm", undefined);
        return;
      }
      if (newRange) {
        setValue("body.startTerm", newRange[0]);
        setValue("body.endTerm", newRange[1]);
      }
    },
    [setValue],
  );

  const {
    data: usageOrdersData,
    isLoading: isUsageOrdersLoading,
    isError: isUsageOrdersError,
  } = useGetCommonSpaceUsageOrders(
    { spaceId: param?.spaceId },
    { startDate: date, endTerm: addWeeks(date, 1) },
  );

  const space = useMemo(
    () =>
      data?.commonSpaces.find(
        item => item.id.toString() === param?.spaceId?.toString(),
      ),
    [data?.commonSpaces, param?.spaceId],
  );

  const disabledCells = useMemo(() => {
    if (!usageOrdersData) return [];
    const cells = Array(7 * 48).fill(false);
    usageOrdersData.usageOrders.forEach((order: UsageOrder) => {
      const start = order.startTerm;
      const end = order.endTerm;
      const cellStart = date;
      const cellEnd = addWeeks(date, 1);
      if (start >= cellStart && end <= cellEnd) {
        const startFill = differenceInMinutes(start, cellStart);
        const endFill = differenceInMinutes(end, cellStart);
        for (let i = startFill; i < endFill; i += 30) {
          cells[i / 30] = true;
        }
      } else if (start < cellStart && end > cellStart) {
        const startFill = 0;
        const endFill = differenceInMinutes(end, cellStart);
        for (let i = startFill; i < endFill; i += 30) {
          cells[i / 30] = true;
        }
      } else if (start < cellEnd && end > cellEnd) {
        const startFill = differenceInMinutes(start, cellStart);
        const endFill = 7 * 48;
        for (let i = startFill; i < endFill; i += 30) {
          cells[i / 30] = true;
        }
      }
    });
    return cells;
  }, [usageOrdersData, date]);

  const diffHours =
    dateTimeRange && differenceInHours(dateTimeRange[1], dateTimeRange[0]);

  const diffMinutes =
    dateTimeRange && differenceInMinutes(dateTimeRange[1], dateTimeRange[0]);

  const bodyStartTerm = watch("body.startTerm");
  const bodyEndTerm = watch("body.endTerm");

  useEffect(() => {
    if (!dateTimeRange) {
      return;
    }
    if (
      bodyStartTerm?.getTime() !== dateTimeRange[0]?.getTime() ||
      bodyEndTerm?.getTime() !== dateTimeRange[1]?.getTime()
    ) {
      setValue("body.startTerm", dateTimeRange[0]);
      setValue("body.endTerm", dateTimeRange[1]);
    }
  }, [dateTimeRange, setValue, bodyEndTerm, bodyStartTerm]);

  return (
    <>
      <AsyncBoundary isLoading={isLoading && !data} isError={isError}>
        <FormController
          name="param.spaceId"
          control={control}
          renderItem={({ onChange, value }) => (
            <>
              <Select
                items={
                  data?.commonSpaces.map(s => ({
                    value: s.id.toString(),
                    label: s.name,
                    selectable: true,
                  })) || []
                }
                value={value}
                onChange={val => {
                  if (dateTimeRange) {
                    setIntermediateSelectedValue(val);
                    setShowModal(true);
                  } else {
                    setValue("param.spaceId", parseInt(val));
                    onChange(val);
                  }
                }}
                label="공용공간"
              />
              {showModal && (
                <Modal isOpen={showModal}>
                  <CancellableModalContent
                    onClose={() => {
                      setShowModal(false);
                      setIntermediateSelectedValue("");
                    }}
                    onConfirm={() => {
                      setShowModal(false);
                      setValue(
                        "param.spaceId",
                        parseInt(intermediateSelectedValue),
                      );
                      onChange(intermediateSelectedValue);
                      setIntermediateSelectedValue("");
                      setDateTimeRange(undefined);
                    }}
                  >
                    공용공간을 변경하면 선택한 시간이 모두 초기화됩니다.
                    <br />
                    ㄱㅊ?
                  </CancellableModalContent>
                </Modal>
              )}
            </>
          )}
        />
      </AsyncBoundary>
      {space && (
        <>
          <Info
            text={`${space?.name}는 하루에 최대 ${space?.availableHoursPerDay}시간, 일주일에 최대 ${space?.availableHoursPerWeek}시간 사용할 수 있습니다.`}
          />
          <StyledCardLayout outline gap={20} style={{ flexDirection: "row" }}>
            <AsyncBoundary
              isLoading={isUsageOrdersLoading}
              isError={isUsageOrdersError}
            >
              <Timetable
                data={disabledCells}
                setDateTimeRange={setDateTimeRange}
                availableHoursPerDay={space?.availableHoursPerDay || 0}
                startDate={date}
                setStartDate={setDate}
              />
            </AsyncBoundary>
            <StyledCardOuter>
              {dateTimeRange && (
                <Card outline gap={20} style={{ marginTop: 64 }}>
                  <Typography fs={16} lh={20} fw="BOLD">
                    선택 시간
                  </Typography>
                  <Typography fs={14} lh={20} fw="REGULAR">
                    {formatSimpleSlashDate(dateTimeRange[0])}
                    {formatTime(dateTimeRange[0])}~
                    {formatTime(dateTimeRange[1])} ({`${diffHours}시간`}
                    {diffMinutes! % 60 ? ` ${diffMinutes! % 60}분` : ""})
                  </Typography>
                </Card>
              )}
            </StyledCardOuter>
          </StyledCardLayout>
        </>
      )}
      <StyledBottom>
        <Button onClick={onPrev}>이전</Button>
        <Button
          onClick={onNext}
          type={param?.spaceId && dateTimeRange ? "default" : "disabled"}
        >
          다음
        </Button>
      </StyledBottom>
    </>
  );
};

export default CommonSpaceInfoSecondFrame;
