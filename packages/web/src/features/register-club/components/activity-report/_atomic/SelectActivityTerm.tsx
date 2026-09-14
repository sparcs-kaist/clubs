import { useFormatter, useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ActivityReportFormData } from "@sparcs-clubs/web/features/activity-report/types/form";
import { Duration } from "@sparcs-clubs/web/features/register-club/types/registerClub";

import EditActivityTermModal from "../EditActivityTermModal";
import EditProvisionalActivityTermModal from "../EditProvisionalActivityTermModal";

type ActivityTermSource = "regular" | "provisional";

interface SelectActivityTermProps {
  onChange?: (data: Duration[]) => void;
  source?: ActivityTermSource;
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
  source = "regular",
}) => {
  const t = useTranslations("my.registration.activity");
  const format = useFormatter();
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

      const ModalComponent =
        source === "provisional"
          ? EditProvisionalActivityTermModal
          : EditActivityTermModal;

      return (
        <ModalComponent
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
        {t("period")}
      </Typography>

      <ActivityTermArea onClick={handleTerm}>
        <ActivityTermContent>
          {activityTermList.length > 0 &&
          activityTermList[0].startTerm &&
          activityTermList[0].endTerm
            ? `${format.dateTime(new Date(activityTermList[0].startTerm), { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" })} ~ ${format.dateTime(new Date(activityTermList[0].endTerm), { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" })}${activityTermList.length > 1 ? t("additionalPeriods", { count: activityTermList.length - 1 }) : ""}`
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
          {t("edit")}
        </Typography>
      </ActivityTermArea>
    </FlexWrapper>
  );
};

export default SelectActivityTerm;
