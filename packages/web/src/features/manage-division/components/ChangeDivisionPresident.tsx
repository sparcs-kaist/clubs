import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import NotificationCard from "@sparcs-clubs/web/common/components/NotificationCard";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ChangeDivisionPresidentMessageContext,
  ChangeDivisionPresidentStatusEnum,
} from "@sparcs-clubs/web/constants/changeDivisionPresident";

type ManageDivisionPresidentStatusEnum =
  | typeof ChangeDivisionPresidentStatusEnum.Requested
  | typeof ChangeDivisionPresidentStatusEnum.Canceled
  | typeof ChangeDivisionPresidentStatusEnum.Rejected;

interface ChangeDivisionPresidentProps {
  status: ManageDivisionPresidentStatusEnum;
  actingPresident: boolean;
  change?: [string, string];
}

const ChangeDivisionPresident: React.FC<ChangeDivisionPresidentProps> = ({
  status = ChangeDivisionPresidentStatusEnum.Requested,
  actingPresident = true,
  change = undefined,
}: ChangeDivisionPresidentProps) => {
  const notificationStatus =
    status === ChangeDivisionPresidentStatusEnum.Rejected ? "Error" : "Success";
  const messageContext = new ChangeDivisionPresidentMessageContext({
    actingPresident,
    division: "'생활체육' 분과",
    status,
    page: "/manage-division",
    change,
    isModal: false,
  });

  return (
    <NotificationCard
      status={notificationStatus}
      header={messageContext.getHeader()}
    >
      <FlexWrapper gap={8} direction="column">
        <Typography fs={16} lh={24} style={{ whiteSpace: "pre-wrap" }}>
          {messageContext.getBody()}
        </Typography>
        {status === ChangeDivisionPresidentStatusEnum.Requested && (
          <Typography fs={16} lh={24}>
            {messageContext.getRequestNotice()}
          </Typography>
        )}
      </FlexWrapper>
    </NotificationCard>
  );
};

export default ChangeDivisionPresident;
