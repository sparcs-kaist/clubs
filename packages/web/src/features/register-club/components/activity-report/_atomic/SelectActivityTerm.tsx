import { overlay } from "overlay-kit";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ActivityReportFormData } from "@sparcs-clubs/web/features/activity-report/types/form";
import { Duration } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import { formatDotDate } from "@sparcs-clubs/web/utils/Date/formatDate";

import EditActivityTermModal from "../EditActivityTermModal";

interface SelectActivityTermProps {
  onChange?: (data: Duration[]) => void;
}

const ActivityTermArea = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  outline: none;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  gap: 8px;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ theme }) => theme.colors.BLACK};
  background-color: ${({ theme }) => theme.colors.WHITE};
  &:hover {
    cursor: pointer;
  }
`;

const ActivityTermContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
`;

const SelectActivityTerm: React.FC<SelectActivityTermProps> = ({
  onChange = () => {},
}) => {
  const { control, watch } = useFormContext<ActivityReportFormData>();
  const durations = watch("durations");

  const [activityTermList, setActivityTermList] = useState<Duration[]>(
    durations || [],
  );

  const handleTerm = () => {
    overlay.open(({ isOpen, close }) => {
      const handleConfirm = (terms: Duration[]) => {
        setActivityTermList(terms);
        onChange(terms);
        close();
      };

      return (
        <EditActivityTermModal
          isOpen={isOpen}
          control={control}
          onClose={close}
          onConfirm={handleConfirm}
        />
      );
    });
  };

  return (
    <FlexWrapper direction="column" gap={4} style={{ width: "100%" }}>
      <Typography fw="MEDIUM" fs={16} lh={20}>
        활동 기간
      </Typography>

      <ActivityTermArea onClick={handleTerm}>
        <ActivityTermContent>
          {activityTermList.length > 0 &&
          activityTermList[0].startTerm &&
          activityTermList[0].endTerm
            ? `${formatDotDate(activityTermList[0].startTerm)} ~ ${formatDotDate(
                activityTermList[0].endTerm,
              )}${activityTermList.length > 1 ? ` 외 ${activityTermList.length - 1}개` : ""}`
            : ""}
        </ActivityTermContent>

        <Typography
          fw="MEDIUM"
          fs={16}
          lh={20}
          color="PRIMARY"
          style={{
            textDecoration: "underline",
          }}
        >
          수정
        </Typography>
      </ActivityTermArea>
    </FlexWrapper>
  );
};

export default SelectActivityTerm;
